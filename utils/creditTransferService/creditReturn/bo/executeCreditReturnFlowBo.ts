import { CreditReturnFlowResult } from "../../../../modules/creditTransfer/creditReturnFlowResult";
import { findCreditReturnByTxId } from "@utils/creditTransferService/creditReturn/findCreditReturnByTxId";
import { verifyCreditReturnBasicDetails } from "@utils/creditTransferService/creditReturn/verifyCreditReturnDetailsByStatus";
import { initiateCreditReturnBo } from "@utils/creditTransferService/creditReturn/bo/initiateCreditReturnBo";

/**
 * Executes the complete credit return flow including initiation and verification
 */
export async function executeCreditReturnFlowBo(
  creditTransferReferenceId: string,
  receiverToken: string,
  originalTxId: string,
  completedCT: any,
  operatorToken: string,
  reasonCode: string = "AM03",
  reasonInfo: string = "Not Allowed Currency",
): Promise<CreditReturnFlowResult> {
  console.log("\n=== Executing credit return flow ===");

  // Step 1: Initiate credit return
  console.log(`Initiating credit return for CT: ${creditTransferReferenceId}`);
  const creditReturnPayload = {
    reason_code: reasonCode,
    reason_info: reasonInfo,
  };

  console.log(
    "Credit return payload:",
    JSON.stringify(creditReturnPayload, null, 2),
  );

  const creditReturnResponse = await initiateCreditReturnBo(
    creditTransferReferenceId,
    operatorToken,
    reasonCode,
    reasonInfo,
  );

  // Step 2: Find and verify credit return
  console.log("\n=== Finding and verifying credit return ===");
  const creditReturn = await findCreditReturnByTxId(
    originalTxId,
    receiverToken,
  );

  // Step 3: Verify basic details first (without status check)
  console.log("\n=== Verifying credit return basic details ===");
  verifyCreditReturnBasicDetails(creditReturn, completedCT);

  return {
    creditReturnResponse,
    creditReturn,
    creditReturnPayload,
  };
}
