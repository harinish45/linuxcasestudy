export interface TermStep {
  cmd: string;
  outputs: string[];
  /** false renders a red "expected refusal" block (teaching moments). */
  ok?: boolean;
}

export interface TermScenario {
  id: string;
  title: string;
  blurb: string;
  steps: TermStep[];
}

export interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  commands: { cmd: string; note?: string }[];
}

export interface VerificationRow {
  command: string;
  expect: string;
  result: string;
  pass: boolean;
}

export interface TroubleshootingRow {
  symptom: string;
  cause: string;
  fix: string;
}

export interface CaseMeta {
  id: string;
  num: string;
  title: string;
  tagline: string;
  accent: "lvm" | "nfs" | "docker";
  execSummary: string;
  problem: string;
  outcome: string;
}
