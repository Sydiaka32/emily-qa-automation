import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";

export async function createAndValidateRtgsStp(
  stpRtgsPayload: any,
  senderToken: string,
): Promise<{ validationId: string; createBody: any }> {
  const { response: createResponse, body: createBody } = await postRequest(
    "/api/v1/ct/credit-transfers/stp",
    stpRtgsPayload,
    senderToken,
  );

  console.log(
    "STP RTGS Creation Response:",
    JSON.stringify(createBody, null, 2),
  );

  // Validate creation response
  expect(createResponse.status()).toBe(200);
  expect(createBody).toHaveProperty("validation_id");
  expect(createBody.transfer_type).toBe(CreditTransferSubTypes.stp);
  expect(createBody.settlement_type).toBe(SettlementTypes.rtgs);
  expect(createBody.creditor_amount).toBe(stpRtgsPayload.creditor_amount);
  expect(createBody.creditor_currency).toBe(stpRtgsPayload.creditor_currency);
  expect(createBody.creditor_xmi).toBe(stpRtgsPayload.creditor_xmi);

  const validationId = createBody.validation_id;
  console.log(
    `STP RTGS created successfully with validation ID: ${validationId}`,
  );

  return { validationId, createBody };
}
