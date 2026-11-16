/* Docker / containers question templates — assembled and sliced by gen-bank.mjs. */

const IMAGES = ["nginx:1.27", "redis:7", "postgres:16", "node:20-alpine", "ubuntu:24.04"];
const NAMES = ["web", "cache", "db", "worker", "proxy"];
const PORTS = [
  ["8080", "80"],
  ["5432", "5432"],
  ["6379", "6379"],
  ["3000", "3000"],
  ["9090", "80"],
];

export const templates = [
  // ── command templates ────────────────────────────────────────────────
  () =>
    IMAGES.slice(0, 5).map((img, i) => {
      const [host, cont] = PORTS[i];
      const name = NAMES[i];
      return {
        type: "command",
        difficulty: "easy",
        title: `Run ${img} detached with a port map`,
        prompt: `Run image ${img} in a detached container named ${name}, publishing host port ${host} to container port ${cont}.`,
        accepted: [`docker run -d --name ${name} -p ${host}:${cont} ${img}`],
        hint: "-d detaches, --name names it, -p maps host:container.",
        explanation: `docker run -d --name ${name} -p ${host}:${cont} ${img} starts it in the background. Note the order: -p is HOST port first, container port second.`,
        practice: `docker run -d --name ${name} -p ${host}:${cont} ${img}`,
        tag: "run",
      };
    }),
  () =>
    IMAGES.slice(0, 5).map((img) => ({
      type: "command",
      difficulty: "easy",
      title: `Pull an image`,
      prompt: `Download the image ${img} to your local Docker cache without running it.`,
      accepted: [`docker pull ${img}`],
      hint: "docker pull fetches images from the registry.",
      explanation: `docker pull ${img} fetches every layer it does not already have — layers are shared across images, so pulls shrink as your cache warms up.`,
      practice: `docker pull ${img}`,
      tag: "image",
    })),
  () =>
    ["lab-app:1.0", "lab-app:2.0", "api:dev", "frontend:latest", "tools:stable"].map((tag) => ({
      type: "command",
      difficulty: "easy",
      title: `Build an image`,
      prompt: `Build the image from the Dockerfile in the current directory and tag it as ${tag}.`,
      accepted: [`docker build -t ${tag} .`],
      hint: "-t tags it; the final argument is the build context.",
      explanation: `docker build -t ${tag} . builds the Dockerfile in the context '.'. Every instruction becomes a layer; unchanged layers come back as cached CACHED lines.`,
      practice: `docker build -t ${tag} .`,
      tag: "image",
    })),
  () =>
    NAMES.slice(0, 5).map((c) => ({
      type: "command",
      difficulty: "easy",
      title: `Open a shell inside ${c}`,
      prompt: `Get an interactive shell session inside the running container ${c}.`,
      accepted: [`docker exec -it ${c} sh`, `docker exec -it ${c} bash`, `docker exec -ti ${c} sh`, `docker exec -ti ${c} bash`],
      hint: "exec runs a new process inside; -i keeps stdin, -t a terminal.",
      explanation: `docker exec -it ${c} bash starts a NEW process in the running container — great for poking around. exit leaves the container running (unlike attach).`,
      practice: `docker exec -it ${c} bash`,
      tag: "run",
    })),
  () =>
    NAMES.slice(0, 5).map((c, i) => ({
      type: "command",
      difficulty: "easy",
      title: i % 2 === 0 ? `Follow ${c}'s logs` : `Tail ${c}'s last 100 log lines`,
      prompt:
        i % 2 === 0
          ? `Stream the stdout/stderr logs of container ${c} live.`
          : `Show only the most recent 100 log lines of container ${c}.`,
      accepted: i % 2 === 0 ? [`docker logs -f ${c}`] : [`docker logs --tail 100 ${c}`, `docker logs -n 100 ${c}`],
      hint: "docker logs has -f (follow) and --tail (count) flags.",
      explanation: `docker logs -f ${c} streams like tail -f; --tail 100 shows the last 100. Logs come from the container's main process stdout/stderr.`,
      practice: `docker logs -f ${c}`,
      tag: "run",
    })),
  () =>
    [
      ["app.log", "web", "/tmp/app.log"],
      ["dump.sql", "db", "/tmp/dump.sql"],
      ["config.yml", "proxy", "/etc/app/config.yml"],
      ["results.json", "worker", "/out/results.json"],
      ["id_rsa.pub", "web", "/root/.ssh/authorized_keys"],
    ].map(([file, c, path]) => ({
      type: "command",
      difficulty: "medium",
      title: "Copy a file into a container",
      prompt: `Copy the local file ${file} into container ${c} at ${path}.`,
      accepted: [`docker cp ${file} ${c}:${path}`],
      hint: "docker cp works like scp: source then container:path.",
      explanation: `docker cp ${file} ${c}:${path} streams the file through the container's filesystem — handy for config drops without rebuilding the image.`,
      practice: `docker cp app.log web:/tmp/app.log`,
      tag: "run",
    })),
  () =>
    [
      ["lab_data", "/data", "web"],
      ["pg_data", "/var/lib/postgresql/data", "db"],
      ["redis_cache", "/data", "cache"],
      ["uploads", "/srv/uploads", "worker"],
      ["logs_vol", "/var/log/app", "proxy"],
    ].map(([vol, mnt, c]) => ({
      type: "command",
      difficulty: "medium",
      title: `Run with a named volume`,
      prompt: `Run container ${c} (any base image, e.g. ubuntu) with named volume ${vol} mounted at ${mnt}, detached.`,
      accepted: [
        `docker run -d --name ${c} -v ${vol}:${mnt} ubuntu`,
        `docker run -d --name ${c} -v ${vol}:${mnt} ubuntu:24.04`,
        `docker run -d -v ${vol}:${mnt} --name ${c} ubuntu`,
      ],
      hint: "-v volume:mountpoint — named volumes live in /var/lib/docker/volumes.",
      explanation: `-v ${vol}:${mnt} creates/uses the named volume ${vol}. Volumes survive container removal — that is exactly what our lab demonstrates with docker rm.`,
      practice: `docker run -d --name web -v lab_data:/data ubuntu`,
      tag: "volume",
    })),
  () => [
    {
      type: "command",
      difficulty: "easy",
      title: "Bring up a compose stack",
      prompt: "Start every service defined in docker-compose.yml, detached.",
      accepted: ["docker compose up -d", "docker-compose up -d"],
      hint: "compose up, detached.",
      explanation:
        "docker compose up -d builds/pulls what is missing and starts all services. compose also creates a project network where services reach each other BY SERVICE NAME.",
      practice: "docker compose up -d",
      tag: "compose",
    },
    {
      type: "command",
      difficulty: "easy",
      title: "Tear down a compose stack",
      prompt: "Stop and remove all containers and networks created by the compose project in this directory.",
      accepted: ["docker compose down", "docker-compose down"],
      hint: "The counterpart of compose up.",
      explanation:
        "docker compose down stops + removes containers and networks. Volumes survive unless you add -v — compose deliberately protects data.",
      practice: "docker compose down",
      tag: "compose",
    },
    {
      type: "command",
      difficulty: "medium",
      title: "Prune the Docker system",
      prompt: "Remove all stopped containers, dangling images and unused networks with one command.",
      accepted: ["docker system prune", "docker system prune -f"],
      hint: "The janitor command: system prune.",
      explanation:
        "docker system prune cleans stopped containers, dangling images and unused networks. Add -a for ALL unused images and -v for volumes — read before you run, it's aggressive.",
      practice: "docker system prune -f",
      tag: "image",
    },
    {
      type: "command",
      difficulty: "medium",
      title: "Live resource usage",
      prompt: "Show a live-updating stream of each container's CPU and memory usage.",
      accepted: ["docker stats"],
      hint: "Like top, but for containers.",
      explanation:
        "docker stats streams cpu/mem/net/io per container — the fastest way to see which container eats the box.",
      practice: "docker stats",
      tag: "troubleshoot",
    },
    {
      type: "command",
      difficulty: "medium",
      title: "Inspect with a format filter",
      prompt: "Print only the IP address of container web using docker inspect with a Go template.",
      accepted: [
        "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web",
        'docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" web',
      ],
      hint: "inspect -f takes a Go template over the JSON.",
      explanation:
        "docker inspect -f '{{...}}' web extracts exact fields from the metadata JSON — scriptable, no manual JSON hunting.",
      practice: "docker inspect web",
      tag: "troubleshoot",
    },
  ],
  () =>
    NAMES.slice(0, 5).map((c) => ({
      type: "command",
      difficulty: "medium",
      title: `Stop then remove ${c}`,
      prompt: `Gracefully stop container ${c} and then remove it (two commands, in order).`,
      accepted: [`docker stop ${c} && docker rm ${c}`],
      hint: "stop first (SIGTERM → SIGKILL), then rm.",
      explanation: `docker stop ${c} sends SIGTERM and waits ~10s before SIGKILL; docker rm deletes it. Named volumes survive — layers of the image are untouched.`,
      practice: `docker stop web && docker rm web`,
      tag: "run",
    })),
  () =>
    [
      ["256m", "0.5"],
      ["512m", "1.0"],
      ["128m", "0.25"],
      ["1g", "2.0"],
      ["2g", "1.5"],
    ].map(([mem, cpu], i) => ({
      type: "command",
      difficulty: "hard",
      title: `Cap a container's resources`,
      prompt: `Run image ubuntu detached as capped-${i + 1} with memory limited to ${mem} and CPUs limited to ${cpu}.`,
      accepted: [`docker run -d --name capped-${i + 1} --memory ${mem} --cpus ${cpu} ubuntu`],
      hint: "--memory and --cpus at docker run time.",
      explanation: `--memory ${mem} --cpus ${cpu} hard-caps the cgroup limits. docker stats shows usage; exceeding memory gets the process OOM-killed.`,
      practice: `docker run -d --name capped-1 --memory 256m --cpus 0.5 ubuntu`,
      tag: "run",
    })),
  () =>
    [
      "unless-stopped",
      "always",
      "on-failure:3",
      "on-failure",
      "no",
    ].map((pol) => ({
      type: "command",
      difficulty: "hard",
      title: `Restart policy: ${pol}`,
      prompt: `Run image nginx:alpine detached as resilient with the restart policy ${pol}.`,
      accepted: [`docker run -d --name resilient --restart ${pol} nginx:alpine`],
      hint: "--restart takes the policy string directly.",
      explanation:
        pol === "unless-stopped"
          ? "unless-stopped restarts on daemon restart and crash — but respects a manual stop. The sweet spot for most services."
          : pol === "always"
            ? "always restarts on every daemon restart too — even if you stopped it before the restart."
            : pol === "no"
              ? "no (the default) never restarts — explicit non-policy for one-shot containers."
              : `on-failure restarts only when the process exits non-zero${pol.includes(":") ? ", capped at 3 attempts" : ""}.`,
      practice: `docker run -d --name resilient --restart unless-stopped nginx:alpine`,
      tag: "run",
    })),
  () =>
    IMAGES.slice(0, 5).map((img) => ({
      type: "command",
      difficulty: "hard",
      title: "Save an image to a tarball",
      prompt: `Export image ${img} to the file image.tar so it can be moved to an air-gapped host.`,
      accepted: [`docker save -o image.tar ${img}`, `docker save ${img} -o image.tar`, `docker save --output image.tar ${img}`],
      hint: "docker save writes a tar; docker load restores it.",
      explanation: `docker save -o image.tar ${img} packs all layers; on the other host docker load -i image.tar restores it. The offline alternative to a registry.`,
      practice: `docker save -o image.tar nginx:1.27`,
      tag: "image",
    })),

  // ── quiz templates ───────────────────────────────────────────────────
  () =>
    [
      {
        q: "What is the relationship between an image and a container?",
        a: "An image is the immutable template; a container is a running (or stopped) instance with a writable layer on top",
        h: "Class vs instance.",
      },
      {
        q: "What does docker commit do?",
        a: "Freezes a container's current writable layer into a new image",
        h: "It snapshots the container as an image.",
      },
      {
        q: "What are image layers?",
        a: "Read-only filesystem diffs stacked by Dockerfile instructions and shared between images",
        h: "Layers are diffs, shared and cached.",
      },
      {
        q: "What does the writable layer do?",
        a: "Stores everything the container changes at runtime — deleted with the container",
        h: "Copy-on-write on top of the image.",
      },
      {
        q: "Why do containers start fast compared to VMs?",
        a: "No guest kernel — containers share the host kernel and only isolate namespaces/cgroups",
        h: "Kernel-sharing is the trick.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "easy",
      title: "Images & containers",
      prompt: o.q,
      options: [
        o.a,
        "An image is a running process; a container is its snapshot",
        "They are the same thing with different names",
        "Containers hold images inside them",
        "It rewrites the Dockerfile into the image",
        "It commits the image to a registry",
        "It saves the container to a tarball",
        "Read-only filesystem diffs stacked by Dockerfile instructions and shared between images",
        "Compressed tarballs downloaded from Docker Hub",
        "Git repositories cloned at build time",
        "Stores everything the container changes at runtime — deleted with the container",
        "It persists data across container removal",
        "It holds the container's logs",
        "No guest kernel — containers share the host kernel and only isolate namespaces/cgroups",
        "They boot a stripped-down Linux kernel in 1 second",
        "Docker skips hardware drivers",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} image = immutable layers; container = those layers + one writable layer, isolated by namespaces, limited by cgroups.`,
      practice: "docker images && docker ps -a",
      tag: "image",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "What is the difference between CMD and ENTRYPOINT?",
        a: "ENTRYPOINT is the fixed executable; CMD supplies default args (fully overridable by docker run)",
        h: "One is the program, the other its arguments.",
      },
      {
        q: "docker run image /bin/sh — what happens to the Dockerfile's CMD?",
        a: "It is replaced by /bin/sh",
        h: "run arguments override CMD.",
      },
      {
        q: "Which instruction should bake the launch command of a self-contained app image?",
        a: "ENTRYPOINT (with CMD for default flags)",
        h: "Fixed executable + default args pattern.",
      },
      {
        q: "What does EXPOSE in a Dockerfile do?",
        a: "Documents which port the container listens on — publishing still needs -p",
        h: "Documentation vs reality.",
      },
      {
        q: "What does WORKDIR change?",
        a: "The working directory for every later instruction (RUN, CMD, COPY…)",
        h: "It is cd for the build and runtime.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Dockerfile instructions",
      prompt: o.q,
      options: [
        o.a,
        "CMD runs at build time; ENTRYPOINT at runtime",
        "They are aliases — no difference",
        "ENTRYPOINT must be shell form only",
        "It is ignored and /bin/sh runs",
        "It is appended after ENTRYPOINT",
        "The build fails",
        "ENTRYPOINT (with CMD for default flags)",
        "CMD alone — ENTRYPOINT is deprecated",
        "RUN ['app'] as the last line",
        "Documents which port the container listens on — publishing still needs -p",
        "Publishes the port to the host automatically",
        "Opens the port in the host firewall",
        "The working directory for every later instruction (RUN, CMD, COPY…)",
        "The user the container runs as",
        "The image's filesystem root",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} CMD/ENTRYPOINT cooperate (exec form preferred); EXPOSE documents; WORKDIR sets cwd for everything after it.`,
      practice: "cat Dockerfile",
      tag: "dockerfile",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "COPY vs ADD — which is the recommended default?",
        a: "COPY — ADD only for auto-extracting local tarballs (its URL fetch is discouraged)",
        h: "One has surprise behaviours.",
      },
      {
        q: "Why does instruction ORDER matter in a Dockerfile?",
        a: "Each changed instruction invalidates the cache for it and every later layer",
        h: "Cache flows top-to-bottom.",
      },
      {
        q: "Where should COPY package.json + RUN npm install go relative to COPY src/?",
        a: "Before — manifest + install cache-hit while source churns",
        h: "Dependencies change less often than code.",
      },
      {
        q: "What does .dockerignore do?",
        a: "Keeps files out of the build context — smaller uploads, fewer cache busts, no secret leaks",
        h: "Like gitignore, for builds.",
      },
      {
        q: "What is the point of a multi-stage build?",
        a: "Build in a fat toolchain stage, copy only artifacts into a small final image",
        h: "Two FROMs, one artifact.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Build craft",
      prompt: o.q,
      options: [
        o.a,
        "ADD — it does everything COPY does plus more",
        "They are identical in modern Docker",
        "Neither — use RUN cp",
        "Order is irrelevant — Docker sorts layers",
        "Only RUN layers cache",
        "Later layers can refresh earlier ones",
        "Before — manifest + install layer caches while source churns",
        "After — everything must COPY first",
        "Order does not affect caching",
        "Keeps files out of the build context — smaller uploads, fewer cache busts, no secret leaks",
        "Signs the image with a checksum",
        "Ignores build errors in listed files",
        "Build in a fat toolchain stage, copy only artifacts into a small final image",
        "It builds ARM images on x86 hosts",
        "It parallelises builds across stages",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} COPY > ADD; cache flows downward so stable layers go first; .dockerignore and multi-stage keep images lean and safe.`,
      practice: "docker build -t lab-app:1.0 .",
      tag: "dockerfile",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "-p 8080:80 — which port is the HOST's?",
        a: "8080 — the left side is host, the right side is the container port",
        h: "Read it as host:container.",
      },
      {
        q: "A named volume vs a bind mount — what is the key difference?",
        a: "Named volumes are Docker-managed storage; bind mounts map an exact host directory",
        h: "Managed storage vs a literal host path.",
      },
      {
        q: "What survives docker rm on a container with a named volume?",
        a: "The volume and its data — only the container's writable layer disappears",
        h: "Volumes outlive containers.",
      },
      {
        q: "Which network does a container join by default?",
        a: "The default bridge — reachable by IP, no automatic DNS between containers",
        h: "The default network mode.",
      },
      {
        q: "Why do containers on a custom (or compose) network reach each other by name?",
        a: "Docker runs an embedded DNS server resolving container/service names",
        h: "Docker ships a tiny DNS.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Networking & storage",
      prompt: o.q,
      options: [
        o.a,
        "80 — the left side is always the container",
        "They are chosen randomly at runtime",
        "Both — the port is published twice",
        "Named volumes are Docker-managed storage; bind mounts map an exact host directory",
        "Bind mounts are slower in every case",
        "Named volumes require SELinux",
        "Nothing — volumes die with the container",
        "Only the volume's metadata",
        "The image is deleted too",
        "The default bridge — reachable by IP, no automatic DNS between containers",
        "host — sharing the host's stack",
        "none — networking is disabled",
        "Docker runs an embedded DNS server resolving container/service names",
        "Names are written into /etc/hosts by cron",
        "The registry resolves names",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} -p is host:container; volumes are managed and persistent, binds are literal host paths; custom networks give free DNS.`,
      practice: "docker network ls && docker volume ls",
      tag: "network",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "docker ps shows 'Exited (0)'. What does the 0 tell you?",
        a: "The main process exited cleanly with status 0",
        h: "Exit codes come from the main process.",
      },
      {
        q: "What does docker stop actually send first?",
        a: "SIGTERM — with a grace period before SIGKILL",
        h: "Polite first, violent later.",
      },
      {
        q: "What does --rm do on docker run?",
        a: "Removes the container (and its writable layer) as soon as it exits",
        h: "One-shot hygiene.",
      },
      {
        q: "What are dangling images?",
        a: "Untagged <none> images left behind when a rebuild re-tags — prune removes them",
        h: "Rebuilds orphan the old layers.",
      },
      {
        q: "Why is 'latest' a trap?",
        a: "It is just a default tag name — it is not guaranteed to be newest or stable",
        h: "latest is a tag, not a promise.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "medium",
      title: "Lifecycle details",
      prompt: o.q,
      options: [
        o.a,
        "The container was OOM-killed",
        "Docker restarted 0 times",
        "The image has 0 layers",
        "SIGTERM — with a grace period before SIGKILL",
        "SIGKILL immediately — stop is instant",
        "SIGHUP to reload config",
        "Removes the container (and its writable layer) as soon as it exits",
        "Makes the container read-only",
        "Detaches you from the container",
        "Untagged <none> images left behind when a rebuild re-tags — prune removes them",
        "Images with no base layer",
        "Images currently in use but idle",
        "It is just a default tag name — it is not guaranteed to be newest or stable",
        "It always points to the newest build",
        "It is a reserved read-only tag",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} exit codes come from PID 1; stop is TERM-then-KILL; --rm keeps one-shots clean; prune eats dangling layers; pin real versions instead of latest.`,
      practice: "docker ps -a",
      tag: "run",
      _correctText: o.a,
    })),
  () =>
    [
      {
        q: "What does a HEALTHCHECK in a Dockerfile give you?",
        a: "A status of healthy/unhealthy driven by a probe command — compose can gate depends_on on it",
        h: "It answers: is it actually working?",
      },
      {
        q: "Which restart policy also restarts containers after a daemon reboot?",
        a: "always — and unless-stopped, except for ones you manually stopped",
        h: "Two policies survive reboots.",
      },
      {
        q: "What does docker pause do?",
        a: "Freezes the container's processes with SIGSTOP — state stays in memory",
        h: "Freeze, not stop.",
      },
      {
        q: "What is PID 1 in a container, and why does it matter?",
        a: "The image's ENTRYPOINT/CMD — signals only reach it, so zombies linger without an init",
        h: "The kernel only reaps via PID 1.",
      },
      {
        q: "What does --memory=256m enforce?",
        a: "A hard cgroup cap — exceed it and the OOM killer terminates the process",
        h: "It is a limit, not a reservation.",
      },
    ].map((o) => ({
      type: "quiz",
      difficulty: "hard",
      title: "Runtime internals",
      prompt: o.q,
      options: [
        o.a,
        "A status of healthy/unhealthy driven by a probe command — compose can gate depends_on on it",
        "It restarts the container when it crashes",
        "It publishes a /health HTTP route",
        "always — and unless-stopped, except for ones you manually stopped",
        "on-failure only",
        "no — policies never survive reboots",
        "Freezes the container's processes with SIGSTOP — state stays in memory",
        "It snapshots the filesystem to disk",
        "It suspends the VM underneath",
        "The image's ENTRYPOINT/CMD — signals only reach it, so zombies linger without an init",
        "A shell spawned by Docker",
        "The host's init system",
        "A hard cgroup cap — exceed it and the OOM killer terminates the process",
        "A soft hint the kernel ignores under pressure",
        "The maximum swap the container may use",
      ],
      answerIndex: null,
      hint: o.h,
      explanation: `${o.a} healthchecks express real readiness; policies control restarts; pause freezes; PID 1 owns signals; --memory is a hard cap.`,
      practice: "docker inspect --format '{{.State.Health.Status}}' web",
      tag: "troubleshoot",
      _correctText: o.a,
    })),
];
