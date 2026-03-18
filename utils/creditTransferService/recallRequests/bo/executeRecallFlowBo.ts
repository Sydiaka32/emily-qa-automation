import { expect } from "@playwright/test";
import { getRequest } from "@utils/apiUtils";
import { RecallFlowResult } from "../../../../modules/creditTransfer/recallFlowResult";
import { config } from "../../../../test.config";
import { initiateRecallBo } from "@utils/creditTransferService/recallRequests/bo/initiateRecallBo";

/**
 * Executes the complete recall flow including initiation and list verification
 */
export async function executeRecallFlowBo(
  creditTransferReferenceId: string,
  operatorToken: string,
  reasonCode: string = "DUPL",
  reasonInfo: string = "Duplicate Payment",
): Promise<RecallFlowResult> {
  console.log("\n=== Executing recall flow ===");

  // Step 1: Initiate recall request
  console.log(`Initiating recall for CT: ${creditTransferReferenceId}`);
  const recallPayload = {
    reason_code: reasonCode,
    reason_info: reasonInfo,
  };

  console.log("Recall payload:", JSON.stringify(recallPayload, null, 2));

  const recallResponse = await initiateRecallBo(
    creditTransferReferenceId,
    operatorToken,
    reasonCode,
    reasonInfo,
  );

  console.log(recallResponse.response);
  // Verify recall response
  expect(recallResponse.response.status()).toBe(200);
  console.log("Recall request initiated successfully - Status 200");

  // Step 2: Verify recall appears in recalls list
  console.log("\n=== Verifying recall in recalls list ===");

  // Wait a moment for the recall to be processed
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const recallsResponse = await getRequest(
    `/api/v1/ct-admin/recalls?page=0&size=10`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  expect(recallsResponse.response.status()).toBe(200);
  console.log("Recalls list retrieved successfully");

  const recallsData = recallsResponse.body;
  console.log("Recalls list response:", JSON.stringify(recallsData, null, 2));

  // Verify recalls list structure
  expect(recallsData).toHaveProperty("total_pages");
  expect(recallsData).toHaveProperty("total_elements");
  expect(recallsData).toHaveProperty("content");
  expect(Array.isArray(recallsData.content)).toBe(true);

  // Find our recall by clr_sys_ref (which is the CT reference_id)
  const ourRecall = recallsData.content.find(
    (recall: any) => recall.clr_sys_ref === creditTransferReferenceId,
  );

  expect(ourRecall).toBeDefined();
  console.log("Recall found in list with matching clr_sys_ref");

  return {
    recallResponse,
    recallPayload,
    recallsListResponse: recallsResponse,
    ourRecall,
  };
}
