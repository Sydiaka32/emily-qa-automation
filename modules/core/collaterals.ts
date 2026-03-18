export interface CollateralDocument {
  // Define if there are specific fields, otherwise leave as empty object
  // Based on the example, it's an empty array
}

export interface Collateral {
  id: string;
  name: string;
  description: string;
  member_xmi: string;
  currency: string;
  amount: number;
  contribution_percent: number;
  documents: CollateralDocument[];
}
