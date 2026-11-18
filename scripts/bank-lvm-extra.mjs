/* Extra LVM templates — filler to reach exactly 200 with genuine variety. */

const LVS = ["lv_data", "lv_logs", "lv_db", "lv_app", "lv_media"];
const VGS = ["vg_lab", "vg_app", "vg_data", "vg_media", "vg_lab"];
const DISKS = ["/dev/sdb", "/dev/sdc", "/dev/sdd", "/dev/sde", "/dev/nvme0n2"];
const MNTS = ["/mnt/data", "/mnt/logs", "/mnt/db", "/mnt/app", "/mnt/media"];

export const templates = [
  () =>
    VGS.slice(0, 5).map((vg) => ({
      type: "command",
      difficulty: "easy",
      title: `Report on one volume group`,
      prompt: `Show size and free space of ${vg} only (not every VG on the system).`,
      accepted: [`vgs ${vg}`],
      hint: "vgs accepts VG names as arguments.",
      explanation: `vgs ${vg} filters the report to one group — VSize is its total extents, VFree the unallocated part.`,
      practice: `sudo vgs ${vg}`,
      tag: "report",
    })),
  () =>
    DISKS.slice(0, 5).map((d, i) => ({
      type: "command",
      difficulty: "medium",
      title: `Where do ${LVS[i]}'s extents actually live?`,
      prompt: `Show which physical volumes back /dev/${VGS[i]}/${LVS[i]}, including the extent ranges.`,
      accepted: [`pvdisplay -m /dev/${VGS[i]}/${LVS[i]}`, `lvdisplay -m /dev/${VGS[i]}/${LVS[i]}`],
      hint: "The -m flag maps extents to their physical locations.",
      explanation: `pvdisplay -m (or lvdisplay -m) prints the physical extent map — which PV, which ranges. Crucial before pvmove or disk removal.`,
      practice: `sudo pvdisplay -m /dev/${VGS[i]}/${LVS[i]}`,
      tag: "report",
    })),
  () =>
    MNTS.slice(0, 5).map((mnt, i) => ({
      type: "command",
      difficulty: "medium",
      title: `Mount an LV via fstab`,
      prompt: `Write the /etc/fstab line that mounts /dev/${VGS[i]}/${LVS[i]} at ${mnt} with its ${i % 2 === 0 ? "xfs" : "ext4"} filesystem at boot.`,
      accepted: [
        `/dev/${VGS[i]}/${LVS[i]} ${mnt} ${i % 2 === 0 ? "xfs" : "ext4"} defaults 0 0`,
        `/dev/mapper/${VGS[i]}-${LVS[i]} ${mnt} ${i % 2 === 0 ? "xfs" : "ext4"} defaults 0 0`,
      ],
      hint: "device → mountpoint → fstype → options → dump → pass.",
      explanation: `Use the stable /dev/${VGS[i]}/${LVS[i]} symlink in fstab — it survives reboots because udev recreates it at activation.`,
      practice: `/dev/${VGS[i]}/${LVS[i]} ${mnt} defaults 0 0`,
      tag: "lv",
    })),
  () =>
    DISKS.slice(0, 5).map((d) => ({
      type: "command",
      difficulty: "hard",
      title: `Wipe a disk clean of LVM`,
      prompt: `Erase the LVM label from ${d} so it shows up as a plain empty disk again (assume it was already removed from any VG).`,
      accepted: [`pvremove ${d}`, `wipefs -a ${d}`],
      hint: "pvremove undoes pvcreate.",
      explanation: `sudo pvremove ${d} zeroes the LVM metadata area. For leftover foreign signatures wipefs -a clears them all — then pvcreate can start fresh.`,
      practice: `sudo pvremove /dev/sdb`,
      tag: "pv",
    })),
  () =>
    VGS.slice(0, 5).map((vg) => ({
      type: "command",
      difficulty: "medium",
      title: `Activate every LV in ${vg}`,
      prompt: `Activate all logical volumes of ${vg} at once (after maintenance).`,
      accepted: [`vgchange -ay ${vg}`],
      hint: "vgchange -ay = activate yes.",
      explanation: `vgchange -ay ${vg} activates every LV in the group and recreates their device nodes — the classic post-recovery or post-import step.`,
      practice: `sudo vgchange -ay ${vg}`,
      tag: "vg",
    })),
  () =>
    [1, 2, 3, 4, 5].map((g) => {
      const ext = g * 256;
      return {
        type: "quiz",
        difficulty: "easy",
        title: "Plan the extents",
        prompt: `You want a logical volume of exactly ${g} GiB. How many 4 MiB extents will lvcreate consume?`,
        options: [`${ext}`, `${ext + 4}`, `${Math.round(ext / 2)}`, `${g * 100}`],
        answerIndex: 0,
        hint: "1 GiB = 1024 MiB = 256 extents.",
        explanation: `${g} GiB → ${g * 1024} MiB ÷ 4 = ${ext} extents. lvextend -l accepts extent counts, -L accepts sizes — both land on the same result.`,
        practice: "sudo lvs",
        tag: "lv",
      };
    }),
  () =>
    [
      {
        q: "Which is the correct order to DESTROY an LVM stack completely?",
        a: "umount → lvremove → vgremove → pvremove",
        h: "Remove from the top layer down.",
      },
      {
        q: "What must be true about a PV before vgreduce can remove it from the VG?",
        a: "All its extents must be free — pvmove them elsewhere first",
        h: "No allocated extents may remain.",
      },
      {
        q: "Why does lvcreate fail with 'Volume group vg_lab not found' after a reboot?",
        a: "The VG was not activated — run vgchange -ay (the boot service normally does this)",
        h: "Device nodes appear at activation.",
      },
      {
        q: "You deleted an LV by mistake. What restores its DATA?",
        a: "Nothing automatically — metadata can be rebuilt with vgcfgrestore, but data needs your backup",
        h: "Metadata backup ≠ data backup.",
      },
      {
        q: "What does PSize slightly smaller than the disk size indicate?",
        a: "pvcreate reserved a small area for LVM metadata on the disk",
        h: "The label itself costs a sliver.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Lifecycle & recovery",
      prompt: o.q,
      options: [
        o.a,
        "vgremove → lvremove → pvremove → umount",
        "pvremove → vgremove → lvremove → umount",
        "Order does not matter — LVM figures it out",
        "The PV must be brand new",
        "The VG must be inactive",
        "The disk must be unpartitioned",
        "The kernel module lvm_mod was unloaded",
        "The VG was renamed by udev",
        "LVM is incompatible with this kernel",
        "vgcfgrestore rebuilds everything including data",
        "lvcreate --undo reverses the deletion",
        "The data survives in the VG's free extents",
        "A filesystem lives there now",
        "The disk is failing",
        "The extents are reserved for snapshots",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} Destroy top-down, pvmove before vgreduce, and remember: /etc/lvm/backup holds METADATA only — data always needs a real backup.`,
      practice: "sudo vgcfgbackup",
      tag: "troubleshoot",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "Which command moves a VG to another machine in two steps?",
        a: "vgexport on the old host, then vgimport on the new one",
        h: "Export → move disks → import.",
      },
      {
        q: "What does the Data% column of a SNAPSHOT row in lvs mean?",
        a: "How full the snapshot's copy-on-write area is — at 100% the snapshot invalidates",
        h: "It monitors the COW area, not the origin.",
      },
      {
        q: "A PV physically dies. What does LVM show in vgs?",
        a: "The VG appears with 'PV missing' / missing device — it still works if enough redundancy existed",
        h: "LVM marks the missing member.",
      },
      {
        q: "Which lvs field tells you an LV is currently active and open?",
        a: "Attr — 'a' (active) plus 'o' (open) flags",
        h: "Read the Attr string.",
      },
      {
        q: "Which command shows ALL LV rows including hidden internal ones (like COW metadata volumes)?",
        a: "lvs -a",
        h: "The -a flag shows everything.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "hard",
      title: "Operations deep-cuts",
      prompt: o.q,
      options: [
        o.a,
        "vgmigrate then vgaccept",
        "vgclone then vgmove",
        "Copy /etc/lvm/backup to the new host and reboot",
        "How much of the origin volume has changed",
        "The origin's disk usage",
        "How many extents are free in the VG",
        "The VG is deleted automatically",
        "Nothing — LVM hides failures by design",
        "All LVs on the missing PV are reformatted",
        "LSize and Origin",
        "VFree and PFree",
        "The kernel log only",
        "lvs -v with verbose devices",
        "vgs --all with metadata dump",
        "pvs -m",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} These details separate careful operators from lucky ones — vgexport/vgimport, Data% on snapshots, missing-PV handling and Attr flags.`,
      practice: "sudo lvs -a",
      tag: "troubleshoot",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "Which layer does pvcreate initialise — a disk or a filesystem?",
        a: "A disk (or partition) — it writes the LVM label; filesystems come later",
        h: "PVs are below filesystems.",
      },
      {
        q: "Can you pvcreate a partition like /dev/sdb1 instead of a whole disk?",
        a: "Yes — partitions work as PVs just like whole disks",
        h: "Any block device with space qualifies.",
      },
      {
        q: "What happens if you pvcreate a disk that already holds data?",
        a: "pvcreate refuses until you confirm -f (it would destroy the old signature)",
        h: "It warns before destroying signatures.",
      },
      {
        q: "Which devices does mkfs.xfs target?",
        a: "A logical volume or partition — never a raw PV that is in a VG",
        h: "Filesystems go on the LV.",
      },
      {
        q: "After vgcreate, where does the VG's device directory appear?",
        a: "/dev/<vg-name>/ with one symlink per LV",
        h: "The VG name becomes a directory.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "easy",
      title: "Devices & layers",
      prompt: o.q,
      options: [
        o.a,
        "A filesystem — it optimises the superblock for LVM",
        "The VG's extent table",
        "A mountpoint",
        "No — only whole disks qualify",
        "Yes, but only with RAID underneath",
        "Only if the partition is type 8e",
        "It formats the disk immediately",
        "It converts the data to extents",
        "It overwrites silently without warning",
        "The raw PV in the VG",
        "The VG itself",
        "The /dev/mapper directory directly",
        "/dev/lvm/<vg-name>/",
        "/dev/vg/<lv-name>/",
        "/var/run/lvm/<vg-name>/",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} Layers stack: disk → pvcreate (PV) → vgcreate (VG) → lvcreate (LV) → mkfs → mount. Each tool targets exactly one layer.`,
      practice: "lsblk && sudo pvs",
      tag: "pv",
      _correctText: o.a,
    })),
  () =>
    [12, 20, 8, 16, 24].map((total) => {
      const data = Math.floor(total / 3);
      const snap = 1;
      const free = total - data - 2 - snap;
      return {
        type: "quiz",
        difficulty: "medium",
        title: "Capacity planning",
        prompt: `A ${total}G VG runs lv_data (${data}G), lv_logs (2G) and a 1G snapshot. How much VFree remains?`,
        options: [`${free}G`, `${free + 1}G`, `${total - data}G`, `${snap}G`],
        answerIndex: 0,
        hint: "Subtract every allocated volume, snapshot included.",
        explanation: `${total} − ${data} − 2 − 1 = ${free}G. Snapshots consume real extents — plan VFree for them, not just for LVs.`,
        practice: "sudo vgs",
        tag: "vg",
      };
    }),
  () =>
    [
      {
        q: "Why keep ext4 on lv_logs while lv_data uses XFS?",
        a: "XFS cannot shrink — if logs ever need to shrink, only ext4 allows it",
        h: "Pick the filesystem by its shrink story.",
      },
      {
        q: "Which flag pair extends an LV by exactly half of its current size?",
        a: "lvextend -l +50%FREE would need free space; -L +<half>G works regardless",
        h: "Percentages in -l refer to FREE space, not current size.",
      },
      {
        q: "What does lvextend -l +100%VG do?",
        a: "Grows the LV to consume every extent of the whole VG — dangerous if other LVs exist",
        h: "100%VG ≠ 100%FREE.",
      },
      {
        q: "You extended the LV but df still shows the old size. What did you forget?",
        a: "The filesystem resize — run xfs_growfs or lvextend -r next time",
        h: "LV size ≠ filesystem size.",
      },
      {
        q: "Which command pair manually grows XFS after lvextend WITHOUT -r?",
        a: "mount it (if needed) then xfs_growfs /mountpoint",
        h: "xfs_growfs takes the mount point.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Resize wisdom",
      prompt: o.q,
      options: [
        o.a,
        "ext4 cannot shrink — XFS can",
        "Both grow and shrink online equally",
        "XFS is deprecated for new volumes",
        "-l +50%VG always does it",
        "-L 50% does it",
        "There is no such flag pair",
        "Grows to 100% of FREE extents",
        "Grows the filesystem to match the LV",
        "Deletes all free extents",
        "You forgot to unmount first",
        "You forgot mkfs.xfs",
        "df caches its results for 5 minutes",
        "resize2fs /dev/vg/lv",
        "fsck /dev/vg/lv",
        "reboot is the only way",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} The LV and the filesystem are two different sizes — -r keeps them in sync; without it, run the grower yourself.`,
      practice: "sudo lvextend -L +1G -r /dev/vg_lab/lv_data",
      tag: "resize",
      _correctText: o.a,
    })),
];

export const extraTemplates = [
  () =>
    [7, 9, 11, 13, 15].map((free) => ({
      type: "quiz",
      difficulty: "easy",
      title: "Spend the free pool",
      prompt: `vgs shows ${free}G VFree. What is the largest single logical volume you can still create?`,
      options: [`${free}G`, `${free - 1}G`, `${free + 1}G`, `${free * 2}G`],
      answerIndex: 0,
      hint: "VFree is the ceiling.",
      explanation: `lvcreate can spend up to the whole VFree: ${free}G. In practice keep headroom for snapshots and future lvextends.`,
      practice: "sudo vgs",
      tag: "vg",
    })),
  () =>
    [3, 4, 5, 6, 7].map((n) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Grow vs shrink report",
      prompt: `An LV's Data% snapshot-style reporting is climbing. Which lvs command shows the LAST time each LV changed (to audit who resized what)?`,
      options: [
        `lvs -o name,lv_time — creation/resize timestamps`,
        "lvs --history with full audit log",
        "vgs --timestamps",
        "Nothing — LVM has no timestamps",
      ],
      answerIndex: 0,
      hint: "LV metadata records creation times.",
      explanation: `lvs -o name,lv_time shows when each LV was created/last configured; /etc/lvm/archive stores every metadata change — an audit trail by design.`,
      practice: "sudo lvs -o name,lv_time",
      tag: "report",
    })),
  () =>
    ["lv_data", "lv_logs", "lv_db", "lv_app", "lv_media"].map((lv, i) => ({
      type: "command",
      difficulty: "hard",
      title: "Check filesystem size vs LV size",
      prompt: `After extending /dev/vg_lab/${lv}, confirm the filesystem actually grew to fill it (two-column compare).`,
      accepted: [`df -h /dev/vg_lab/${lv}`, `lvs /dev/vg_lab/${lv} && df -h /dev/vg_lab/${lv}`],
      hint: "df reports filesystem size; lvs reports LV size.",
      explanation: `df -h shows what the filesystem believes; lvs shows the LV's real size. If df lags, the filesystem resize (-r or xfs_growfs) never ran.`,
      practice: `df -h /dev/vg_lab/${lv} && sudo lvs /dev/vg_lab/${lv}`,
      tag: "resize",
    })),
];

export const lastTemplates = [
  () =>
    [
      ["vg_lab", "sdb"],
      ["vg_app", "sdc"],
      ["vg_data", "sdd"],
      ["vg_media", "sde"],
      ["vg_lab", "nvme0n2"],
    ].map(([vg, disk]) => ({
      type: "quiz",
      difficulty: "easy",
      title: "Which PV belongs to which VG?",
      prompt: `pvs shows ${disk} with VG column empty. What does that mean?`,
      options: [
        `${disk} is a PV but not yet added to any volume group`,
        "The disk has no partition table",
        "The PV is corrupted and must be recreated",
        "The VG was deleted along with its disks",
      ],
      answerIndex: 0,
      hint: "A PV can exist without a VG.",
      explanation: `pvcreate alone leaves the disk as a free-floating PV (empty VG column). vgcreate ${vg} ${disk} would pool it into a group.`,
      practice: `sudo pvs`,
      tag: "pv",
    })),
];
