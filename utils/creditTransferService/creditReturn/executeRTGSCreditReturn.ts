import { expect } from "@playwright/test";
import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";
import { getRequest, postRequest } from "@utils/apiUtils";

export async function executeRTGSCreditReturnFlow(
  creditTransferReferenceId: string,
  receiverToken: string,
  originalTxId: string,
): Promise<{ creditReturnResponse: any; creditReturn: any }> {
  console.log("\n=== Executing credit return flow for RTGS CT ===");

  // Step 1: Initiate credit return
  console.log(
    `Initiating credit return for RTGS CT: ${creditTransferReferenceId}`,
  );

  const creditReturnPayload = {
    reason_code: "AM03",
    reason_info: "Not Allowed Currency",
  };

  console.log(
    "Credit return payload:",
    JSON.stringify(creditReturnPayload, null, 2),
  );

  const { response, body } = await postRequest(
    `/api/v1/ct/credit-transfers/${creditTransferReferenceId}/return`,
    creditReturnPayload,
    receiverToken,
  );

  // Verify credit return response
  const status = response.status();
  expect(status).toBe(200);
  console.log(
    `Credit return initiated successfully for CT: ${creditTransferReferenceId}`,
  );

  // Step 2: Find the created credit return in the list
  console.log("\n=== Finding credit return ===");
  console.log(`Looking for credit return with tx_id: ${originalTxId}`);

  // Wait a moment for the credit return to be created
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const creditTransfersResponse = await getRequest(
    `/api/v1/ct/credit-transfers?page=0&size=50`,
    receiverToken,
  );

  expect(creditTransfersResponse.response.status()).toBe(200);

  const creditTransfersData = creditTransfersResponse.body;

  // Find credit return by tx_id (which should match the original CT's tx_id)
  const creditReturn = creditTransfersData.content.find(
    (ct: any) =>
      ct.tx_id === originalTxId && ct.type === CreditTransferTypes.creditReturn,
  );

  expect(creditReturn).toBeDefined();
  console.log(
    `Credit return found with reference ID: ${creditReturn.reference_id}`,
  );
  console.log(`Credit return initial status: ${creditReturn.status}`);

  // Add initial status logging similar to credit transfer
  console.log(
    `Waiting for credit return ${creditReturn.reference_id} to be processed...`,
  );
  console.log(`   - Initial status: ${creditReturn.status}`);
  console.log(`   - Updated at: ${creditReturn.updated_at}`);

  return {
    creditReturnResponse: { status, response, body }, // Return the status properly
    creditReturn,
  };
}
