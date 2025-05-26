
const translations: Record<string, string> = {
  DELTA_G: "The Delta G value is greater than 0",
  ATOM_PAIR_CST: "The Atom Pair Constraint value is higher than 15",

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