export interface MoleculeData {
  cid: number; // PubChem CID
  name: string;
  molecularFormula: string;
  molecularWeight: string; // string mainly to keep precision or text
  canonicalSmiles: string;
  inchi: string;
  // Properties for grounding
  xlogp?: number; // Lipophilicity
  hBondDonorCount?: number;
  hBondAcceptorCount?: number;
  rotatableBondCount?: number;
  charge?: number;
}

const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

export const searchMolecule = async (
  query: string,
): Promise<MoleculeData | null> => {
  try {
    // 1. Search name to CID
    const cidRes = await fetch(
      `${BASE}/compound/name/${encodeURIComponent(query)}/cids/JSON`,
    );
    if (!cidRes.ok) return null;
    const cidJson = await cidRes.json();
    const cid = cidJson.IdentifierList?.CID[0];
    if (!cid) return null;

    // 2. Get Properties
    const props =
      "MolecularFormula,MolecularWeight,CanonicalSMILES,InChI,XLogP,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Charge";
    const propRes = await fetch(
      `${BASE}/compound/cid/${cid}/property/${props}/JSON`,
    );
    const propJson = await propRes.json();
    const data = propJson.PropertyTable?.Properties[0];

    if (!data) return null;

    return {
      cid: data.CID,
      name: query, // Or use returned title
      molecularFormula: data.MolecularFormula,
      molecularWeight: data.MolecularWeight,
      canonicalSmiles: data.CanonicalSMILES,
      inchi: data.InChI,
      xlogp: data.XLogP,
      hBondDonorCount: data.HBondDonorCount,
      hBondAcceptorCount: data.HBondAcceptorCount,
      rotatableBondCount: data.RotatableBondCount,
      charge: data.Charge,
    };
  } catch (e) {
    console.error("Chem Search Error", e);
    return null;
  }
};

export const get3DStructureUrl = (cid: number): string => {
  // PubChem has a 3D SDF endpoint
  return `${BASE}/compound/cid/${cid}/record/SDF/?record_type=3d`;
};
