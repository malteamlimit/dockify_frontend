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
    pose_path: string;
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
    job?: DockingJobPreview
}


export interface DockingJob {
    job_id: string;
    request: {
      created: string;
      smiles: string;
      constraints: any | null;
      runs: number;
    };
    result: {
      progress: number;
      status: string;
      ligand_properties: {
        weight: number;
        hbond_acc: number;
        hbond_don: number;
        logp: number;
        qed: number;
      } | null;
      complex_results: Complex[];
      best_complex_id: number | null;
      error: string | null;
    };
}