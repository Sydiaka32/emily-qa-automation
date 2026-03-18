import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";

export async function createAndValidateCct(
  cctPayload: any,
  senderToken: string,
): Promise<{ validationId: string; createBody: any }> {
  const { response: createResponse, body: createBody } = await postRequest(
    "/api/v1/ct/credit-transfers/cct", // CCT endpoint
    cctPayload,
    senderToken,
  );

  console.log("CCT Creation Response:", JSON.stringify(createBody, null, 2));

  // Validate creation response
  expect(createResponse.status()).toBe(200);
  expect(createBody).toHaveProperty("validation_id");
  expect(createBody.transfer_type).toBe(CreditTransferSubTypes.cct);
  expect(createBody.settlement_type).toBe(SettlementTypes.dns);
  expect(createBody.creditor_amount).toBe(cctPayload.creditor_amount);
  expect(createBody.creditor_currency).toBe(cctPayload.creditor_currency);
  expect(createBody.creditor_xmi).toBe(cctPayload.creditor_xmi);

  const validationId = createBody.validation_id;
  console.log(`CCT created successfully with validation ID: ${validationId}`);

  return { validationId, createBody };
}
