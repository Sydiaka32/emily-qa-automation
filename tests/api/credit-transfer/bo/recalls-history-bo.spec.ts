import { test, expect } from "@playwright/test";
import { getRecallsBo } from "@utils/creditTransferService/recallRequests/bo/getRecallsBo";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";

test.describe("BackOffice - Get Recall Requests List", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get token for an operator who can view all recalls via BO
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BO: Should get paginated list of all recall requests with valid structure", async () => {
    console.log("Testing BO recall requests list retrieval...");

    // Get recalls with default pagination via BO
    const { body } = await getRecallsBo(operatorToken);

    // Verify the response structure matches the expected format
    expect(body.total_pages).toBeGreaterThanOrEqual(0);
    expect(body.total_elements).toBeGreaterThanOrEqual(0);
    expect(body.number).toBe(0); // page number
    expect(body.size).toBe(10); // default size
    expect(typeof body.first).toBe("boolean");
    expect(typeof body.last).toBe("boolean");
    expect(typeof body.has_next).toBe("boolean");
    expect(typeof body.has_previous).toBe("boolean");

    // Verify content array structure
    if (body.content.length > 0) {
      const firstRecall = body.content[0];

      // Check required fields in each recall item
      expect(firstRecall).toHaveProperty("id");
      expect(firstRecall).toHaveProperty("recall_id");
      expect(firstRecall).toHaveProperty("recall_requested_at");
      expect(firstRecall).toHaveProperty("recall_updated_at");
      expect(firstRecall).toHaveProperty("recall_status");
      expect(firstRecall).toHaveProperty("sender");
      expect(firstRecall).toHaveProperty("receiver");
      expect(firstRecall).toHaveProperty("clr_sys_ref");

      // Check nested sender/receiver structure
      expect(firstRecall.sender).toHaveProperty("xmi");
      expect(firstRecall.sender).toHaveProperty("name");
      expect(firstRecall.receiver).toHaveProperty("xmi");
      expect(firstRecall.receiver).toHaveProperty("name");

      console.log(
        `Successfully retrieved ${body.content.length} recall requests via BO`,
      );
      console.log(
        `Sample recall: ${firstRecall.recall_id} (${firstRecall.recall_status})`,
      );
      console.log(
        `Sender: ${firstRecall.sender.xmi} - ${firstRecall.sender.name}`,
      );
      console.log(
        `Receiver: ${firstRecall.receiver.xmi} - ${firstRecall.receiver.name}`,
      );
    } else {
      console.log("No recall requests found in the BO system");
    }
  });

  test("BO: Should handle different pagination parameters", async () => {
    console.log("Testing BO different pagination parameters...");

    // Test with custom page and size
    const { body } = await getRecallsBo(operatorToken, 1, 25);

    // Verify custom pagination parameters
    expect(body.number).toBe(1); // page number
    expect(body.size).toBe(25); // custom size

    console.log(
      `BO: Page ${body.number} with size ${body.size} returned ${body.content.length} items`,
    );
  });
});
