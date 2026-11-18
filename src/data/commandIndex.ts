import { LVM_META, LVM_STEPS } from "./lvm";
import { NFS_META, NFS_STEPS } from "./nfs";
import { DOCKER_META, DOCKER_STEPS, DOCKER_LIFECYCLE } from "./docker";
import type { ImplementationStep } from "./types";

export interface CommandEntry {
  cmd: string;
  label: string;
  route: string;
  accent: "lvm" | "nfs" | "docker";
  sectionTitle: string;
}

function fromSteps(
  steps: ImplementationStep[],
  route: string,
  accent: "lvm" | "nfs" | "docker",
  sectionTitle: string
): CommandEntry[] {
  const out: CommandEntry[] = [];
  for (const step of steps) {
    for (const c of step.commands) {
      // Skip fstab/comment lines that aren't runnable-looking commands
      if (c.cmd.startsWith("#")) continue;
      out.push({
        cmd: c.cmd,
        label: step.title.replace(/^\d+ · /, ""),
        route,
        accent,
        sectionTitle,
      });
    }
  }
  return out;
}

const lifecycleEntries: CommandEntry[] = DOCKER_LIFECYCLE.map((s) => ({
  cmd: s.command,
  label: `Lifecycle: ${s.label}`,
  route: "/courses/containers",
  accent: "docker" as const,
  sectionTitle: "Containers",
}));

export const COMMAND_INDEX: CommandEntry[] = [
  ...fromSteps(LVM_STEPS, "/courses/lvm", "lvm", "LVM"),
  ...fromSteps(NFS_STEPS, "/courses/nfs", "nfs", "NFS"),
  ...fromSteps(DOCKER_STEPS, "/courses/containers", "docker", "Containers"),
  ...lifecycleEntries,
].filter(
  (e, i, arr) => arr.findIndex((x) => x.cmd === e.cmd) === i // dedupe
);

export const CASE_METAS = [LVM_META, NFS_META, DOCKER_META];

export const TICKER_COMMANDS = [
  "pvcreate /dev/sdb",
  "vgcreate vg_lab /dev/sdb /dev/sdc /dev/sdd",
  "lvcreate -n lv_data -L 5G vg_lab",
  "mkfs.xfs /dev/vg_lab/lv_data",
  "lvextend -L +2G -r /dev/vg_lab/lv_data",
  "lvcreate -s -n lv_data_snap -L 1G vg_lab/lv_data",
  "lvconvert --merge vg_lab/lv_data_snap",
  "apt install -y nfs-kernel-server",
  "chmod 2775 /srv/nfs/shared",
  "exportfs -ra",
  "showmount -e 192.168.56.10",
  "mount -t nfs -o rw,sync n10:/srv/nfs/shared /mnt/shared",
  "ufw allow from 192.168.56.0/24 to any port 2049 proto tcp",
  "nfsstat -s",
  "docker build -t lab-app:1.0 .",
  "docker run -d --name web -v lab_data:/data lab-app:1.0",
  "docker pause web && docker unpause web",
  "docker rm -f web",
  "docker volume create lab_data",
  "docker system prune -f",
];
