import generated from "./models.generated.json";

export type ModelEntry = (typeof generated)[number] & { blurb: string };

// Text shown beside the 3D viewer; geometry stats come from scripts/prepare-models.mjs.
const blurbs: Record<string, string> = {
  medbox: "A medicine box with compartments, a latch and a fold-down carry handle, split across five print plates.",
  "z-ring": "A ring body with a separately printed crystal that sits in it.",
  "tissue-box": "A ribbed tissue box printed as a base and a lid.",
  "cat-clicker": "A cat-shaped clicker, with the eyes and ears printed as separate parts.",
};

export const models: ModelEntry[] = generated.map((m) => ({ ...m, blurb: blurbs[m.slug] ?? "" }));
