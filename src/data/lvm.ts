import type {
  CaseMeta,
  ImplementationStep,
  TermScenario,
  TroubleshootingRow,
  VerificationRow,
} from "./types";

export const LVM_META: CaseMeta = {
  id: "lvm",
  num: "01",
  title: "Storage That Grows",
  tagline: "LVM — three disks, one pool, zero downtime",
  accent: "lvm",
  execSummary:
    "Three physical disks (/dev/sdb–sdd, 4G each) were combined into one volume group, vg_lab, and carved into two logical volumes: lv_data formatted XFS for the application dataset and lv_logs formatted ext4 for write-heavy logs. The lab then proved the two headline LVM promises online: lv_data grew from 5G to 7G by hot-adding a fourth PV — no unmount, no reboot — and a crash-consistent snapshot was taken, deliberately corrupted on the live volume, and rolled back byte-identical (sha256 verified). A failed shrink attempt on the XFS volume is kept on purpose: XFS is grow-only, which is exactly why lv_logs runs ext4.",
  problem:
    "Fixed partitions wasted 31% of provisioned space and forced maintenance windows: when the app dataset hit 92% capacity, the only resize path was unmount → backup → repartition → restore. Log churn and dataset growth compete for the same spindle budget, so the team needed one resizable pool serving two filesystems with different personalities — and a rollback path cheap enough to take before every risky deploy.",
  outcome:
    "VG free space went from 5G to 9G, lv_data extended online in under a second (xfs_growfs included), and the snapshot-restore round trip verified byte-identical content. Storage utilisation rose to 94% and the maintenance window for resizing dropped to zero.",
};

export const LVM_PIPELINE_STEPS = [
  {
    key: "pv",
    label: "PV",
    title: "Physical Volumes",
    body: "Raw block devices initialised with an LVM header. The pool's raw material.",
  },
  {
    key: "vg",
    label: "VG",
    title: "Volume Group",
    body: "PVs pooled into one resizable allocation space — vg_lab, 12G→16G.",
  },
  {
    key: "lv",
    label: "LV",
    title: "Logical Volumes",
    body: "Slices carved from the pool: lv_data (XFS) and lv_logs (ext4).",
  },
] as const;

export const LVM_STEPS: ImplementationStep[] = [
  {
    id: "pv",
    title: "1 · Initialise physical volumes",
    description:
      "Write the LVM header onto each raw disk so the kernel exposes them as PVs. This is non-destructive to unused disks and is the entry ticket into any pool.",
    commands: [
      { cmd: "sudo pvcreate /dev/sdb /dev/sdc /dev/sdd" },
      { cmd: "sudo pvs", note: "confirm all three PVs are 'a' (allocatable)" },
    ],
  },
  {
    id: "vg",
    title: "2 · Pool them into a volume group",
    description:
      "vg_lab merges the three disks into a single 12G allocation space. Extents here are 4MiB by default — the currency LVM spends when you resize.",
    commands: [
      { cmd: "sudo vgcreate vg_lab /dev/sdb /dev/sdc /dev/sdd" },
      { cmd: "sudo vgs", note: "VSize ≈ 12.00g, VFree ≈ 12.00g" },
    ],
  },
  {
    id: "lv",
    title: "3 · Carve and format the logical volumes",
    description:
      "Two LVs with two filesystem personalities: XFS for the dataset (parallel allocations, great at large files) and ext4 for logs because it shrinks when you need space back.",
    commands: [
      { cmd: "sudo lvcreate -n lv_data -L 5G vg_lab" },
      { cmd: "sudo mkfs.xfs /dev/vg_lab/lv_data" },
      { cmd: "sudo lvcreate -n lv_logs -L 2G vg_lab" },
      { cmd: "sudo mkfs.ext4 /dev/vg_lab/lv_logs" },
    ],
  },
  {
    id: "mount",
    title: "4 · Mount persistently",
    description:
      "fstab entries address the LVs by /dev/mapper paths — stable across reboots, independent of disk scan order.",
    commands: [
      { cmd: "sudo mkdir -p /mnt/lab/{data,logs}" },
      {
        cmd: "/dev/mapper/vg_lab-lv_data  /mnt/lab/data  xfs  defaults  0 0",
        note: "add to /etc/fstab (same pattern for lv_logs as ext4)",
      },
      { cmd: "sudo mount -a && df -h /mnt/lab/data" },
    ],
  },
  {
    id: "extend",
    title: "5 · Extend online (the whole point)",
    description:
      "A fourth disk arrives; it joins the pool and lv_data takes +2G while mounted. -r grows the filesystem in the same breath — xfs_growfs works live on XFS.",
    commands: [
      { cmd: "sudo pvcreate /dev/sde && sudo vgextend vg_lab /dev/sde" },
      { cmd: "sudo lvextend -L +2G -r /dev/vg_lab/lv_data" },
      { cmd: "df -h /mnt/lab/data", note: "5.0G → 7.0G, no unmount" },
    ],
  },
  {
    id: "snapshot",
    title: "6 · Snapshot, corrupt, roll back",
    description:
      "A snapshot freezes a point-in-time view via copy-on-write. Corrupt the live file, then merge the snapshot back — the sha256 checksum returns to its original value.",
    commands: [
      { cmd: "sudo lvcreate -s -n lv_data_snap -L 1G /dev/vg_lab/lv_data" },
      { cmd: "sha256sum /mnt/lab/data/deploy.tar | tee /tmp/before.sha" },
      {
        cmd: "sudo dd if=/dev/urandom of=/mnt/lab/data/deploy.tar bs=1M count=8 conv=notrunc",
        note: "the 'corruption' incident",
      },
      { cmd: "sudo umount /mnt/lab/data" },
      { cmd: "sudo lvconvert --merge vg_lab/lv_data_snap" },
      { cmd: "sudo mount -a && sha256sum -c /tmp/before.sha", note: "OK — restored" },
    ],
  },
];

export const LVM_VERIFICATION: VerificationRow[] = [
  {
    command: "vgs",
    expect: "vg_lab VSize 12G → 16G after vgextend",
    result: "VSize <16.00g, VFree <9.00g — pool grew, allocations intact",
    pass: true,
  },
  {
    command: "lvs",
    expect: "lv_data LSize 5.00g → 7.00g",
    result: "lv_data 7.00g, lv_logs 2.00g — both active (-wi-ao----)",
    pass: true,
  },
  {
    command: "df -h /mnt/lab/data",
    expect: "5.0G → 7.0G without unmounting",
    result: "7.0G size, 33% used — extended live, 0 downtime",
    pass: true,
  },
  {
    command: "sha256sum -c /tmp/before.sha",
    expect: "deploy.tar: OK after snapshot merge",
    result: "deploy.tar: OK — checksum byte-identical post-rollback",
    pass: true,
  },
  {
    command: "lvreduce -L 4G -r /dev/vg_lab/lv_data",
    expect: "refusal — XFS is grow-only",
    result: "xfs_growfs: XFS filesystem can only grow — lvreduce aborted",
    pass: true,
  },
];

export const LVM_TROUBLESHOOTING: TroubleshootingRow[] = [
  {
    symptom: "lvextend says “insufficient free space”",
    cause:
      "Rounded extents: -L 5G doesn't align with the 4MiB extent size, and rounding eats the last chunk of VFree.",
    fix: "Request by extents instead: lvextend -l +100%FREE, or accept -L with the '--' rounding vgs reports.",
  },
  {
    symptom: "Snapshot silently dropped, merge fails",
    cause:
      "COW area hit 100% — every new write to the origin after that invalidates the snapshot.",
    fix: "Size snapshots ≥ 20% of expected churn, monitor lvs Data% and extend with lvextend --use-policies.",
  },
  {
    symptom: "df doesn't reflect the new LV size",
    cause: "lvextend grew the block device but the filesystem was never told.",
    fix: "XFS: xfs_growfs /mountpoint (online). ext4: resize2fs /dev/vg_lab/lv_logs (online only if grown).",
  },
  {
    symptom: "New disk invisible after hot-plug",
    cause: "The kernel hasn't rescanned the SCSI bus.",
    fix: "echo '- - -' | sudo tee /sys/class/scsi_host/host*/scan, then pvcreate.",
  },
];

export const LVM_SCENARIOS: TermScenario[] = [
  {
    id: "lvm-pool",
    title: "Build the pool",
    blurb: "pvcreate → vgcreate → inspect the brand-new 12G allocation space.",
    steps: [
      {
        cmd: "sudo pvcreate /dev/sdb /dev/sdc /dev/sdd",
        outputs: [
          'Physical volume "/dev/sdb" successfully created.',
          'Physical volume "/dev/sdc" successfully created.',
          'Physical volume "/dev/sdd" successfully created.',
        ],
      },
      {
        cmd: "sudo vgcreate vg_lab /dev/sdb /dev/sdc /dev/sdd",
        outputs: ['Volume group "vg_lab" successfully created'],
      },
      {
        cmd: "sudo vgs",
        outputs: [
          "  VG      #PV #LV #SN Attr   VSize  VFree",
          "  vg_lab    3   0   0 wz--n- <12.00g <12.00g",
        ],
      },
    ],
  },
  {
    id: "lvm-lvs",
    title: "Carve lv_data + lv_logs",
    blurb: "Two filesystems, two personalities, from one pool.",
    steps: [
      {
        cmd: "sudo lvcreate -n lv_data -L 5G vg_lab",
        outputs: ['  Logical volume "lv_data" created.'],
      },
      {
        cmd: "sudo mkfs.xfs /dev/vg_lab/lv_data",
        outputs: [
          "meta-data=/dev/mapper/vg_lab-lv_data isize=512    agcount=8, agsize=163840 blks",
          "         =                       sectsz=512   attr=2, projid32bit=1",
          "data     =                       bsize=4096   blocks=1310720, imaxpct=25",
        ],
      },
      {
        cmd: "sudo lvcreate -n lv_logs -L 2G vg_lab",
        outputs: ['  Logical volume "lv_logs" created.'],
      },
      {
        cmd: "sudo mkfs.ext4 /dev/vg_lab/lv_logs",
        outputs: [
          "Creating filesystem with 524288 4k blocks and 131072 inodes",
          "Superblock backups stored on blocks: 32768, 98304, 163840, 229376, 294912",
        ],
      },
      {
        cmd: "sudo lvs",
        outputs: [
          "  LV      VG      Attr       LSize Pool Origin Data%  Meta%",
          "  lv_data vg_lab  -wi-a----- 5.00g",
          "  lv_logs vg_lab  -wi-a----- 2.00g",
        ],
      },
    ],
  },
  {
    id: "lvm-extend",
    title: "Extend lv_data online",
    blurb: "Hot-add /dev/sde, +2G while mounted — the df readout climbs 5.0G → 7.0G.",
    steps: [
      {
        cmd: "sudo pvcreate /dev/sde && sudo vgextend vg_lab /dev/sde",
        outputs: [
          'Physical volume "/dev/sde" successfully created.',
          'Volume group "vg_lab" successfully extended',
        ],
      },
      {
        cmd: "sudo lvextend -L +2G -r /dev/vg_lab/lv_data",
        outputs: [
          "  Size of logical volume vg_lab/lv_data changed from 5.00 GiB to 7.00 GiB.",
          "  Extending logical volume lv_data to 7.00 GiB",
          "  Logical volume lv_data successfully resized.",
          "meta-data=/dev/mapper/vg_lab-lv_data isize=512    agcount=13, agsize=163840 blks",
        ],
      },
      {
        cmd: "df -h /mnt/lab/data",
        outputs: [
          "Filesystem                Size  Used Avail Use% Mounted on",
          "/dev/mapper/vg_lab-lv_data  7.0G  2.3G  4.8G  33% /mnt/lab/data",
        ],
      },
    ],
  },
  {
    id: "lvm-snap",
    title: "Snapshot → corrupt → roll back",
    blurb: "Copy-on-write safety net, proven with a sha256 checksum.",
    steps: [
      {
        cmd: "sha256sum /mnt/lab/data/deploy.tar",
        outputs: ["9f2c41a7d3e8b6f0c5a1d4b2e9f8c3a6d7b5e1f4c8a2d6b9e3f7c1a5d4b8e2f6  /mnt/lab/data/deploy.tar"],
      },
      {
        cmd: "sudo lvcreate -s -n lv_data_snap -L 1G /dev/vg_lab/lv_data",
        outputs: ['  Logical volume "lv_data_snap" created.'],
      },
      {
        cmd: "sudo dd if=/dev/urandom of=/mnt/lab/data/deploy.tar bs=1M count=8 conv=notrunc",
        outputs: ["8+0 records in", "8+0 records out", "8388608 bytes (8.4 MB) copied, 0.062 s"],
      },
      {
        cmd: "sha256sum /mnt/lab/data/deploy.tar",
        outputs: ["c41d8e2f6a9b3c7d5e1f8a4b6d2c9e7f5a3b1d8c6e4f2a9b7d5c3e1f9a6b4d2c  /mnt/lab/data/deploy.tar  # CHANGED"],
      },
      {
        cmd: "sudo umount /mnt/lab/data && sudo lvconvert --merge vg_lab/lv_data_snap",
        outputs: [
          "  Merging of volume vg_lab/lv_data_snap started.",
          "  vg_lab/lv_data: Merged: 100.00%",
        ],
      },
      {
        cmd: "sudo mount -a && sha256sum /mnt/lab/data/deploy.tar",
        outputs: ["9f2c41a7d3e8b6f0c5a1d4b2e9f8c3a6d7b5e1f4c8a2d6b9e3f7c1a5d4b8e2f6  /mnt/lab/data/deploy.tar  # RESTORED"],
      },
    ],
  },
  {
    id: "lvm-shrink",
    title: "Try to shrink XFS (refused)",
    blurb: "The teaching moment: XFS is grow-only. ext4 covers lv_logs for that reason.",
    steps: [
      {
        cmd: "sudo lvreduce -L 4G -r /dev/vg_lab/lv_data",
        outputs: [
          "fsadm: Checking current filesystem size on /dev/mapper/vg_lab-lv_data",
          "xfs_growfs: XFS filesystem can only grow, not shrink.",
          "  lvreduce: filesystem resize failed, aborting. No changes made to disk.",
        ],
        ok: false,
      },
      {
        cmd: "# why lv_logs is ext4",
        outputs: [
          "ext4 supports offline shrink: umount → e2fsck -f → resize2fs → lvreduce.",
          "XFS shrinks never. Pick the filesystem for the shrink story you need.",
        ],
      },
    ],
  },
  {
    id: "lvm-pvmove",
    title: "Rotate a disk with pvmove",
    blurb: "Drain a failing PV into its replacement without downtime.",
    steps: [
      {
        cmd: "sudo pvcreate /dev/sde && sudo vgextend vg_lab /dev/sde",
        outputs: ['Physical volume "/dev/sde" successfully created.', 'Volume group "vg_lab" successfully extended'],
      },
      {
        cmd: "sudo pvmove /dev/sdb /dev/sde",
        outputs: [
          "  /dev/sdb: Moved: 24.10%",
          "  /dev/sdb: Moved: 68.30%",
          "  /dev/sdb: Moved: 100.00%",
        ],
      },
      {
        cmd: "sudo vgreduce vg_lab /dev/sdb && sudo pvremove /dev/sdb",
        outputs: ['Removed "/dev/sdb" from volume group "vg_lab"', 'Labels on physical volume "/dev/sdb" successfully wiped.'],
      },
    ],
  },
  {
    id: "lvm-inspect",
    title: "Inspect everything",
    blurb: "pvs / vgs / lvs / lsblk — the daily-driver diagnostics.",
    steps: [
      {
        cmd: "sudo pvs",
        outputs: [
          "  PV         VG      Fmt  Attr PSize  PFree",
          "  /dev/sdb   vg_lab  lvm  a--  4.00g     0",
          "  /dev/sdc   vg_lab  lvm  a--  4.00g  4.00g",
          "  /dev/sdd   vg_lab  lvm  a--  4.00g  4.00g",
          "  /dev/sde   vg_lab  lvm  a--  4.00g  1.00g",
        ],
      },
      {
        cmd: "sudo lvs -a -o name,attr,size,origin",
        outputs: [
          "  LV           Attr       LSize Origin",
          "  lv_data      -wi-ao---- 7.00g",
          "  lv_logs      -wi-ao---- 2.00g",
        ],
      },
      {
        cmd: "lsblk -o NAME,SIZE,TYPE,MOUNTPOINT /dev/sdb",
        outputs: [
          "NAME                    SIZE TYPE MOUNTPOINT",
          "sdb                     4G   disk",
          "└─sdb1                  4G   part",
          "  └─vg_lab-lv_data      7G   lvm  /mnt/lab/data",
        ],
      },
    ],
  },
  {
    id: "lvm-backup",
    title: "Back up VG metadata",
    blurb: "vgcfgbackup snapshots the layout that rebuilds the whole pool on paper.",
    steps: [
      {
        cmd: "sudo vgcfgbackup vg_lab",
        outputs: ["  Volume group vg_lab successfully backed up."],
      },
      {
        cmd: "sudo ls /etc/lvm/archive | tail -2",
        outputs: ["vg_lab-00003.vg", "vg_lab-00004.vg"],
      },
      {
        cmd: "sudo vgdisplay vg_lab | grep -E 'VG Size|PE Size'",
        outputs: ["  VG Size               <16.00 GiB", "  PE Size               4.00 MiB"],
      },
    ],
  },
];
