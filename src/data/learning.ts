/**
 * Learning layer — the single source of truth for lessons, notes, cheat-sheet
 * commands, curated videos and external practice platforms.
 *
 * EVERY youtube id and external URL in this file was verified live
 * (YouTube oEmbed API / HTTP 200) before shipping.
 */

export type TopicKey = "lvm" | "nfs" | "docker";

export interface VideoPick {
  id: string; // youtube video id
  title: string;
  channel: string;
  blurb: string;
}

export interface ConceptNote {
  term: string;
  def: string;
}

export interface CheatCommand {
  cmd: string;
  note?: string;
}

export interface PracticeLink {
  name: string;
  url: string;
  blurb: string;
  tag: "wargame" | "labs" | "sandbox" | "reference" | "course";
}

export interface Topic {
  key: TopicKey;
  num: string;
  name: string;
  title: string;
  tagline: string;
  accentHex: string;
  rgb: string;
  icon: "harddrive" | "network" | "container";
  intro: string;
  lesson: { heading: string; body: string }[];
  concepts: ConceptNote[];
  cheatsheet: CheatCommand[];
  videos: VideoPick[];
  practice: PracticeLink[];
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Topics                                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

export const TOPICS: Topic[] = [
  {
    key: "lvm",
    num: "01",
    name: "LVM",
    title: "Storage that grows",
    tagline: "Pool disks, resize live, snapshot before risky deploys",
    accentHex: "#7c5cff",
    rgb: "124, 92, 255",
    icon: "harddrive",
    intro:
      "LVM (Logical Volume Manager) sits between your raw disks and filesystems. Instead of carving fixed partitions you can never change, you pool disks into one resizable allocation space — then slice, grow and snapshot without downtime.",
    lesson: [
      {
        heading: "PV → VG → LV, the three-layer model",
        body: "Physical Volumes are raw disks initialised with an LVM header (pvcreate). Volume Groups pool those PVs into one allocation space measured in 4 MiB extents (vgcreate). Logical Volumes are the slices you actually format and mount (lvcreate) — /dev/vg_lab/lv_data behaves like a normal disk to everything above it.",
      },
      {
        heading: "Grow online, shrink with a plan",
        body: "The headline trick: lvextend -L +2G -r grows the LV AND the filesystem in one step while the volume is mounted. XFS is grow-only — it can never shrink — so pairs like lv_data (XFS, grows) + lv_logs (ext4, grows and shrinks) cover both needs.",
      },
      {
        heading: "Snapshots = cheap undo",
        body: "lvcreate -s freezes a volume's state at a point in time using copy-on-write: only changed blocks are stored, so a snapshot is nearly free to take. Deploy gone wrong? lvconvert --merge rolls the volume back — verified byte-identical with sha256sum in our lab.",
      },
    ],
    concepts: [
      { term: "PV", def: "Physical Volume — a raw disk (or partition) initialised for LVM use." },
      { term: "VG", def: "Volume Group — the pool of PVs; its free extents are what you spend when resizing." },
      { term: "LV", def: "Logical Volume — the slice you format & mount; grows/shrinks on demand." },
      { term: "Extent", def: "The VG's unit of allocation (4 MiB default) — LVM's currency." },
      { term: "COW snapshot", def: "Copy-on-write: only blocks changed after the snapshot are saved — cheap undo." },
      { term: "-r flag", def: "Tells lvextend/lvreduce to also resize the filesystem inside the LV." },
    ],
    cheatsheet: [
      { cmd: "sudo pvcreate /dev/sdb /dev/sdc /dev/sdd", note: "initialise disks as physical volumes" },
      { cmd: "sudo vgcreate vg_lab /dev/sdb /dev/sdc /dev/sdd", note: "pool PVs into one volume group" },
      { cmd: "sudo lvcreate -n lv_data -L 5G vg_lab", note: "carve a 5G logical volume" },
      { cmd: "sudo mkfs.xfs /dev/vg_lab/lv_data", note: "format it XFS (grow-only, parallel-friendly)" },
      { cmd: "sudo lvextend -L +2G -r /dev/vg_lab/lv_data", note: "grow LV + filesystem online — the money command" },
      { cmd: "sudo lvcreate -s -n lv_data_snap -L 1G vg_lab/lv_data", note: "snapshot before a risky deploy" },
      { cmd: "sudo lvconvert --merge vg_lab/lv_data_snap", note: "rollback to the snapshot state" },
      { cmd: "sudo pvs && sudo vgs && sudo lvs", note: "the three one-letter status reports" },
    ],
    videos: [
      {
        id: "MeltFN-bXrQ",
        title: "Linux Logical Volume Manager (LVM) Deep Dive Tutorial",
        channel: "Learn Linux TV",
        blurb: "One-shot deep dive: why LVM, getting started, and the commands that matter.",
      },
      {
        id: "ceEk56Z8k9s",
        title: "Set Up LVM Storage in Linux — Beginner's Guide",
        channel: "Mingtao SUN",
        blurb: "Gentle walkthrough of pvcreate → vgcreate → lvcreate → mount.",
      },
      {
        id: "Ap-S2faYjbA",
        title: "Logical Volume Management (LVM) vs Standard Partitions",
        channel: "SavvyNik",
        blurb: "See exactly what LVM buys you over plain partitions.",
      },
    ],
    practice: [
      { name: "KodeKloud Linux labs", url: "https://kodekloud.com/", blurb: "Browser labs with LVM tasks graded automatically.", tag: "labs" },
      { name: "Killercoda LVM scenarios", url: "https://killercoda.com/", blurb: "Free Ubuntu playgrounds — practise pvcreate in a real shell.", tag: "labs" },
      { name: "explainshell", url: "https://explainshell.com/", blurb: "Paste 'lvextend -L +2G -r ...' and see every flag explained.", tag: "reference" },
    ],
  },
  {
    key: "nfs",
    num: "02",
    name: "NFS",
    title: "One share, every machine",
    tagline: "Serve one directory to a whole fleet — with real permissions",
    accentHex: "#22d3ee",
    rgb: "34, 211, 238",
    icon: "network",
    intro:
      "NFS (Network File System) lets remote machines mount a directory as if it were local disk. One server, many clients — the classic way teams share data, media and home directories across a lab or cluster.",
    lesson: [
      {
        heading: "Server exports, clients mount",
        body: "The server lists shares in /etc/exports with who-gets-what options, then exportfs -ra applies them. Clients install nfs-common and mount -t nfs server:/export /mnt/point. NFSv4 needs just port 2049/tcp open — one firewall rule instead of the v3 port parade.",
      },
      {
        heading: "sync vs async, root_squash",
        body: "sync makes the server acknowledge writes only after they hit disk (safe, slower); async acknowledges early (fast, risks loss on crash). root_squash maps a client's root to the anonymous user — so a compromised client can't own your share. Turning it off (no_root_squash) is a lab shortcut and a production landmine.",
      },
      {
        heading: "Permissions that actually work",
        body: "NFS passes numeric UID/GIDs straight through — files created by UID 1000 look like UID 1000 everywhere. That's why shared team dirs use the setgid bit (chmod 2775) so new files inherit the group, plus a matching group membership on every client.",
      },
    ],
    concepts: [
      { term: "Export", def: "A directory the server shares, defined in /etc/exports with client + option rules." },
      { term: "2049/tcp", def: "The NFSv4 port — the only one you need in the firewall for modern setups." },
      { term: "root_squash", def: "Maps client root → nobody on the share; the default safety net." },
      { term: "sync", def: "Server acks writes only after disk write — slower, crash-safe." },
      { term: "setgid (2775)", def: "New files inherit the directory's group — team shares without chown fights." },
      { term: "exportfs -ra", def: "Re-read /etc/exports and apply every change immediately." },
    ],
    cheatsheet: [
      { cmd: "sudo apt install -y nfs-kernel-server", note: "server side package" },
      { cmd: "echo '/srv/nfs/shared 192.168.56.0/24(rw,sync,subtree_check)' | sudo tee -a /etc/exports", note: "declare the export + client range" },
      { cmd: "sudo exportfs -ra", note: "apply /etc/exports live" },
      { cmd: "sudo mkdir -p /srv/nfs/shared && sudo chmod 2775 /srv/nfs/shared", note: "setgid so files inherit the team group" },
      { cmd: "sudo ufw allow from 192.168.56.0/24 to any port 2049 proto tcp", note: "NFSv4 = one port" },
      { cmd: "showmount -e 192.168.56.10", note: "ask the server what it exports" },
      { cmd: "sudo mount -t nfs -o rw,sync 192.168.56.10:/srv/nfs/shared /mnt/shared", note: "client mount" },
      { cmd: "192.168.56.10:/srv/nfs/shared /mnt/shared nfs defaults 0 0", note: "fstab line for boot-persistent mounts" },
    ],
    videos: [
      {
        id: "Na_jKeVWzrc",
        title: "How to Set Up an NFS Server on Ubuntu (Complete with AutoFS!)",
        channel: "Learn Linux TV",
        blurb: "Full server+client walkthrough, plus automounting with AutoFS.",
      },
      {
        id: "zmDIfJtCKCk",
        title: "How to Install and Configure an NFS Linux Server and Client",
        channel: "Akamai Developers",
        blurb: "Clean end-to-end setup with firewall and permissions covered.",
      },
      {
        id: "WfV-3B27nPU",
        title: "Configuring NFS on Linux — Into the Terminal 97",
        channel: "Red Hat",
        blurb: "The RHEL-flavoured export config and mount procedure.",
      },
    ],
    practice: [
      { name: "Killercoda NFS scenarios", url: "https://killercoda.com/", blurb: "Two-node Linux environments — practise server + client mounts.", tag: "labs" },
      { name: "SadServers", url: "https://sadservers.com/", blurb: "Fix broken servers (incl. storage/mount cases) in real scenarios.", tag: "wargame" },
      { name: "explainshell", url: "https://explainshell.com/", blurb: "Decode every mount -o flag and export option.", tag: "reference" },
    ],
  },
  {
    key: "docker",
    num: "03",
    name: "Containers",
    title: "Ship it once",
    tagline: "Images, layers, volumes — build once, run anywhere",
    accentHex: "#34d399",
    rgb: "52, 211, 153",
    icon: "container",
    intro:
      "Containers package an app with everything it needs — libraries, runtime, config — into an image, then run it as an isolated process sharing the host kernel. No 'works on my machine': the artifact you tested is the artifact you ship.",
    lesson: [
      {
        heading: "Images are layer cakes",
        body: "A Dockerfile builds read-only layers — one per instruction (base OS, deps, code). Layers cache, so rebuilding after a one-line change is near-instant, and identical layers are shared between images. A container is just a thin writable layer stacked on top of the image.",
      },
      {
        heading: "The lifecycle state machine",
        body: "created → running (docker run / docker start) → paused (docker pause, freezes SIGSTOP-style) → stopped (docker stop, graceful SIGTERM then SIGKILL) → removed (docker rm). docker ps -a shows everything including stopped; docker run -d detaches so it survives your terminal.",
      },
      {
        heading: "Data outlives containers",
        body: "A container's writable layer disappears with docker rm. Named volumes (docker volume create) live in a managed host area, survive container removal, and can be reused across containers — bind mounts map a host directory instead, great for dev. Persist data with volumes; the golden rule of stateless containers.",
      },
    ],
    concepts: [
      { term: "Image", def: "Immutable layered template — the build artifact." },
      { term: "Container", def: "A running (or stopped) instance of an image + one writable layer." },
      { term: "Layer", def: "One read-only filesystem diff per Dockerfile instruction; cached and shared." },
      { term: "Named volume", def: "Docker-managed storage that survives docker rm — where databases live." },
      { term: "-d flag", def: "Detached mode — the container keeps running after your terminal closes." },
      { term: "exec", def: "Run a process inside a live container — no sshd needed." },
    ],
    cheatsheet: [
      { cmd: "docker build -t lab-app:1.0 .", note: "build the image from a Dockerfile" },
      { cmd: "docker run -d --name web -v lab_data:/data lab-app:1.0", note: "run detached with a named volume" },
      { cmd: "docker ps -a", note: "every container, including stopped ones" },
      { cmd: "docker pause web && docker unpause web", note: "freeze and resume a process" },
      { cmd: "docker exec -it web sh", note: "shell into a live container" },
      { cmd: "docker logs -f web", note: "follow the container's stdout" },
      { cmd: "docker rm -f web", note: "stop (if needed) and delete" },
      { cmd: "docker system prune -f", note: "reclaim dangling images + stopped containers" },
    ],
    videos: [
      {
        id: "3c-iBn73dDE",
        title: "Docker Tutorial for Beginners [FULL COURSE in 3 Hours]",
        channel: "TechWorld with Nana",
        blurb: "The classic full course — images, containers, compose, a real project.",
      },
      {
        id: "pg19Z8LL06w",
        title: "Docker Crash Course for Absolute Beginners [NEW]",
        channel: "TechWorld with Nana",
        blurb: "Shorter, newer — concepts first, hands-on demo included.",
      },
      {
        id: "pTFZFxd4hOI",
        title: "Docker Tutorial for Beginners",
        channel: "Programming with Mosh",
        blurb: "Tight, clear intro from a legendary teacher.",
      },
      {
        id: "RqTEHSBrYFw",
        title: "Complete Docker Course — From BEGINNER to PRO!",
        channel: "DevOps Directive",
        blurb: "Deeper: multi-stage builds, compose, security, CI thinking.",
      },
      {
        id: "zJ6WbK9zFpI",
        title: "Learn Docker in 2 Hours — A Full Tutorial (2025)",
        channel: "KodeKloud",
        blurb: "Modern 2025 refresh, hands-on labs to follow along.",
      },
    ],
    practice: [
      { name: "Play with Docker", url: "https://labs.play-with-docker.com/", blurb: "Free browser Docker sandbox — real Docker, zero install.", tag: "sandbox" },
      { name: "Killercoda Docker scenarios", url: "https://killercoda.com/", blurb: "Guided container scenarios right in the browser.", tag: "labs" },
      { name: "TryHackMe — Linux Fundamentals", url: "https://tryhackme.com/", blurb: "Hacker-style rooms that also cover containers & services.", tag: "course" },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Practice arena — leetcode-style challenges                               */
/* ──────────────────────────────────────────────────────────────────────── */

export type Difficulty = "easy" | "medium" | "hard";
export type ChallengeType = "quiz" | "command";

export interface Challenge {
  id: string;
  topic: TopicKey;
  difficulty: Difficulty;
  type: ChallengeType;
  title: string;
  prompt: string;
  /** quiz only */
  options?: string[];
  answerIndex?: number;
  /** command only — accepted answers after normalisation */
  accepted?: string[];
  hint: string;
  explanation: string;
  xp: number;
}

export const CHALLENGES: Challenge[] = [
  // ── LVM ────────────────────────────────────────────────────────────────
  {
    id: "lvm-1",
    topic: "lvm",
    difficulty: "easy",
    type: "quiz",
    title: "Name that layer",
    prompt: "Which LVM layer pools physical disks into ONE resizable allocation space?",
    options: ["Physical Volume (PV)", "Volume Group (VG)", "Logical Volume (LV)", "Extent group (EG)"],
    answerIndex: 1,
    hint: "It's the middle layer of PV → ? → LV.",
    explanation:
      "Volume Group. PVs are pooled into a VG (vgcreate), and LVs are carved out of the VG (lvcreate). The VG is the wallet of free extents.",
    xp: 10,
  },
  {
    id: "lvm-2",
    topic: "lvm",
    difficulty: "easy",
    type: "command",
    title: "Init a physical volume",
    prompt: "Initialise /dev/sdb so LVM can use it. Write the exact command.",
    accepted: ["pvcreate /dev/sdb", "pvcreate /dev/sdb1"],
    hint: "It starts with pv… and needs sudo in real life (optional here).",
    explanation:
      "sudo pvcreate /dev/sdb writes the LVM header to the disk. Verify with pvs — it should show as allocatable.",
    xp: 10,
  },
  {
    id: "lvm-3",
    topic: "lvm",
    difficulty: "medium",
    type: "command",
    title: "The money command",
    prompt:
      "Grow /dev/vg_lab/lv_data by 2G AND resize the filesystem inside it in the SAME command, while it stays mounted.",
    accepted: ["lvextend -L +2G -r /dev/vg_lab/lv_data", "lvextend -r -L +2G /dev/vg_lab/lv_data"],
    hint: "lvextend, plus a flag that says 'also resize the filesystem'.",
    explanation:
      "lvextend -L +2G -r grows the LV and the filesystem in one step — online, no unmount. Without -r you'd need a separate xfs_growfs/resize2fs.",
    xp: 20,
  },
  {
    id: "lvm-4",
    topic: "lvm",
    difficulty: "medium",
    type: "quiz",
    title: "Why did the shrink fail?",
    prompt:
      "You ran lvreduce on an XFS logical volume and it refused. Why?",
    options: [
      "XFS volumes can only shrink while unmounted",
      "XFS cannot shrink at all — it is grow-only",
      "You forgot the -r flag",
      "The VG had no free extents",
    ],
    answerIndex: 1,
    hint: "Our lab keeps the failed shrink on purpose.",
    explanation:
      "XFS is grow-only by design. That's exactly why our lab formats lv_logs as ext4 — it's the one that may need to shrink.",
    xp: 20,
  },
  {
    id: "lvm-5",
    topic: "lvm",
    difficulty: "hard",
    type: "command",
    title: "Snapshot before the deploy",
    prompt: "Create a 1G snapshot of vg_lab/lv_data named lv_data_snap.",
    accepted: ["lvcreate -s -n lv_data_snap -L 1G vg_lab/lv_data", "lvcreate -s -L 1G -n lv_data_snap vg_lab/lv_data"],
    hint: "lvcreate with the snapshot flag -s, sized -L 1G, based on the source volume.",
    explanation:
      "lvcreate -s -n lv_data_snap -L 1G vg_lab/lv_data is nearly free (copy-on-write). Rollback later with lvconvert --merge — our lab verified byte-identical results.",
    xp: 30,
  },
  // ── NFS ────────────────────────────────────────────────────────────────
  {
    id: "nfs-1",
    topic: "nfs",
    difficulty: "easy",
    type: "quiz",
    title: "One port to rule NFSv4",
    prompt: "Which single port (and protocol) does a modern NFSv4 deployment need open?",
    options: ["111/udp", "2049/tcp", "2049/udp + 111/tcp", "32803/tcp only"],
    answerIndex: 1,
    hint: "The old v3 port parade is gone.",
    explanation:
      "NFSv4 listens on 2049/tcp only — one firewall rule instead of rpcbind/mountd/lockd sprawl.",
    xp: 10,
  },
  {
    id: "nfs-2",
    topic: "nfs",
    difficulty: "easy",
    type: "command",
    title: "Apply your exports",
    prompt: "You edited /etc/exports. Make the server pick up the changes right now.",
    accepted: ["exportfs -ra", "exportfs -r"],
    hint: "exportfs with the re-export flags.",
    explanation:
      "sudo exportfs -ra re-reads /etc/exports and applies every change immediately — no daemon restart needed.",
    xp: 10,
  },
  {
    id: "nfs-3",
    topic: "nfs",
    difficulty: "medium",
    type: "quiz",
    title: "What root_squash really does",
    prompt: "With root_squash enabled (the default), what happens when client-root writes to the share?",
    options: [
      "The write is blocked entirely",
      "Client root is mapped to an unprivileged user (nobody)",
      "Server root takes ownership of the files",
      "Files are created with mode 777",
    ],
    answerIndex: 1,
    hint: "Squash = flatten privilege.",
    explanation:
      "root_squash maps UID 0 on the client to the anonymous (nobody) user server-side — a compromised client can't own your share. no_root_squash disables that safety net.",
    xp: 20,
  },
  {
    id: "nfs-4",
    topic: "nfs",
    difficulty: "medium",
    type: "command",
    title: "Ask before you mount",
    prompt: "Query which exports the server at 192.168.56.10 offers.",
    accepted: ["showmount -e 192.168.56.10"],
    hint: "showmount, the -e flag, then the server.",
    explanation:
      "showmount -e 192.168.56.10 lists the export table — always test before writing fstab lines.",
    xp: 20,
  },
  {
    id: "nfs-5",
    topic: "nfs",
    difficulty: "hard",
    type: "quiz",
    title: "The nobody:nogroup mystery",
    prompt:
      "A client mounts the share fine, but files created there show owner nobody:nogroup on the server. Most likely cause?",
    options: [
      "root_squash is squashing every user",
      "UID/GID mismatch — users exist on the client but not the server (or vice versa)",
      "sync mode corrupts ownership",
      "The filesystem must be remounted with -o hard",
    ],
    answerIndex: 1,
    hint: "NFS passes numbers, not names.",
    explanation:
      "NFS transmits numeric UID/GIDs. If user 'maya' is UID 1000 on the client but UID 1000 is unknown on the server, files look like 'nobody'. Fix identity centrally (LDAP/same UIDs) or align the idmapd domain on NFSv4.",
    xp: 30,
  },
  // ── Containers ─────────────────────────────────────────────────────────
  {
    id: "dkr-1",
    topic: "docker",
    difficulty: "easy",
    type: "quiz",
    title: "Image vs container",
    prompt: "What is the precise relationship between an image and a container?",
    options: [
      "An image is a running process; a container is stored on disk",
      "An image is the immutable layered template; a container is a running instance with one writable layer",
      "They are the same thing with different names",
      "A container stores images inside it",
    ],
    answerIndex: 1,
    hint: "Template vs instance.",
    explanation:
      "Image = immutable layer stack. Container = image + a thin writable layer, running (or stopped). docker ps -a lists instances.",
    xp: 10,
  },
  {
    id: "dkr-2",
    topic: "docker",
    difficulty: "easy",
    type: "command",
    title: "Run it for real",
    prompt:
      "Run nginx detached, name the container web, and publish host port 8080 to container port 80. (Base image: nginx)",
    accepted: ["docker run -d --name web -p 8080:80 nginx", "docker run -d -p 8080:80 --name web nginx", "docker run --name web -d -p 8080:80 nginx", "docker run -p 8080:80 -d --name web nginx", "docker run --name web -p 8080:80 -d nginx", "docker run -p 8080:80 --name web -d nginx"],
    hint: "docker run -d --name <name> -p <host:container> <image>",
    explanation:
      "docker run -d --name web -p 8080:80 nginx — -d survives your terminal, -p publishes the port. Open http://localhost:8080 and nginx answers.",
    xp: 10,
  },
  {
    id: "dkr-3",
    topic: "docker",
    difficulty: "medium",
    type: "command",
    title: "IDs only",
    prompt: "List ONLY the container IDs of currently running containers.",
    accepted: ["docker ps -q"],
    hint: "docker ps plus the flag for quiet/IDs-only.",
    explanation:
      "docker ps -q prints just the IDs — perfect for piping: docker rm -f $(docker ps -q).",
    xp: 20,
  },
  {
    id: "dkr-4",
    topic: "docker",
    difficulty: "medium",
    type: "quiz",
    title: "Data that survives",
    prompt: "Which storage type survives `docker rm` AND lives in a Docker-managed area of the host?",
    options: ["The container's writable layer", "A bind mount", "A named volume", "tmpfs mount"],
    answerIndex: 2,
    hint: "Think 'docker volume create'.",
    explanation:
      "Named volumes live in /var/lib/docker/volumes, are managed by Docker, and outlive containers. Bind mounts survive too but map an exact host path you choose.",
    xp: 20,
  },
  {
    id: "dkr-5",
    topic: "docker",
    difficulty: "hard",
    type: "quiz",
    title: "Why not SSH?",
    prompt: "Why is `docker exec -it web sh` preferred over installing sshd in every container?",
    options: [
      "SSH encrypts traffic; exec does not",
      "exec attaches to the container's namespaces directly — no extra daemon, no keys, no attack surface",
      "exec works only on stopped containers",
      "sshd cannot run as PID 1",
    ],
    answerIndex: 1,
    hint: "Containers should stay minimal & immutable.",
    explanation:
      "Containers are supposed to be single-purpose and immutable. exec uses the container's existing namespaces (no sshd, no credentials), keeping the attack surface tiny — the Docker philosophy in one command.",
    xp: 30,
  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Resource hub — every URL verified live                                   */
/* ──────────────────────────────────────────────────────────────────────── */

export interface Platform {
  name: string;
  url: string;
  blurb: string;
  tag: "wargame" | "labs" | "sandbox" | "reference" | "course";
  topics: string;
}

export const PLATFORMS: Platform[] = [
  {
    name: "OverTheWire — Bandit",
    url: "https://overthewire.org/wargames/bandit/",
    blurb: "The classic SSH wargame. Level-by-level command-line puzzles — the closest thing to LeetCode for the Linux terminal.",
    tag: "wargame",
    topics: "CLI · SSH · permissions",
  },
  {
    name: "SadServers",
    url: "https://sadservers.com/",
    blurb: "'LeetCode for sysadmins' — broken servers, real scenarios, fix them in a live shell. Storage & mount cases included.",
    tag: "wargame",
    topics: "troubleshooting · storage",
  },
  {
    name: "cmdchallenge",
    url: "https://cmdchallenge.com/",
    blurb: "One-line bash puzzles in the browser. 'Print the 3rd largest number in a file' — you get the idea.",
    tag: "wargame",
    topics: "bash · text tools",
  },
  {
    name: "Killercoda",
    url: "https://killercoda.com/",
    blurb: "Free interactive scenarios with real Linux/Ubuntu nodes in the browser — LVM, NFS and container tracks.",
    tag: "labs",
    topics: "linux · containers",
  },
  {
    name: "Play with Docker",
    url: "https://labs.play-with-docker.com/",
    blurb: "Official Docker sandbox — spin up real Docker in a browser tab and run every command from this site.",
    tag: "sandbox",
    topics: "docker",
  },
  {
    name: "TryHackMe",
    url: "https://tryhackme.com/",
    blurb: "Guided hacker-style rooms. Linux Fundamentals 1-3 are the smoothest beginner path on the internet.",
    tag: "course",
    topics: "linux · security",
  },
  {
    name: "Linux Survival",
    url: "https://linuxsurvival.com/",
    blurb: "Interactive bash course disguised as a quiz journey — great first week of Linux.",
    tag: "course",
    topics: "bash · basics",
  },
  {
    name: "KodeKloud",
    url: "https://kodekloud.com/",
    blurb: "Browser labs with automatic grading — the strongest free+paid hands-on lab library for Linux & DevOps.",
    tag: "labs",
    topics: "lvm · devops",
  },
  {
    name: "Linux Journey",
    url: "https://linuxjourney.com/",
    blurb: "The beloved classic: bite-sized lessons from the shell to networking, with quizzes.",
    tag: "course",
    topics: "basics · networking",
  },
  {
    name: "explainshell",
    url: "https://explainshell.com/",
    blurb: "Paste ANY command — every flag is explained against real man pages. Bookmark it; you'll use it daily.",
    tag: "reference",
    topics: "reference",
  },
  {
    name: "freeCodeCamp",
    url: "https://www.freecodecamp.org/",
    blurb: "Multi-hour YouTube-grade courses (incl. Docker & Linux) plus certifications — free forever.",
    tag: "course",
    topics: "docker · linux",
  },
];

/** Hacker-vibe starter videos for the resources hub (all IDs verified). */
export const HACKER_VIDEOS: VideoPick[] = [
  {
    id: "VbEx7B_PTOE",
    title: "Linux for Hackers // EP 1 (FREE Linux course for beginners)",
    channel: "NetworkChuck",
    blurb: "Start here if the green terminal got you. Full beginner course, hacker energy.",
  },
  {
    id: "A3G-3hp88mo",
    title: "The Linux File System explained in 1,233 seconds",
    channel: "NetworkChuck",
    blurb: "/etc, /var, /dev demystified — perfect before the LVM chapter.",
  },
  {
    id: "ACM36qtHIEg",
    title: "You need to HACK faster!! (Linux Terminal hacks)",
    channel: "NetworkChuck",
    blurb: "Shortcuts, aliases and terminal speed — pure fun fuel.",
  },
];
