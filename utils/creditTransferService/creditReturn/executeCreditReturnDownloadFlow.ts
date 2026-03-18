import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";


/**
 * Executes the credit return download flow to get credit return details
 */
export async function executeCreditReturnDownloadFlow(
  receiverToken: string,
  creditReturnReferenceId: string,
): Promise<{ targetCreditReturn: any }> {
  console.log("\n=== Executing credit return download flow ===");

  // Get credit return details using the reference ID
  const { response, body } = await getRequest(
    `/api/v1/ct/credit-transfers/${creditReturnReferenceId}`,
    receiverToken,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Failed to get credit return details: ${response.status()}`,
    );
  }

  const targetCreditReturn = body;

  console.log(`Credit return initial status: ${targetCreditReturn.status}`);
  console.log(`Credit return reference ID: ${targetCreditReturn.reference_id}`);

  return {
    targetCreditReturn,
  };
}
