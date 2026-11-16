/* NFS question templates — assembled and sliced by gen-bank.mjs. */

const SERVERS = ["192.168.56.10", "192.168.56.20", "10.0.0.5", "172.16.8.1", "192.168.1.50"];
const NETS = ["192.168.56.0/24", "10.0.0.0/8", "172.16.8.0/24", "192.168.1.0/24", "10.10.0.0/16"];
const EXPORTS = ["/srv/nfs/shared", "/srv/nfs/media", "/srv/nfs/home", "/export/data", "/srv/share"];

export const templates = [
  // ── command templates ────────────────────────────────────────────────
  () =>
    EXPORTS.slice(0, 5).map((dir, i) => {
      const net = NETS[i];
      return {
        type: "command",
        difficulty: "medium",
        title: `Declare an export for the ${net} LAN`,
        prompt: `Append an /etc/exports line that shares ${dir} read-write with the ${net} network, using sync and subtree_check.`,
        accepted: [
          `echo '${dir} ${net}(rw,sync,subtree_check)' | sudo tee -a /etc/exports`,
          `echo "${dir} ${net}(rw,sync,subtree_check)" | sudo tee -a /etc/exports`,
        ],
        hint: "echo the line into /etc/exports with tee -a, or edit the file directly.",
        explanation: `The exports line '${dir} ${net}(rw,sync,subtree_check)' grants the ${net} range read-write with synchronous writes. Then exportfs -ra applies it.`,
        practice: `echo '${dir} ${net}(rw,sync)' | sudo tee -a /etc/exports && sudo exportfs -ra`,
        tag: "export",
      };
    }),
  () => [
    {
      type: "command",
      difficulty: "easy",
      title: "Apply /etc/exports changes live",
      prompt: "You edited /etc/exports. Apply every change immediately without restarting the NFS service.",
      accepted: ["exportfs -ra", "sudo exportfs -ra"],
      hint: "exportfs -r re-exports everything; -a applies all.",
      explanation:
        "sudo exportfs -ra re-reads /etc/exports and updates the active export table in place — clients keep working, no service restart needed.",
      practice: "sudo exportfs -ra",
      tag: "export",
    },
    {
      type: "command",
      difficulty: "easy",
      title: "List the active exports verbosely",
      prompt: "Show every currently active export with its full option list.",
      accepted: ["exportfs -v", "sudo exportfs -v"],
      hint: "The same exportfs command with a listing flag.",
      explanation:
        "exportfs -v prints the live export table exactly as the server enforces it — the ground truth for 'what did my options actually do?'.",
      practice: "sudo exportfs -v",
      tag: "export",
    },
    {
      type: "command",
      difficulty: "easy",
      title: "What does the server export?",
      prompt: `Ask the NFS server ${SERVERS[0]} which directories it exports, from a client machine.`,
      accepted: [`showmount -e ${SERVERS[0]}`],
      hint: "showmount queries the server's mount daemon.",
      explanation: `showmount -e ${SERVERS[0]} lists exports + who may mount them. It is the first thing to check when a client mount is denied.`,
      practice: `showmount -e ${SERVERS[0]}`,
      tag: "client",
    },
    {
      type: "command",
      difficulty: "easy",
      title: "Restart the NFS server cleanly",
      prompt: "Restart the NFS server service so it re-reads its configuration.",
      accepted: ["systemctl restart nfs-server", "sudo systemctl restart nfs-server"],
      hint: "The Debian/Ubuntu service is called nfs-server.",
      explanation:
        "sudo systemctl restart nfs-server reloads exports and daemons. For pure /etc/exports changes prefer exportfs -ra — no connection is dropped.",
      practice: "sudo systemctl restart nfs-server",
      tag: "server",
    },
    {
      type: "command",
      difficulty: "easy",
      title: "Install the NFS client package (Debian)",
      prompt: "Install the Debian package a client needs to mount NFS shares.",
      accepted: ["apt install -y nfs-common", "sudo apt install -y nfs-common", "apt install nfs-common", "sudo apt install nfs-common"],
      hint: "Clients need nfs-common; servers use nfs-kernel-server.",
      explanation:
        "nfs-common brings mount.nfs and the helper daemons. The server additionally needs nfs-kernel-server (which pulls in nfs-common).",
      practice: "sudo apt install -y nfs-common",
      tag: "client",
    },
  ],
  () =>
    EXPORTS.slice(0, 5).map((dir, i) => {
      const srv = SERVERS[i];
      const mnt = ["/mnt/shared", "/mnt/media", "/mnt/home", "/mnt/data", "/mnt/share"][i];
      return {
        type: "command",
        difficulty: "medium",
        title: `Mount the share on a client`,
        prompt: `Mount ${srv}:${dir} at ${mnt} with the NFS filesystem type.`,
        accepted: [`mount -t nfs ${srv}:${dir} ${mnt}`, `sudo mount -t nfs ${srv}:${dir} ${mnt}`],
        hint: "mount -t nfs server:/export /local/path.",
        explanation: `sudo mount -t nfs ${srv}:${dir} ${mnt} attaches the remote share. Verify with df -h — it shows server:/path as the filesystem source.`,
        practice: `sudo mount -t nfs ${srv}:${dir} ${mnt}`,
        tag: "client",
      };
    }),
  () =>
    EXPORTS.slice(0, 5).map((dir, i) => {
      const srv = SERVERS[i];
      const mnt = ["/mnt/shared", "/mnt/media", "/mnt/home", "/mnt/data", "/mnt/share"][i];
      return {
        type: "command",
        difficulty: "medium",
        title: "Make the mount boot-persistent",
        prompt: `Write the /etc/fstab line that mounts ${srv}:${dir} at ${mnt} with NFS defaults at every boot.`,
        accepted: [`${srv}:${dir} ${mnt} nfs defaults 0 0`],
        hint: "device → mountpoint → fstype → options → dump → pass.",
        explanation: `The fstab line '${srv}:${dir} ${mnt} nfs defaults 0 0' mounts at boot. Add _netdev to options so boot waits for the network.`,
        practice: `${srv}:${dir} ${mnt} nfs defaults,_netdev 0 0`,
        tag: "client",
      };
    }),
  () =>
    EXPORTS.slice(0, 5).map((dir) => ({
      type: "command",
      difficulty: "medium",
      title: "Prepare a team-writable share directory",
      prompt: `Create ${dir} and give it mode 2775 so new files inherit the directory's group.`,
      accepted: [`mkdir -p ${dir} && chmod 2775 ${dir}`, `sudo mkdir -p ${dir} && sudo chmod 2775 ${dir}`],
      hint: "mkdir -p, then chmod with the setgid bit (2xxx).",
      explanation:
        "chmod 2775 sets setgid: every new file/subdir inherits the directory's group. That is the quiet hero of team shares — no more chown fights.",
      practice: `sudo mkdir -p ${dir} && sudo chmod 2775 ${dir}`,
      tag: "permissions",
    })),
  () =>
    NETS.slice(0, 5).map((net) => ({
      type: "command",
      difficulty: "medium",
      title: "Open the NFSv4 firewall port",
      prompt: `Allow NFS traffic from ${net} through ufw — modern NFSv4 needs exactly one TCP port.`,
      accepted: [
        `ufw allow from ${net} to any port 2049 proto tcp`,
        `sudo ufw allow from ${net} to any port 2049 proto tcp`,
      ],
      hint: "NFSv4 speaks on 2049/tcp only.",
      explanation: `NFSv4 needs just 2049/tcp — one rule instead of the v3 port parade (111, mountd, lockd, statd). Scope it to ${net}.`,
      practice: `sudo ufw allow from ${net} to any port 2049 proto tcp`,
      tag: "server",
    })),
  () =>
    [
      ["umount /mnt/shared", "Unmount a busy-ish share", "Unmount the share currently mounted at /mnt/shared."],
      ["mount -o remount,ro /mnt/shared", "Flip a mount to read-only", "Remount /mnt/shared read-only without a full unmount."],
      ["umount -l /mnt/shared", "Lazy-unmount", "Lazy-unmount /mnt/shared so it detaches once open files close."],
      ["mount -o vers=4.2 192.168.56.10:/srv/nfs/shared /mnt/shared", "Force NFSv4.2", "Mount the share explicitly with NFS version 4.2."],
      ["umount -f /mnt/shared", "Force unmount (soft)", "Force-unmount a hung soft mount at /mnt/shared."],
    ].map(([cmd, title, prompt]) => ({
      type: "command",
      difficulty: "hard",
      title,
      prompt,
      accepted: [cmd.replace(/^sudo /, ""), cmd, cmd.replace(/^/, "sudo ")].filter((c, i, a) => a.indexOf(c) === i),
      hint: "Think about mount/umount and their options.",
      explanation: `The command '${cmd}' does exactly this. man 8 mount(8) documents every NFS option — remount changes flags live, -l detaches lazily.`,
      practice: cmd.startsWith("mount") ? cmd : `sudo ${cmd}`,
      tag: "client",
    })),

  // ── quiz templates ───────────────────────────────────────────────────
  () =>
    [
      {
        q: "Which file defines what an NFS server shares, and with whom?",
        a: "/etc/exports",
        h: "It literally exports.",
      },
      {
        q: "After editing /etc/exports, which command applies the changes without restarting the service?",
        a: "exportfs -ra",
        h: "It re-applies all exports in place.",
      },
      {
        q: "Which port does NFSv4 need open in the firewall?",
        a: "2049/tcp — the only one",
        h: "v4 collapsed the port parade into one.",
      },
      {
        q: "Which package does a Debian CLIENT need to mount NFS shares?",
        a: "nfs-common",
        h: "Servers use nfs-kernel-server instead.",
      },
      {
        q: "Which command asks a server to list its exports from a client?",
        a: "showmount -e <server>",
        h: "It shows mounts offered by the server.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "easy",
      title: "NFS basics",
      prompt: o.q,
      options: [o.a, "/etc/nfs.conf.d/exports", "/etc/fstab", "/etc/default/nfs", "exportfs -ua", "systemctl reload nfs", "mount -a", "exportfs --refresh", "111/udp", "2049/udp", "4045/tcp", "Both 111 and 2049 on tcp+udp", "nfs-utils", "nfs-client", "mount.nfsd", "showmount -l <server>", "exportfs -q <server>", "rpcinfo --exports"],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} — the core workflow is: define exports in /etc/exports, apply with exportfs -ra, open 2049/tcp, and clients mount with nfs-common installed.`,
      practice: "sudo exportfs -v",
      tag: "export",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "What does root_squash do on an NFS export?",
        a: "Maps a client's root to the anonymous user 'nobody' on the share",
        h: "It squashes UID 0 specifically.",
      },
      {
        q: "Why is no_root_squash called a production landmine?",
        a: "A compromised client's root keeps UID 0 and owns every file on the share",
        h: "Think about what a client root could do.",
      },
      {
        q: "Which export option maps ALL client users to the anonymous identity?",
        a: "all_squash",
        h: "The aggressive sibling of root_squash.",
      },
      {
        q: "Which options set the identity that squashed users map to?",
        a: "anonuid= and anongid=",
        h: "anon… for anonymous.",
      },
      {
        q: "Files created through NFS show up owned by UID 1001 on every client. Why?",
        a: "NFS passes numeric uid/gid straight through — clients must share a consistent identity source",
        h: "There is no username translation for classic exports.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Security & identity",
      prompt: o.q,
      options: [
        o.a,
        "Encrypts all traffic between client and server",
        "Blocks client root from connecting at all",
        "Forces all clients to authenticate with Kerberos",
        "A compromised client's root keeps UID 0 and owns every file on the share",
        "It disables write caching for root processes",
        "It makes the export read-only for everyone",
        "all_squash",
        "root_squash_all",
        "map_everyone",
        "anonuid= and anongid=",
        "squash_uid=/squash_gid=",
        "anon_user= and anon_group=",
        "NFS passes numeric uid/gid straight through — clients must share a consistent identity source",
        "The server copies /etc/passwd to clients",
        "Kerberos tickets carry the username",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} Identity on NFS is numeric: keep uid/gid consistent (LDAP/NIS) and leave root_squash on unless you have a very specific lab reason.`,
      practice: "sudo exportfs -v",
      tag: "security",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "What does the sync export option guarantee?",
        a: "The server acknowledges writes only after they reach stable storage",
        h: "Slower, but crash-safe.",
      },
      {
        q: "What is the trade-off of the async export option?",
        a: "Faster responses, but recent writes may be lost if the server crashes",
        h: "Early acks can be lies.",
      },
      {
        q: "Which write mode do modern NFS servers default to when neither sync nor async is set?",
        a: "sync",
        h: "The safe one.",
      },
      {
        q: "Why do the lab shares use sync despite being slower?",
        a: "Crash-safety beats throughput for shared team data",
        h: "Think about what the data is worth.",
      },
      {
        q: "You see async on a production export. What is the FIRST thing to verify?",
        a: "Whether the data on it can survive being partially lost — if not, move to sync",
        h: "Understand the failure mode before tuning.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "sync vs async",
      prompt: o.q,
      options: [
        o.a,
        "It compresses data before sending it",
        "It caches reads on the client",
        "It serialises writes from all clients",
        "Faster responses, but recent writes may be lost if the server crashes",
        "It disables the network stack until writes finish",
        "It makes the export read-only",
        "async",
        "No default — the server refuses to start",
        "It picks randomly per client",
        "Latency is irrelevant for this workload",
        "async uses less CPU on clients",
        "There is nothing to verify — async is always fine",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} sync = ack after stable storage (safe); async = ack early (fast, risky on crash). Choose by what the data can afford to lose.`,
      practice: "sudo exportfs -v",
      tag: "server",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "What does mode 2775 on a shared directory achieve?",
        a: "New files inherit the directory's group (setgid) while group stays writable",
        h: "The leading 2 is the setgid bit.",
      },
      {
        q: "Without setgid on a team share, what commonly goes wrong?",
        a: "Each user's files get their personal group — teammates hit permission denied",
        h: "Think about group inheritance.",
      },
      {
        q: "Which numeric mode makes a directory group-writable AND setgid with no world write?",
        a: "2775 (or 2770 for private teams)",
        h: "setgid + rwxr-xr-x-ish.",
      },
      {
        q: "How do you confirm a directory has the setgid bit set?",
        a: "ls -ld — an 's' replaces the group's execute bit",
        e: "drwxrwsr-x — that lowercase 's' in the group triad is setgid doing its job.",
        h: "Look at ls -ld output closely.",
      },
      {
        q: "A client writes a file and the server-local group is wrong. What fixed it?",
        a: "chmod 2775 on the shared directory (setgid) plus a matching group on clients",
        h: "Two halves: directory bit + client identity.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Shared-dir permissions",
      prompt: o.q,
      options: [
        o.a,
        "Only root can create files there",
        "Files are compressed automatically",
        "NFS switches to Kerberos for that directory",
        "Each user's files get their personal group — teammates hit permission denied",
        "Everyone becomes root on that directory",
        "The mount silently fails",
        "2775 (or 2770 for private teams)",
        "666 — open to all",
        "1755 — sticky only",
        "ls -ld — an 's' replaces the group's execute bit",
        "stat shows a '+' sign",
        "df -h lists setgid mounts",
        "chmod 2775 on the shared directory (setgid) plus a matching group on clients",
        "Reformatting the share with XFS",
        "Enabling async on the export",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} setgid (2775) + consistent group membership across clients = a team share that just works.`,
      practice: "sudo chmod 2775 /srv/nfs/shared",
      tag: "permissions",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "A hard mount hangs when the server dies. What is the point of that behaviour?",
        a: "The client keeps retrying forever so writes are not silently lost",
        h: "Data integrity over convenience.",
      },
      {
        q: "What is the danger of soft mounts?",
        a: "After retrans/timeo expires, IO returns an error mid-write — possible data corruption",
        h: "Failing fast has a price.",
      },
      {
        q: "What does timeo=50 mean for an NFS mount?",
        a: "A 5-second timeout — timeo is measured in deciseconds",
        h: "Deciseconds, not milliseconds.",
      },
      {
        q: "Which mount option pair is the classic 'give up eventually but try hard first'?",
        a: "soft,retrans=3 — retry 3 times then error",
        h: "retrans counts attempts within timeo windows.",
      },
      {
        q: "For a build server reading from NFS, which mount choice keeps CI honest?",
        a: "hard (or hard,intr) — a hung build beats a silently corrupted one",
        h: "CI should fail loudly, not wrongly.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "hard",
      title: "hard vs soft mounts",
      prompt: o.q,
      options: [
        o.a,
        "The client reboots the server automatically",
        "Writes are cached until the server returns",
        "The mount switches to local disk transparently",
        "After retrans/timeo expires, IO returns an error mid-write — possible data corruption",
        "Soft mounts are always slower than hard",
        "The server rate-limits soft clients",
        "A 5-second timeout — timeo is measured in deciseconds",
        "50 milliseconds — timeo is milliseconds",
        "50 retries before giving up",
        "soft,retrans=3 — retry 3 times then error",
        "hard,noresvport",
        "soft,timeo=0",
        "hard (or hard,intr) — a hung build beats a silently corrupted one",
        "soft — fail fast and retry the pipeline",
        "local caching is the only honest option",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} hard = never give up (integrity); soft = fail fast (risk). timeo is deciseconds; retrans counts attempts.`,
      practice: "mount | grep nfs",
      tag: "client",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "What is the purpose of fsid=0 on an NFSv4 export?",
        a: "It marks that export as the v4 pseudo-root that clients mount as server:/",
        h: "v4 builds one virtual tree.",
      },
      {
        q: "In NFSv3, why did you need rpcbind (port 111) plus several helper ports?",
        a: "v3 services (mountd, lockd, statd) register dynamic ports with rpcbind",
        h: "v4 killed this parade.",
      },
      {
        q: "A client mounts server:/ and works under v4. What is it actually mounting?",
        a: "The fsid=0 pseudo-root, with real exports bound beneath it",
        h: "The virtual tree root.",
      },
      {
        q: "Which daemon maps user names to ids for NFSv4 ownership strings?",
        a: "nfs-idmapd (idmapd)",
        h: "The name says 'id mapping'.",
      },
      {
        q: "What does subtree_check compare?",
        a: "That accessed files stay inside the exported subtree (guards .. escapes)",
        h: "It checks the file's path against the export.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "hard",
      title: "Protocol internals",
      prompt: o.q,
      options: [
        o.a,
        "It force-mounts the export on boot",
        "It allocates the first free file handle",
        "It enables Kerberos on that export",
        "v3 services (mountd, lockd, statd) register dynamic ports with rpcbind",
        "v3 used a binary protocol needing many channels",
        "rpcbind balanced load across servers",
        "The fsid=0 pseudo-root, with real exports bound beneath it",
        "The physical root filesystem of the server",
        "A read-only snapshot of the export",
        "nfs-idmapd (idmapd)",
        "rpcbind",
        "nfs-kernel-server",
        "That accessed files stay inside the exported subtree (guards .. escapes)",
        "That subtrees are checked for viruses",
        "That the export tree has no symlinks",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} v4's single-port design (2049) plus fsid=0 pseudo-roots replaced the v3 rpcbind port parade.`,
      practice: "sudo exportfs -v",
      tag: "protocol",
      _correctText: o.a,
    })),
  () =>
    [
      {
        err: "mount.nfs: access denied by server",
        why: "The server's /etc/exports has no line allowing this client (or wrong options)",
        h: "The server politely said no — check the allow-list.",
      },
      {
        err: "mount.nfs: Connection timed out",
        why: "Port 2049/tcp is blocked by a firewall or the server IP is wrong",
        h: "Network-level failure.",
      },
      {
        err: "stale file handle",
        why: "The export changed or the server restarted — unmount and remount",
        h: "The handle survived a server-side change.",
      },
      {
        err: "mount: /mnt/shared is already mounted / busy",
        why: "A previous mount is still active — use the existing mount or umount first",
        h: "One mountpoint, one mount.",
      },
      {
        err: "Permission denied when creating files as a normal user",
        why: "Directory mode or uid/gid mismatch — check 2775 + setgid and consistent group ids",
        h: "Numeric identity again.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "hard",
      title: "Troubleshooting NFS",
      prompt: `A client hits: "${o.err}". What is the most likely cause?`,
      options: [o.why, "NFS is disabled in the kernel", "The client disk is full", "SELinux labels are wrong on the client"],
      answerIndex: 0,
      hint: o.h,
      explanation: `${o.why} — triage order: showmount -e server (exports), ping/port 2049 (network), mount options (flags), then ownership (uid/gid).`,
      practice: `showmount -e 192.168.56.10`,
      tag: "troubleshoot",
    })),
  () =>
    [
      {
        q: "What does autofs add over a plain fstab entry?",
        a: "Mounts happen on demand when the path is accessed — and time out when idle",
        h: "Automounting = lazy + cleanable.",
      },
      {
        q: "Why do labs love autofs for home directories?",
        a: "Users get their share only on login, and stale mounts disappear automatically",
        h: "Per-user, per-demand.",
      },
      {
        q: "Which file configures what autofs should mount (indirect map)?",
        a: "A map file like /etc/auto.nfs referenced from auto.master",
        h: "auto.master points at map files.",
      },
      {
        q: "What does mountstats report for NFS mounts?",
        a: "Per-mount RPC statistics — counts, latency and errors",
        h: "It is stats about the mount.",
      },
      {
        q: "What does nfsstat -s summarise?",
        a: "Server-side NFS operation counters (getattr, read, write…)",
        h: "-s = server side.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Automation & tooling",
      prompt: o.q,
      options: [
        o.a,
        "It mirrors the export to local disk",
        "It makes mounts read-only",
        "It encrypts the mount automatically",
        "Users get their share only on login, and stale mounts disappear automatically",
        "All shares mount at boot regardless of use",
        "It converts NFS to SMB transparently",
        "A map file like /etc/auto.nfs referenced from auto.master",
        "/etc/fstab.d/autofs",
        "Inside the systemd unit file only",
        "Per-mount RPC statistics — counts, latency and errors",
        "The kernel's TCP retransmit log",
        "Client disk cache hit rates",
        "Server-side NFS operation counters (getattr, read, write…)",
        "Client-side CPU usage of nfsd threads",
        "The export table equivalent of exportfs -v",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} autofs for on-demand mounts; nfsstat/mountstats/nfsiostat for performance truth.`,
      practice: "systemctl status autofs",
      tag: "protocol",
      _correctText: o.a,
    })),
];
