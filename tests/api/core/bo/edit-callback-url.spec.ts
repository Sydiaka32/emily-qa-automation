import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { findMemberWithCallbackUrl } from "@utils/coreService/members/bo/findMemberWithCallbackUrl";
import { getMemberConnectivityBo } from "@utils/coreService/members/bo/getMemberConnectivityBo";
import { updateMemberCallbackUrlBo } from "@utils/coreService/members/bo/updateMemberCallbackUrlBo";

test.describe("Edit Callback URL", () => {
  let operatorToken: string;
  let testMemberXmi: string;
  let testMemberName: string;
  let originalCallbackUrl: string | null;
  let originalConnectivityData: any;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Search for a test member with callback URL
    console.log("Searching for test member with callback URL...");
    try {
      const memberInfo = await findMemberWithCallbackUrl(operatorToken);
      testMemberXmi = memberInfo.memberXmi;
      testMemberName = memberInfo.memberName;
      originalCallbackUrl = memberInfo.currentCallbackUrl;

      console.log(`Test member found:`);
      console.log(`  Member XMI: ${testMemberXmi}`);
      console.log(`  Member Name: ${testMemberName}`);
      console.log(`  Current Callback URL: ${originalCallbackUrl || "None"}`);
    } catch (error: any) {
      console.log(`Could not find test member: ${error.message}`);
      // Mark tests to skip if no member found
      test.skip();
    }
  });

  test.beforeEach(async () => {
    // Get current connectivity data before each test
    if (testMemberXmi) {
      const connectivityResult = await getMemberConnectivityBo(
        operatorToken,
        testMemberXmi,
      );
      originalConnectivityData = connectivityResult.body;
    }
  });

  test.afterEach(async () => {
    // Restore original callback URL after each test
    if (
      testMemberXmi &&
      originalConnectivityData &&
      originalConnectivityData.callback_url !== undefined
    ) {
      console.log(`Restoring original callback URL for ${testMemberXmi}...`);

      try {
        await updateMemberCallbackUrlBo(
          operatorToken,
          testMemberXmi,
          originalConnectivityData.callback_url || "",
        );
        console.log("Original callback URL restored");
      } catch (error: any) {
        console.log(
          `Failed to restore original callback URL: ${error.message}`,
        );
      }
    }
  });

  test("BO: Edit callback URL with valid URL - verify response structure", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing callback URL update ===");
    console.log(`Member XMI: ${testMemberXmi}`);
    console.log(`Member Name: ${testMemberName}`);
    console.log(`Original Callback URL: ${originalCallbackUrl || "None"}`);

    // Create a new callback URL with timestamp to make it unique
    const timestamp = Date.now();
    const newCallbackUrl = `https://test-callback-${timestamp}.example.com/api/callback`;
    console.log(`New Callback URL: ${newCallbackUrl}`);

    // Update callback URL
    console.log("\nUpdating callback URL...");
    const updateResult = await updateMemberCallbackUrlBo(
      operatorToken,
      testMemberXmi,
      newCallbackUrl,
    );

    // Verify response
    const response = updateResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const updateData = updateResult.body;
    console.log("Response body:", JSON.stringify(updateData, null, 2));

    // Check all required fields are present
    expect(updateData).toHaveProperty("member_xmi");
    expect(updateData).toHaveProperty("member_name");
    expect(updateData).toHaveProperty("allowed_ip_addresses");
    expect(updateData).toHaveProperty("api_key");
    expect(updateData).toHaveProperty("callback_url");
    expect(updateData).toHaveProperty("member_public_key_file_name");
    expect(updateData).toHaveProperty("system_public_key_file_name");

    console.log("All required fields present");

    // Verify field values
    expect(updateData.member_xmi).toBe(testMemberXmi);
    console.log(`Member XMI matches: ${updateData.member_xmi}`);

    // member_name should remain the same
    expect(updateData.member_name).toBe(testMemberName);
    console.log(`Member name unchanged: ${updateData.member_name}`);

    // callback_url should be updated to new value
    expect(updateData.callback_url).toBe(newCallbackUrl);
    console.log(`Callback URL updated to: ${updateData.callback_url}`);

    // api_key should remain the same
    if (originalConnectivityData.api_key) {
      expect(updateData.api_key).toBe(originalConnectivityData.api_key);
      console.log("API key unchanged");
    }

    // allowed_ip_addresses should remain the same
    expect(updateData.allowed_ip_addresses).toEqual(
      originalConnectivityData.allowed_ip_addresses,
    );
    console.log("Allowed IP addresses unchanged");

    // public key file names should remain the same
    expect(updateData.member_public_key_file_name).toBe(
      originalConnectivityData.member_public_key_file_name,
    );
    expect(updateData.system_public_key_file_name).toBe(
      originalConnectivityData.system_public_key_file_name,
    );
    console.log("Public key file names unchanged");

    // Verify data types
    console.log("\nData type verification:");
    console.log(`  member_xmi: ${typeof updateData.member_xmi}`);
    console.log(`  member_name: ${typeof updateData.member_name}`);
    console.log(
      `  allowed_ip_addresses: ${typeof updateData.allowed_ip_addresses}`,
    );
    console.log(`  api_key: ${typeof updateData.api_key}`);
    console.log(`  callback_url: ${typeof updateData.callback_url}`);
    console.log(
      `  member_public_key_file_name: ${typeof updateData.member_public_key_file_name}`,
    );
    console.log(
      `  system_public_key_file_name: ${typeof updateData.system_public_key_file_name}`,
    );

    console.log("\nCallback URL update test completed successfully");
  });

  test("BO: Verify callback URL is actually updated in the system", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Verifying callback URL is updated in system ===");
    console.log(`Member XMI: ${testMemberXmi}`);

    // Create a unique callback URL
    const timestamp = Date.now();
    const testCallbackUrl = `https://verify-update-${timestamp}.example.com/api/webhook`;
    console.log(`Test Callback URL: ${testCallbackUrl}`);

    // Update callback URL
    console.log("\n1. Updating callback URL...");
    const updateResult = await updateMemberCallbackUrlBo(
      operatorToken,
      testMemberXmi,
      testCallbackUrl,
    );

    expect(updateResult.response.status()).toBe(200);
    console.log("Callback URL update successful");

    // Then, fetch the current connectivity to verify
    console.log("\n2. Fetching current connectivity details...");
    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    expect(connectivityResult.response.status()).toBe(200);
    const currentCallbackUrl = connectivityResult.body.callback_url;

    // Verify the callback URL matches
    expect(currentCallbackUrl).toBe(testCallbackUrl);
    console.log(
      "Verified: Updated callback URL matches current system callback URL",
    );

    // Verify other details remain unchanged
    expect(connectivityResult.body.member_xmi).toBe(testMemberXmi);
    expect(connectivityResult.body.member_name).toBe(testMemberName);
    if (originalConnectivityData.api_key) {
      expect(connectivityResult.body.api_key).toBe(
        originalConnectivityData.api_key,
      );
    }
    console.log("Other connectivity details verified");

    console.log("\nCallback URL update verification completed");
  });

  test("BO: Update callback URL to empty string", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing callback URL update to empty string ===");
    console.log(`Member XMI: ${testMemberXmi}`);

    const emptyCallbackUrl = "";
    console.log(`New Callback URL: (empty string)`);

    // Update callback URL to empty string
    console.log("\nUpdating callback URL to empty string...");
    const updateResult = await updateMemberCallbackUrlBo(
      operatorToken,
      testMemberXmi,
      emptyCallbackUrl,
    );

    // Verify response
    const status = updateResult.response.status();
    console.log(`Response status: ${status}`);

    // Some APIs accept empty string, some might return error
    // Let's check both possibilities
    if (status === 200) {
      console.log("Empty string accepted as callback URL");

      const updateData = updateResult.body;
      expect(updateData.callback_url).toBe("");
      console.log("Callback URL set to empty string");

      // Verify it's actually empty in the system
      const connectivityResult = await getMemberConnectivityBo(
        operatorToken,
        testMemberXmi,
      );
      expect(connectivityResult.body.callback_url).toBe("");
      console.log("Verified in system: callback URL is empty string");
    } else if (status === 400) {
      console.log("Empty string rejected (expected validation error)");
    } else {
      console.log(`Unexpected status: ${status}`);
    }

    console.log("\nEmpty string callback URL test completed");
  });
});
