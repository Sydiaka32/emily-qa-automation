import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { findMemberForConnectivityTest } from "@utils/coreService/members/bo/findMemberForConnectivityTest";
import { getMemberConnectivityBo } from "@utils/coreService/members/bo/getMemberConnectivityBo";
import { generateMemberApiKeyBo } from "@utils/coreService/members/bo/generateMemberApiKeyBo";

test.describe("Generate API Key", () => {
  let operatorToken: string;
  let testMemberXmi: string;
  let testMemberName: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Search for a test member
    console.log("Searching for test member...");
    try {
      const memberInfo = await findMemberForConnectivityTest(operatorToken);
      testMemberXmi = memberInfo.memberXmi;
      testMemberName = memberInfo.memberName;

      console.log(`Test member found:`);
      console.log(`  Member XMI: ${testMemberXmi}`);
      console.log(`  Member Name: ${testMemberName}`);
    } catch (error: any) {
      console.log(`Could not find test member: ${error.message}`);
      // Mark tests to skip if no member found
      test.skip();
    }
  });

  test("BO: Generate API key for member - verify response structure", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing API key generation ===");
    console.log(`Member XMI: ${testMemberXmi}`);
    console.log(`Member Name: ${testMemberName}`);

    // Get current API key (if any) before generation
    console.log("\nGetting current connectivity details...");
    let originalApiKey: string | null = null;
    try {
      const currentConnectivity = await getMemberConnectivityBo(
        operatorToken,
        testMemberXmi,
      );

      if (currentConnectivity.response.status() === 200) {
        originalApiKey = currentConnectivity.body.api_key;
        console.log(`Current API key exists: ${originalApiKey ? "Yes" : "No"}`);
      }
    } catch (error: any) {
      console.log(`Could not get current connectivity: ${error.message}`);
    }

    // Generate new API key
    console.log("\nGenerating new API key...");
    const generateResult = await generateMemberApiKeyBo(
      operatorToken,
      testMemberXmi,
    );

    // Verify response
    const response = generateResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const generateData = generateResult.body;
    console.log("Response body:", JSON.stringify(generateData, null, 2));

    // Check all required fields are present
    expect(generateData).toHaveProperty("member_xmi");
    expect(generateData).toHaveProperty("member_name");
    expect(generateData).toHaveProperty("allowed_ip_addresses");
    expect(generateData).toHaveProperty("api_key");
    expect(generateData).toHaveProperty("callback_url");
    expect(generateData).toHaveProperty("member_public_key_file_name");
    expect(generateData).toHaveProperty("system_public_key_file_name");

    console.log("All required fields present");

    // Verify field values
    expect(generateData.member_xmi).toBe(testMemberXmi);
    console.log(`Member XMI matches: ${generateData.member_xmi}`);

    // member_name should be a string
    expect(typeof generateData.member_name).toBe("string");
    console.log(`Member name: ${generateData.member_name}`);

    // api_key should be present and valid
    expect(generateData.api_key).toBeTruthy();
    expect(typeof generateData.api_key).toBe("string");
    expect(generateData.api_key.length).toBeGreaterThan(0);

    // Check API key format (starts with xbk_)
    expect(generateData.api_key.startsWith("xbk_")).toBe(true);
    console.log("API Key generated with correct format (starts with xbk_)");

    // Mask API key in logs for security
    const maskedApiKey = generateData.api_key.substring(0, 10) + "...";
    console.log(`Generated API key (masked): ${maskedApiKey}`);

    // Verify it's a new API key (different from original if there was one)
    if (originalApiKey) {
      expect(generateData.api_key).not.toBe(originalApiKey);
      console.log("API key is different from previous one");
    }

    // callback_url should be present (might be null)
    if (generateData.callback_url) {
      expect(typeof generateData.callback_url).toBe("string");
      console.log(`Callback URL: ${generateData.callback_url}`);
    } else {
      console.log("Callback URL: null");
    }

    console.log(
      `Member public key file: ${generateData.member_public_key_file_name}`,
    );
    console.log(
      `System public key file: ${generateData.system_public_key_file_name}`,
    );

    // Verify data types
    console.log("\nData type verification:");
    console.log(`  member_xmi: ${typeof generateData.member_xmi}`);
    console.log(`  member_name: ${typeof generateData.member_name}`);
    console.log(
      `  allowed_ip_addresses: ${typeof generateData.allowed_ip_addresses}`,
    );
    console.log(`  api_key: ${typeof generateData.api_key}`);
    console.log(`  callback_url: ${typeof generateData.callback_url}`);
    console.log(
      `  member_public_key_file_name: ${typeof generateData.member_public_key_file_name}`,
    );
    console.log(
      `  system_public_key_file_name: ${typeof generateData.system_public_key_file_name}`,
    );

    console.log("\nAPI key generation test completed successfully");
  });

  test("BO: Verify API key is actually updated in the system", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Verifying API key is updated in system ===");
    console.log(`Member XMI: ${testMemberXmi}`);

    // First, generate a new API key
    console.log("\n1. Generating new API key...");
    const generateResult = await generateMemberApiKeyBo(
      operatorToken,
      testMemberXmi,
    );

    expect(generateResult.response.status()).toBe(200);
    const generatedApiKey = generateResult.body.api_key;
    console.log("API key generated successfully");

    // Then, fetch the current connectivity to verify
    console.log("\n2. Fetching current connectivity details...");
    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    expect(connectivityResult.response.status()).toBe(200);
    const currentApiKey = connectivityResult.body.api_key;

    // Verify the API keys match
    expect(currentApiKey).toBe(generatedApiKey);
    console.log("Verified: Generated API key matches current system API key");

    // Verify other details match
    expect(connectivityResult.body.member_xmi).toBe(testMemberXmi);
    expect(connectivityResult.body.member_name).toBe(
      generateResult.body.member_name,
    );
    console.log("Other connectivity details verified");

    console.log("\nAPI key update verification completed");
  });

  test("BO: Generate API key multiple times", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing multiple API key generations ===");
    console.log(`Member XMI: ${testMemberXmi}`);

    const generations = 3;
    const generatedKeys: string[] = [];

    console.log(`\nGenerating ${generations} API keys sequentially...`);

    for (let i = 0; i < generations; i++) {
      console.log(`\nGeneration ${i + 1}/${generations}...`);

      const generateResult = await generateMemberApiKeyBo(
        operatorToken,
        testMemberXmi,
      );

      expect(generateResult.response.status()).toBe(200);

      const apiKey = generateResult.body.api_key;
      generatedKeys.push(apiKey);

      // Verify API key format
      expect(apiKey).toMatch(/^xbk_.+/);
      console.log(`  Status: 200 OK`);
      console.log(`  API key format valid`);

      // Wait a moment between generations if needed
      if (i < generations - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Verify all generated keys are different
    console.log("\nVerifying all generated keys are unique...");
    const uniqueKeys = new Set(generatedKeys);
    expect(uniqueKeys.size).toBe(generatedKeys.length);
    console.log(`All ${generatedKeys.length} generated keys are unique`);

    // Verify the last key is the current one in the system
    console.log("\nVerifying last generated key is current...");
    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    const currentApiKey = connectivityResult.body.api_key;
    expect(currentApiKey).toBe(generatedKeys[generations - 1]);
    console.log("Last generated API key is current in the system");

    console.log("\nMultiple API key generations test completed");
  });
});
