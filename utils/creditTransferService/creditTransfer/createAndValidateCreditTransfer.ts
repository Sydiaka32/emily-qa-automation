import { expect } from "@playwright/test";
import { createCreditTransfer } from "./createCreditTransfer";
import { createCTPayload } from "./createCreditTransferPayload";

/**
 * Create and validate credit transfer (combined function)
 */
export async function createAndValidateCreditTransfer(options: {
  creditorXmi: string;
  creditorCurrency: string;
  creditorAmount: number;
  settlementType: "DNS" | "RTGS";
  debtorXmi: string;
  token: string;
  debtorName?: string;
  creditorName?: string;
  remittanceInformation?: string;
}): Promise<{ validationId: string; responseBody: any }> {
  // Create payload
  const ctPayload = createCTPayload(options);

  console.log("Creating credit transfer with payload:");
  console.log(JSON.stringify(ctPayload, null, 2));

  // Create credit transfer
  const result = await createCreditTransfer(ctPayload, options.token);

  console.log("Response credit transfer with payload:");
  console.log(JSON.stringify(result, null, 2));

  // Validate response
  expect(result.body.creditor_xmi).toBe(options.creditorXmi);
  expect(result.body.creditor_currency).toBe(options.creditorCurrency);
  expect(result.body.creditor_amount).toBe(options.creditorAmount);
  expect(result.body.settlement_type).toBe(options.settlementType);
  expect(result.body.transfer_type).toBe("cct");

  console.log("Credit transfer validation passed");

  return {
    validationId: result.validationId,
    responseBody: result.body,
  };
}
