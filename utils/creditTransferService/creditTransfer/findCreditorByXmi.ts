/**
 * Find creditor by XMI
 */
export function findCreditorByXmi(creditors: any[], targetXmi: string): any {
  const creditor = creditors.find((creditor) => creditor.xmi === targetXmi);

  if (!creditor) {
    throw new Error(
      `Creditor with XMI ${targetXmi} not found in creditors list`,
    );
  }

  console.log(`Found creditor: ${creditor.xmi} - ${creditor.name}`);
  return creditor;
}
