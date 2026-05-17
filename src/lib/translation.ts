
const translations: Record<string, string> = {
  total_score: "Total Score",
  atom_pair_cst: "Atom Pair Cst.",
  atom_attraction: "Atom Attraction",
  electrostatic: "Electrostatic",
  atom_repulsion: "Atom Repulsion",
  solvation: "Solvation",
  hbond: "H-bond",
  delta_g: "Delta G",
  pairwise_energy: "Pairwise Energy",
  rmsd: "RMSD",
};

export function translate(key: string): string {
  return translations[key] || key;
}