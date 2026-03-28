// ============ Docking Results ============
/**
 * Represents a single docking pose with its scoring metrics (called "complex" in the backend)
 * Each complex contains various energy components and the overall docking score (delta_g)
 * as well as the RMSD to the reference pose. These metrics are used to evaluate the quality
 * of the docking pose and to rank multiple poses generated from a docking run.
 */
export interface Complex {
  total_score: number;
  atom_pair_cst: number;
  atom_attraction: number;
  electrostatic: number;
  atom_repulsion: number;
  solvation: number;
  hbond: number;
  delta_g: number;
  pairwise_energy: number;
  rmsd: number;
}

// ============ Docking Job Status ============
/**
 * Full docking job with all metadata, molecular properties, constraints, and results
 */
export interface DockingJob {
  // ---- Core Identity ----
  job_id: string;
  name: string;
  created: string;
  job_status: "draft" | "running" | "completed" | "failed";

  // ---- Molecular Structure ----
  smiles: string;
  sdf: string | null;

  // ---- Molecular Properties (calculated) ----
  weight: number;
  hbond_acc: number;
  hbond_don: number;
  logp: number;
  qed: number;
  is_sub: boolean;

  // ---- Docking Configuration ----
  constraints: ((number | number[] | string)[] | number)[];
  runs: number;

  // ---- Docking Results (predicted) ----
  best_complex_nr: number | null;
  complexes: Complex[];

  // ---- Status & Error Handling ----
  error: string | null;
  progress: number;
  progress_info: string;

  // ---- UI State ----
  thumbnailRefresh?: number;
}
