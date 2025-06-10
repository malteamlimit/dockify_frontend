export interface Complex {
    violation: string[];
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
    // pose_path: string;
}

export interface DockingJobPreview {
    weight: number,
    hbond_acc: number,
    hbond_don: number,
    logp: number,
    qed: number,
    job_id: string,
    created: string,
    preview_path: string,
    runs: number,
    best_complex: Complex,
}


export interface DockingJob {
    job_id: string,
    name: string,
    created: string,
    constraints: ((number | number[] | string)[] | number)[],
    job_status: "draft" | "running" | "completed" | "failed",
    runs: number,
    smiles: string,
    sdf: string | null,
    error: string | null,
    progress: number,
    progress_info: string,
    weight: number | null,
    hbond_acc: number,
    hbond_don: number,
    logp: number,
    qed: number,
    best_complex_nr: number,
    complexes: Complex[],
    is_sub: boolean
    job?: DockingJob
}