import type {
  CaseMeta,
  ImplementationStep,
  TermScenario,
  TroubleshootingRow,
  VerificationRow,
} from "./types";

export const DOCKER_META: CaseMeta = {
  id: "docker",
  num: "03",
  title: "Ship It Once",
  tagline: "Containers — 0.2s boots, disposable runtimes, durable volumes",
  accent: "docker",
  execSummary:
    "The lab's final service was containerised on a 5-layer image (FROM → COPY → RUN → EXPOSE → CMD). Measured on identical hardware, the container reached Running in 0.2s while a full VM boot on the same host took 18s — a 90× head start that compounds across every deploy and CI run. The full lifecycle state machine was exercised (Created → Running → Paused → Stopped → Removed) with the exact docker command for each transition, and the one rule that survives every incident was proven twice: docker rm -f destroys the container but the named volume's data orb came back untouched on the next docker run — sha256 identical. Layer caching turned a 41s rebuild into 3.2s by keeping immutable instructions above the COPY line.",
  problem:
    "VMs cost 18s and gigabytes per instance; the old deploy was a shell script with drift baked in — 'works on staging' died in prod because staging was never truly disposable. Redeploys lost uploaded data until a data-path was formalised, and CI rebuilt everything from scratch because a COPY came before the dependency install in the Dockerfile.",
  outcome:
    "Boot time 18s → 0.2s; rebuild 41s → 3.2s via layer-cache reordering; data durability decoupled from container mortality via named volumes; one image runs identically on three NFS-mounted hosts.",
};

export interface LifecycleState {
  key: string;
  label: string;
  command: string;
  explain: string;
}

export const DOCKER_LIFECYCLE: LifecycleState[] = [
  {
    key: "created",
    label: "Created",
    command: "docker create --name web lab-app:1.0",
    explain:
      "Filesystem assembled from image layers, but no process yet — a container in suspenders before the belt.",
  },
  {
    key: "running",
    label: "Running",
    command: "docker start web   # or: docker run -d --name web lab-app:1.0",
    explain:
      "The shim hands the process PID 1, cgroups + namespaces isolate it, and the pause-meter starts.",
  },
  {
    key: "paused",
    label: "Paused",
    command: "docker pause web",
    explain:
      "The cgroup freezer freezes all tasks — memory stays resident, CPU stops. Perfect for fork-bombs and checklists.",
  },
  {
    key: "stopped",
    label: "Stopped",
    command: "docker stop web   # SIGTERM, then SIGKILL after grace period",
    explain:
      "PID 1 gets SIGTERM, drains, exits. The writable layer stays on disk until you remove it.",
  },
  {
    key: "removed",
    label: "Removed",
    command: "docker rm -f web",
    explain:
      "Container and writable layer gone. Everything not in a volume just vaporised — which is the demo, next panel.",
  },
];

export const DOCKER_STEPS: ImplementationStep[] = [
  {
    id: "image",
    title: "1 · Write a cache-friendly Dockerfile",
    description:
      "Order layers least→most volatile. Dependencies install before source COPY, so a code edit never re-downloads pip packages.",
    commands: [
      { cmd: "FROM ubuntu:24.04", note: "base layer — changes once a quarter" },
      { cmd: "COPY requirements.txt /app/", note: "changes with deps, not code" },
      { cmd: "RUN pip install -r /app/requirements.txt", note: "the expensive layer" },
      { cmd: "COPY src/ /app/src/", note: "changes every commit — keep it last" },
      { cmd: "EXPOSE 8000 && CMD [\"./serve\"]" },
    ],
  },
  {
    id: "run",
    title: "2 · Run it with a name and a volume",
    description:
      "Named volumes survive containers. Mounting one at the data path is what makes rm -f survivable.",
    commands: [
      { cmd: "docker volume create lab_data" },
      { cmd: "docker run -d --name web -p 8080:8000 -v lab_data:/data lab-app:1.0" },
      { cmd: "docker ps --format 'table {{.Names}}\\t{{.Status}}'" },
    ],
  },
  {
    id: "lifecycle",
    title: "3 · Walk the lifecycle",
    description:
      "Every transition has exactly one command. Learn them and containers stop being magic.",
    commands: [
      { cmd: "docker create --name web lab-app:1.0", note: "Created" },
      { cmd: "docker start web", note: "Running" },
      { cmd: "docker pause web   && docker unpause web", note: "Paused ↔ Running" },
      { cmd: "docker stop web", note: "Stopped" },
      { cmd: "docker rm -f web", note: "Removed — writable layer gone" },
    ],
  },
  {
    id: "volume",
    title: "4 · Prove volume durability",
    description:
      "Write a marker file inside the container, destroy the container, run a new one on the same volume, read the file back.",
    commands: [
      { cmd: "docker exec web sh -c 'echo payload > /data/marker.txt'" },
      { cmd: "docker rm -f web", note: "container dies, /data is in lab_data" },
      { cmd: "docker run -d --name web2 -v lab_data:/data lab-app:1.0" },
      { cmd: "docker exec web2 cat /data/marker.txt   # → payload" },
    ],
  },
  {
    id: "cache",
    title: "5 · Rebuild with layer cache",
    description:
      "Change one source file: layers under COPY src/ are CACHED instantly, only the tail rebuilds.",
    commands: [
      { cmd: "docker build -t lab-app:1.1 .   # after editing src/" },
      { cmd: "docker image ls lab-app" },
      { cmd: "docker builder prune -f", note: "when the cache itself becomes a liability" },
    ],
  },
];

export const DOCKER_LAYERS = [
  { instr: "FROM ubuntu:24.04", size: "78.1MB", cache: "hit" as const, note: "Base layer shared by every build on this host." },
  { instr: "COPY requirements.txt /app/", size: "4KB", cache: "hit" as const, note: "Busts only when dependencies change — not on code edits." },
  { instr: "RUN pip install -r requirements.txt", size: "112MB", cache: "hit" as const, note: "The expensive layer. Cache hit here is where the 41s → 3.2s lives." },
  { instr: "COPY src/ /app/src/", size: "1.2MB", cache: "bust" as const, note: "Changed source = cache bust. Everything AFTER it rebuilds too." },
  { instr: "EXPOSE 8000", size: "0B", cache: "bust" as const, note: "Metadata layer — rebuilt because the layer above it changed." },
  { instr: "CMD [\"./serve\"]", size: "0B", cache: "bust" as const, note: "Same. Immutable layers below, rebuildable layers above." },
];

export const DOCKER_VERIFICATION: VerificationRow[] = [
  {
    command: "time (docker run -d lab-app:1.0 → Up)",
    expect: "sub-second boot vs 18s VM",
    result: "0.2s to Running (90× faster than the VM lane)",
    pass: true,
  },
  {
    command: "docker pause web && docker ps",
    expect: "STATUS shows Up (Paused)",
    result: "Up 2 minutes (Paused) — freezer confirmed",
    pass: true,
  },
  {
    command: "docker rm -f web && rerun on lab_data",
    expect: "marker.txt survives the container",
    result: "cat /data/marker.txt → payload, sha256 identical",
    pass: true,
  },
  {
    command: "docker build after source edit",
    expect: "early layers CACHED, tail rebuilds",
    result: "3.2s rebuild vs 41s cold — cache hit on COPY requirements.txt",
    pass: true,
  },
];

export const DOCKER_TROUBLESHOOTING: TroubleshootingRow[] = [
  {
    symptom: "docker: Error — port is already allocated",
    cause: "Another container (or a zombie) holds the host port.",
    fix: "docker ps --format '{{.Names}} {{.Ports}}' to find the squatter; docker rm -f it or publish a different port.",
  },
  {
    symptom: "Permission denied writing to the mounted volume",
    cause: "In-container UID ≠ UID that owns the volume directory (classic NFS + Docker double-squash too).",
    fix: "Match UIDs in the Dockerfile (RUN useradd -u 2020 app) or chown the volume path once at runtime.",
  },
  {
    symptom: "Container exits immediately (0) after start",
    cause: "No long-lived PID 1 — CMD is a script that returns or a daemon that forked away.",
    fix: "Run in foreground (./serve, not service nginx start) or set init: true for signal handling.",
  },
  {
    symptom: "Build never uses cache",
    cause: "A volatile COPY (src/, .git) sits ABOVE the expensive RUN pip install line.",
    fix: "Reorder: COPY requirements.txt → RUN pip install → COPY src/. Cache is a chain — one bust breaks the tail.",
  },
  {
    symptom: "Disk full on the docker host",
    cause: "Dangling images + stopped containers + build cache pile up.",
    fix: "docker system df to see it, docker system prune -a --volumes (careful: volumes!) on a cadence.",
  },
];

export const DOCKER_SCENARIOS: TermScenario[] = [
  {
    id: "dk-build",
    title: "Build the image",
    blurb: "Five layers, cache-friendly order, watch the step numbering.",
    steps: [
      {
        cmd: "docker build -t lab-app:1.0 .",
        outputs: [
          "[+] Building 41.2s (12/12) FINISHED",
          " => [1/5] FROM ubuntu:24.04                    0.4s",
          " => [2/5] COPY requirements.txt /app/          0.1s",
          " => [3/5] RUN pip install -r requirements.txt 39.8s",
          " => [4/5] COPY src/ /app/src/                  0.3s",
          " => [5/5] CMD [\"./serve\"]                      0.0s",
          " => exporting layers                           0.6s",
          " => naming to docker.io/library/lab-app:1.0    done",
        ],
      },
    ],
  },
  {
    id: "dk-run",
    title: "Run and inspect",
    blurb: "Named container, published port, ps with a template.",
    steps: [
      {
        cmd: "docker run -d --name web -p 8080:8000 -v lab_data:/data lab-app:1.0",
        outputs: ["a3f9c2e1b7d4"],
      },
      {
        cmd: "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
        outputs: [
          "NAMES   STATUS         PORTS",
          "web     Up 2 seconds   0.0.0.0:8080->8000/tcp",
        ],
      },
      {
        cmd: "curl -s localhost:8080/healthz",
        outputs: ["{\"status\":\"ok\",\"pid\":1}"],
      },
    ],
  },
  {
    id: "dk-pause",
    title: "Pause ⇄ unpause",
    blurb: "The cgroup freezer in action — memory stays, CPU stops.",
    steps: [
      {
        cmd: "docker pause web",
        outputs: ["web"],
      },
      {
        cmd: "docker ps --format '{{.Names}}: {{.Status}}'",
        outputs: ["web: Up 2 minutes (Paused)"],
      },
      {
        cmd: "docker unpause web",
        outputs: ["web"],
      },
      {
        cmd: "docker ps --format '{{.Names}}: {{.Status}}'",
        outputs: ["web: Up 2 minutes"],
      },
    ],
  },
  {
    id: "dk-stop",
    title: "Stop and remove",
    blurb: "SIGTERM with grace, then the writable layer is gone for good.",
    steps: [
      {
        cmd: "docker stop web",
        outputs: ["web"],
      },
      {
        cmd: "docker ps -a --format '{{.Names}}: {{.Status}}'",
        outputs: ["web: Exited (0) 12 seconds ago"],
      },
      {
        cmd: "docker start web && docker rm -f web",
        outputs: ["web", "web   # removed — writable layer destroyed"],
      },
    ],
  },
  {
    id: "dk-volume",
    title: "Volume survives rm -f",
    blurb: "Kill the container, keep the data — the whole volume argument in one take.",
    steps: [
      {
        cmd: "docker exec web sh -c 'echo payload > /data/marker.txt && sha256sum /data/marker.txt'",
        outputs: ["a1b2c3d4e5f6...  /data/marker.txt"],
      },
      {
        cmd: "docker rm -f web",
        outputs: ["web   # container + writable layer destroyed"],
      },
      {
        cmd: "docker run -d --name web2 -v lab_data:/data lab-app:1.0",
        outputs: ["7e2d9c4a1b8f"],
      },
      {
        cmd: "docker exec web2 cat /data/marker.txt",
        outputs: ["payload   # still here — volumes outlive containers"],
      },
    ],
  },
  {
    id: "dk-cache",
    title: "Layer cache on a code change",
    blurb: "One edited file: 3 layers CACHED, tail rebuilds in 3.2s.",
    steps: [
      {
        cmd: "echo 'console.log(1)' >> src/app.js && docker build -t lab-app:1.1 .",
        outputs: [
          "[+] Building 3.2s (12/12) FINISHED",
          " => CACHED [1/5] FROM ubuntu:24.04",
          " => CACHED [2/5] COPY requirements.txt /app/",
          " => CACHED [3/5] RUN pip install -r requirements.txt",
          " => [4/5] COPY src/ /app/src/                  0.4s   # cache bust",
          " => [5/5] CMD [\"./serve\"]                      0.0s",
          " => naming to docker.io/library/lab-app:1.1    done",
        ],
      },
    ],
  },
  {
    id: "dk-exec",
    title: "Exec into the process tree",
    blurb: "One namespace, two processes — the PID 1 contract up close.",
    steps: [
      {
        cmd: "docker exec -it web sh",
        outputs: ["/# "],
      },
      {
        cmd: "ps aux",
        outputs: [
          "USER   PID %CPU %MEM COMMAND",
          "root     1  0.0  0.1 ./serve",
          "root    19  0.0  0.0 ps aux",
        ],
      },
      {
        cmd: "df -h /data",
        outputs: [
          "Filesystem      Size  Used Avail Use% Mounted on",
          "/dev/sdc        9.8G  2.3G  7.5G  24% /data   # from the LVM pool",
        ],
      },
    ],
  },
  {
    id: "dk-prune",
    title: "Reclaim disk space",
    blurb: "docker system df first, then prune on purpose.",
    steps: [
      {
        cmd: "docker system df",
        outputs: [
          "TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE",
          "Images          14        3         2.41GB    1.63GB (67%)",
          "Containers      9         2         148MB     121MB (81%)",
          "Build Cache     35        0         812MB     812MB (100%)",
        ],
      },
      {
        cmd: "docker image prune -f && docker builder prune -f",
        outputs: [
          "Total reclaimed space: 612.4MB",
          "Total reclaimed space: 812MB",
        ],
      },
    ],
  },
];
