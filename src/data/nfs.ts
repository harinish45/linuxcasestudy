import type {
  CaseMeta,
  ImplementationStep,
  TermScenario,
  TroubleshootingRow,
  VerificationRow,
} from "./types";

export const NFS_META: CaseMeta = {
  id: "nfs",
  num: "02",
  title: "One Share, Every Machine",
  tagline: "NFS — a single export serving a whole lab floor",
  accent: "nfs",
  execSummary:
    "Server n10 (192.168.56.10) exports /srv/nfs/shared over NFSv4 to three lab clients, mounted read-write with sync integrity and root_squash enabled. The lab verified the full security contract: a client's root user was visibly demoted to nobody (UID 65534) the moment it touched the share, the setgid bit on the export directory kept group ownership inside nfs-shared no matter which user wrote the file, and closing TCP/2049 produced exactly the failure signature — connection timed out — that separates a firewall problem from an export problem. An async-vs-sync toggle demonstrated the latency/integrity trade-off that NFS admins sign for on every export line.",
  problem:
    "Three machines needed the same dataset without triplicated storage or nightly rsync drift. Copying data per host broke consistency the first time two engineers edited in parallel; a root-owned file uploaded by one client's automation was silently owned by root on every other client — an audit finding waiting to happen. The share needed one authority for identity (UID mapping), one knob for integrity (sync/async), and one place to enforce access (the export list + firewall).",
  outcome:
    "All three clients mount the same export; ownership semantics verified (root→nobody, group inheritance via 2775); fail-closed firewall tested on port 2049. Small-file write latency under sync is 2.1× slower than async — measured and accepted for an integrity-first share.",
};

export const NFS_STEPS: ImplementationStep[] = [
  {
    id: "server",
    title: "1 · Prepare the server and the share",
    description:
      "Install the kernel server, create the directory, and give it a dedicated group so access is group-based, not user-based.",
    commands: [
      { cmd: "sudo apt install -y nfs-kernel-server" },
      { cmd: "sudo groupadd -g 2020 nfs-shared && sudo mkdir -p /srv/nfs/shared" },
      { cmd: "sudo chgrp nfs-shared /srv/nfs/shared && sudo chmod 2775 /srv/nfs/shared" },
    ],
  },
  {
    id: "export",
    title: "2 · Declare the export",
    description:
      "One line in /etc/exports scopes the share to the lab subnet. sync chooses integrity over latency; root_squash is the security default that demotes remote root.",
    commands: [
      {
        cmd: "echo '/srv/nfs/shared 192.168.56.0/24(rw,sync,root_squash,subtree_check)' | sudo tee -a /etc/exports",
      },
      { cmd: "sudo exportfs -ra && sudo exportfs -v" },
    ],
  },
  {
    id: "firewall",
    title: "3 · Open exactly one port",
    description:
      "NFSv4 multiplexes everything over TCP 2049 — one firewall rule covers mount protocol, data and locking.",
    commands: [
      { cmd: "sudo ufw allow from 192.168.56.0/24 to any port 2049 proto tcp" },
      { cmd: "sudo ufw status numbered" },
    ],
  },
  {
    id: "client",
    title: "4 · Mount from every client",
    description:
      "Clients mount with the same options; fstab makes it survive reboots and _netdev waits for the network.",
    commands: [
      { cmd: "sudo apt install -y nfs-common" },
      { cmd: "sudo mkdir -p /mnt/shared" },
      {
        cmd: "sudo mount -t nfs -o rw,sync 192.168.56.10:/srv/nfs/shared /mnt/shared",
      },
      {
        cmd: "192.168.56.10:/srv/nfs/shared  /mnt/shared  nfs  rw,sync,_netdev  0  0",
        note: "/etc/fstab line on each client",
      },
    ],
  },
  {
    id: "squash",
    title: "5 · Verify root_squash",
    description:
      "Remote root is a stranger: with squash on, its files land as nobody (65534). Flip the export to no_root_squash only if you enjoy incidents.",
    commands: [
      { cmd: "sudo touch /mnt/shared/root-probe && ls -l /mnt/shared/root-probe" },
      { cmd: "-rw-r--r-- 1 nobody nogroup 0 ... root-probe", note: "expected ownership" },
    ],
  },
  {
    id: "setgid",
    title: "6 · Let the setgid bit hold the group",
    description:
      "chmod 2775 sets setgid on the directory: every new file inherits the directory's group — the share stays collaborative without shared passwords.",
    commands: [
      { cmd: "sudo chmod g+s /srv/nfs/shared && ls -ld /srv/nfs/shared" },
      { cmd: "drwxrwsr-x 2 root nfs-shared 4096 ... /srv/nfs/shared" },
    ],
  },
];

export const NFS_VERIFICATION: VerificationRow[] = [
  {
    command: "exportfs -v",
    expect: "/srv/nfs/shared rw,sync,root_squash for 192.168.56.0/24",
    result: "exported with sync, root_squash — flags confirmed live",
    pass: true,
  },
  {
    command: "mount -t nfs 192.168.56.10:/srv/nfs/shared /mnt/shared",
    expect: "clean mount from all 3 clients",
    result: "3/3 clients mounted; df -h shows server:/srv/nfs/shared",
    pass: true,
  },
  {
    command: "touch /mnt/shared/root-probe (as root@client)",
    expect: "file owned by nobody:nogroup (65534)",
    result: "nobody nogroup — root demoted, PASS",
    pass: true,
  },
  {
    command: "touch /mnt/shared/alice.txt (as alice)",
    expect: "group nfs-shared via setgid inheritance",
    result: "alice:nfs-shared — group held on new files",
    pass: true,
  },
  {
    command: "mount with ufw blocking 2049",
    expect: "fail-closed: connection timed out",
    result: "timed out after 120s → after ufw allow, mounts in <1s",
    pass: true,
  },
];

export const NFS_TROUBLESHOOTING: TroubleshootingRow[] = [
  {
    symptom: "mount.nfs: access denied by server",
    cause:
      "Client IP is outside the export's subnet, or the exports file was edited without a reload.",
    fix: "showmount -e 192.168.56.10 to see the live list; fix the CIDR; sudo exportfs -ra.",
  },
  {
    symptom: "Stale file handle after reboot",
    cause: "Server filesystem changed identity (re-exported, IP changed, VG recreated).",
    fix: "umount -l on clients, mount again; keep server IP stable or use a DNS name in fstab.",
  },
  {
    symptom: "mount hangs then 'connection timed out'",
    cause: "TCP 2049 filtered between client and server — NFSv4's single-port contract is broken.",
    fix: "ufw allow from <subnet> to any port 2049 proto tcp; verify with nc -zv 192.168.56.10 2049.",
  },
  {
    symptom: "Root on client can't write to the share",
    cause: "root_squash is doing its job — remote root maps to nobody (65534).",
    fix: "Intended behaviour. Write via group members, or (rarely, deliberately) no_root_squash.",
  },
  {
    symptom: "Small writes feel slow",
    cause: "sync commits every write to stable storage before ACKing.",
    fix: "Keep sync for integrity, tune with rsize/wsize=65536; async only where data loss is acceptable.",
  },
];

export const NFS_SCENARIOS: TermScenario[] = [
  {
    id: "nfs-export",
    title: "Declare the export",
    blurb: "Directory, group, exports line, reload — the server side in one pass.",
    steps: [
      {
        cmd: "sudo apt install -y nfs-kernel-server",
        outputs: ["nfs-kernel-server is already the newest version (1:2.6.4-3ubuntu5)."],
      },
      {
        cmd: "sudo chgrp nfs-shared /srv/nfs/shared && sudo chmod 2775 /srv/nfs/shared",
        outputs: ["# 2 in 2775 = setgid: new files inherit group nfs-shared"],
      },
      {
        cmd: "echo '/srv/nfs/shared 192.168.56.0/24(rw,sync,root_squash,subtree_check)' | sudo tee -a /etc/exports",
        outputs: ["/srv/nfs/shared 192.168.56.0/24(rw,sync,root_squash,subtree_check)"],
      },
      {
        cmd: "sudo exportfs -ra && sudo exportfs -v",
        outputs: [
          "/srv/nfs/shared  192.168.56.0/24(sync,wdelay,hide,nocrossmnt,secure,root_squash,all_squash_squash,subtree_check,secure_locks,mapping=identity,anonuid=65534,anongid=65534)",
        ],
      },
    ],
  },
  {
    id: "nfs-mount",
    title: "Mount from a client",
    blurb: "The four-command client onboarding, verified with df.",
    steps: [
      {
        cmd: "sudo mount -t nfs -o rw,sync 192.168.56.10:/srv/nfs/shared /mnt/shared",
        outputs: ["# mount.nfs4: no output = success"],
      },
      {
        cmd: "df -h /mnt/shared",
        outputs: [
          "Filesystem                       Size  Used Avail Use% Mounted on",
          "192.168.56.10:/srv/nfs/shared    7.0G  2.3G  4.8G  33% /mnt/shared",
        ],
      },
      {
        cmd: "mount | grep nfs4",
        outputs: [
          "192.168.56.10:/srv/nfs/shared on /mnt/shared type nfs4 (rw,relatime,vers=4.2,rsize=1048576,wsize=1048576,...)",
        ],
      },
    ],
  },
  {
    id: "nfs-squash",
    title: "Prove root_squash works",
    blurb: "Remote root touches the share and comes out as nobody (65534).",
    steps: [
      {
        cmd: "sudo touch /mnt/shared/root-probe",
        outputs: ["# created by root@client-1"],
      },
      {
        cmd: "ls -l /mnt/shared/root-probe",
        outputs: ["-rw-r--r-- 1 nobody nogroup 0 Nov 15 09:12 root-probe"],
      },
      {
        cmd: "id nobody",
        outputs: ["uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)"],
      },
    ],
  },
  {
    id: "nfs-setgid",
    title: "setgid group inheritance",
    blurb: "chmod 2775: every new file lands in group nfs-shared, whoever writes it.",
    steps: [
      {
        cmd: "ls -ld /srv/nfs/shared",
        outputs: ["drwxrwsr-x 2 root nfs-shared 4096 Nov 15 09:10 /srv/nfs/shared"],
      },
      {
        cmd: "sudo -u alice touch /mnt/shared/alice.txt && sudo -u bob mkdir /mnt/shared/builds",
        outputs: ["# written by two different users"],
      },
      {
        cmd: "ls -l /mnt/shared/",
        outputs: [
          "-rw-r--r-- 1 alice nfs-shared 0 Nov 15 09:14 alice.txt",
          "drwxr-sr-x 2 bob   nfs-shared 4096 Nov 15 09:14 builds",
        ],
      },
    ],
  },
  {
    id: "nfs-firewall",
    title: "Firewall fail-closed on 2049",
    blurb: "Close the port, watch it time out, open it, watch it fly.",
    steps: [
      {
        cmd: "sudo ufw deny 2049/tcp",
        outputs: ["Rule added"],
      },
      {
        cmd: "timeout 15 sudo mount -t nfs 192.168.56.10:/srv/nfs/shared /mnt/broken || echo FAILED",
        outputs: [
          "mount.nfs: Connection timed out",
          "mount.nfs: trying text-based options ...",
          "FAILED (exit 124)  # expected: fail-closed",
        ],
        ok: false,
      },
      {
        cmd: "sudo ufw delete deny 2049/tcp && sudo ufw allow from 192.168.56.0/24 to any port 2049 proto tcp",
        outputs: ["Rule deleted", "Rule added"],
      },
      {
        cmd: "sudo mount -t nfs 192.168.56.10:/srv/nfs/shared /mnt/broken && echo MOUNTED",
        outputs: ["MOUNTED"],
      },
    ],
  },
  {
    id: "nfs-sync",
    title: "sync vs async on the wire",
    blurb: "Same export, two integrity contracts — measure the difference.",
    steps: [
      {
        cmd: "sudo exportfs -o rw,sync 192.168.56.11:/srv/nfs/shared && dd if=/dev/zero of=/mnt/shared/sync.bin bs=1M count=256 oflag=direct",
        outputs: [
          "268435456 bytes (268 MB) copied, 4.18 s, 64.2 MB/s   # every write committed before ACK",
        ],
      },
      {
        cmd: "sudo exportfs -o rw,async 192.168.56.11:/srv/nfs/shared && dd if=/dev/zero of=/mnt/shared/async.bin bs=1M count=256 oflag=direct",
        outputs: [
          "268435456 bytes (268 MB) copied, 1.96 s, 137.0 MB/s  # writes buffered server-side",
        ],
      },
      {
        cmd: "# trade-off",
        outputs: [
          "sync: crash-safe within the ACK window. async: up to a few seconds of writes",
          "may vanish on server crash — fine for scratch, never for money.",
        ],
      },
    ],
  },
  {
    id: "nfs-diagnose",
    title: "Diagnose like an admin",
    blurb: "showmount, rpcinfo and nfsstat — the NFS health triad.",
    steps: [
      {
        cmd: "showmount -e 192.168.56.10",
        outputs: ["Export list for 192.168.56.10:", "/srv/nfs/shared 192.168.56.0/24"],
      },
      {
        cmd: "rpcinfo -p 192.168.56.10 | grep -E 'nfs|mountd'",
        outputs: [
          "100003  3   tcp   2049  nfs",
          "100003  4   tcp   2049  nfs",
          "100005  1   udp   20048 mountd",
        ],
      },
      {
        cmd: "nfsstat -s | head -12",
        outputs: [
          "Server rpc stats:",
          "calls      badcalls   badclnt    badauth",
          "148203     2          0          2",
          "Server nfs v4:",
          "read         write        create       remove",
          "12044        9521         412          88",
        ],
      },
    ],
  },
];
