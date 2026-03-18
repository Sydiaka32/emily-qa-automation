import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";

export async function createAndValidateStp(
  stpPayload: any,
  senderToken: string,
): Promise<{ validationId: string; createBody: any }> {
  const { response: createResponse, body: createBody } = await postRequest(
    "/api/v1/ct/credit-transfers/stp",
    stpPayload,
    senderToken,
  );

  console.log("STP Creation Response:", JSON.stringify(createBody, null, 2));

  // Validate creation response
  expect(createResponse.status()).toBe(200);
  expect(createBody).toHaveProperty("validation_id");
  expect(createBody.transfer_type).toBe(CreditTransferSubTypes.stp);
  expect(createBody.settlement_type).toBe(SettlementTypes.dns);
  expect(createBody.creditor_amount).toBe(stpPayload.creditor_amount);
  expect(createBody.creditor_currency).toBe(stpPayload.creditor_currency);
  expect(createBody.creditor_xmi).toBe(stpPayload.creditor_xmi);

  const validationId = createBody.validation_id;
  console.log(`STP created successfully with validation ID: ${validationId}`);

  return { validationId, createBody };
}
