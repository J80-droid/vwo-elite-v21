/**
 * Biology Utilities and Data
 * Shared constants and helper functions for biological operations.
 */

export const CODON_TABLE: Record<string, string> = {
  ATA: "I",
  ATC: "I",
  ATT: "I",
  ATG: "M",
  ACA: "T",
  ACC: "T",
  ACG: "T",
  ACT: "T",
  AAC: "N",
  AAT: "N",
  AAA: "K",
  AAG: "K",
  AGC: "S",
  AGT: "S",
  AGA: "R",
  AGG: "R",
  CTA: "L",
  CTC: "L",
  CTG: "L",
  CTT: "L",
  CCA: "P",
  CCC: "P",
  CCG: "P",
  CCT: "P",
  CAC: "H",
  CAT: "H",
  CAA: "Q",
  CAG: "Q",
  CGA: "R",
  CGC: "R",
  CGG: "R",
  CGT: "R",
  GTA: "V",
  GTC: "V",
  GTG: "V",
  GTT: "V",
  GCA: "A",
  GCC: "A",
  GCG: "A",
  GCT: "A",
  GAC: "D",
  GAT: "D",
  GAA: "E",
  GAG: "E",
  GGA: "G",
  GGC: "G",
  GGG: "G",
  GGT: "G",
  TCA: "S",
  TCC: "S",
  TCG: "S",
  TCT: "S",
  TTC: "F",
  TTT: "F",
  TTA: "L",
  TTG: "L",
  TAC: "Y",
  TAT: "Y",
  TAA: "_",
  TAG: "_",
  TGC: "C",
  TGT: "C",
  TGA: "_",
  TGG: "W",
};

export const translateDNAtoProtein = (dna: string): string => {
  let protein = "";
  const cleanDNA = dna.toUpperCase().replace(/[^ATCG]/g, "");
  for (let i = 0; i < cleanDNA.length; i += 3) {
    if (i + 3 <= cleanDNA.length) {
      const codon = cleanDNA.substring(i, i + 3);
      protein += CODON_TABLE[codon] || "?";
    }
  }
  return protein;
};

export const transcribeDNAtoRNA = (dna: string): string => {
  return dna.toUpperCase().replace(/T/g, "U");
};

export const calculateTm = (sequence: string): number => {
  const cleanSeq = sequence.toUpperCase().replace(/[^ATCG]/g, "");
  const g = (cleanSeq.match(/G/g) || []).length;
  const c = (cleanSeq.match(/C/g) || []).length;
  const a = (cleanSeq.match(/A/g) || []).length;
  const t = (cleanSeq.match(/T/g) || []).length;

  // Wallace rule for short sequences (<14bp): Tm = 2(A+T) + 4(G+C)
  // Adjusted formula for longer primers: Tm = 64.9 + 41*(G+C-16.4)/(A+T+G+C)
  if (cleanSeq.length < 14) {
    return 2 * (a + t) + 4 * (g + c);
  }
  return 64.9 + (41 * (g + c - 16.4)) / (a + t + g + c);
};

export const getKyteDoolittleScore = (aa: string): number => {
  const scores: Record<string, number> = {
    I: 4.5,
    V: 4.2,
    L: 3.8,
    F: 2.8,
    C: 2.5,
    M: 1.9,
    A: 1.8,
    G: -0.4,
    T: -0.7,
    S: -0.8,
    W: -0.9,
    Y: -1.3,
    P: -1.6,
    H: -3.2,
    E: -3.5,
    Q: -3.5,
    D: -3.5,
    N: -3.5,
    K: -3.9,
    R: -4.5,
    Ile: 4.5,
    Val: 4.2,
    Leu: 3.8,
    Phe: 2.8,
    Cys: 2.5,
    Met: 1.9,
    Ala: 1.8,
    Gly: -0.4,
    Thr: -0.7,
    Ser: -0.8,
    Trp: -0.9,
    Tyr: -1.3,
    Pro: -1.6,
    His: -3.2,
    Glu: -3.5,
    Gln: -3.5,
    Asp: -3.5,
    Asn: -3.5,
    Lys: -3.9,
    Arg: -4.5,
  };
  // Handle 3-letter, 1-letter, or full name inputs if needed (basic mapping above)
  return scores[aa] || 0;
};
