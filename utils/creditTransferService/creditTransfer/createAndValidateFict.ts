import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";

export async function createAndValidateFict(
  fictPayload: any,
  senderToken: string,
): Promise<{ validationId: string; createBody: any }> {
  const { response: createResponse, body: createBody } = await postRequest(
    "/api/v1/ct/credit-transfers/fict",
    fictPayload,
    senderToken,
  );

  console.log("FICT Creation Response:", JSON.stringify(createBody, null, 2));

  // Validate creation response
  expect(createResponse.status()).toBe(200);
  expect(createBody).toHaveProperty("validation_id");
  expect(createBody.transfer_type).toBe(CreditTransferSubTypes.fict);
  expect(createBody.settlement_type).toBe(SettlementTypes.dns);
  expect(createBody.creditor_amount).toBe(fictPayload.creditor_amount);
  expect(createBody.creditor_currency).toBe(fictPayload.creditor_currency);
  expect(createBody.creditor_xmi).toBe(fictPayload.creditor_xmi);

  const validationId = createBody.validation_id;
  console.log(`FICT created successfully with validation ID: ${validationId}`);

  return { validationId, createBody };
}
