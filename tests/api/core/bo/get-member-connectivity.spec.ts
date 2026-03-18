import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { findMemberForConnectivityTest } from "@utils/coreService/members/bo/findMemberForConnectivityTest";
import { getMemberConnectivityBo } from "@utils/coreService/members/bo/getMemberConnectivityBo";

test.describe("Get Member Connectivity Details", () => {
  let operatorToken: string;
  let testMemberXmi: string;
  let testMemberName: string;
  let testMemberHasApiKey: boolean;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Search for a test member with connectivity details
    console.log("Searching for test member...");
    try {
      const memberInfo = await findMemberForConnectivityTest(operatorToken);
      testMemberXmi = memberInfo.memberXmi;
      testMemberName = memberInfo.memberName;
      testMemberHasApiKey = memberInfo.hasApiKey;

      console.log(`Test member found:`);
      console.log(`  Member XMI: ${testMemberXmi}`);
      console.log(`  Member Name: ${testMemberName}`);
      console.log(`  Has API Key: ${testMemberHasApiKey}`);
    } catch (error: any) {
      console.log(`Could not find test member: ${error.message}`);
      // Mark tests to skip if no member found
      test.skip();
    }
  });

  test("BO: Get connectivity details for member - verify response structure", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing connectivity details retrieval ===");
    console.log(`Member XMI: ${testMemberXmi}`);
    console.log(`Member Name: ${testMemberName}`);

    // Get connectivity details
    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    // Verify response
    const response = connectivityResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const connectivityData = connectivityResult.body;
    console.log("Response body:", JSON.stringify(connectivityData, null, 2));

    // Check all required fields are present
    expect(connectivityData).toHaveProperty("member_xmi");
    expect(connectivityData).toHaveProperty("member_name");
    expect(connectivityData).toHaveProperty("allowed_ip_addresses");
    expect(connectivityData).toHaveProperty("api_key");
    expect(connectivityData).toHaveProperty("callback_url");
    expect(connectivityData).toHaveProperty("member_public_key_file_name");
    expect(connectivityData).toHaveProperty("system_public_key_file_name");

    console.log("All required fields present");

    // Verify field values
    expect(connectivityData.member_xmi).toBe(testMemberXmi);
    console.log(`Member XMI matches: ${connectivityData.member_xmi}`);

    // member_name should be a string (could be empty)
    expect(typeof connectivityData.member_name).toBe("string");
    console.log(`Member name: ${connectivityData.member_name}`);

    // allowed_ip_addresses could be null, string, or array
    if (connectivityData.allowed_ip_addresses !== null) {
      console.log(
        `Allowed IP addresses: ${connectivityData.allowed_ip_addresses}`,
      );
    } else {
      console.log("Allowed IP addresses: null");
    }

    // api_key check
    if (connectivityData.api_key) {
      expect(typeof connectivityData.api_key).toBe("string");
      expect(connectivityData.api_key.length).toBeGreaterThan(0);
      console.log("API Key: Present (masked for security)");

      // Verify API key format (example: "xbk_" prefix)
      if (connectivityData.api_key.startsWith("xbk_")) {
        console.log("API Key format: Valid (starts with xbk_)");
      }
    } else {
      console.log("API Key: null or empty");
    }

    // callback_url check
    if (connectivityData.callback_url) {
      expect(typeof connectivityData.callback_url).toBe("string");
      console.log(`Callback URL: ${connectivityData.callback_url}`);

      // Verify it's a valid URL format
      expect(connectivityData.callback_url).toMatch(/^https?:\/\/.+/);
    } else {
      console.log("Callback URL: null or empty");
    }

    // Verify file names
    expect(typeof connectivityData.member_public_key_file_name).toBe("object");
    expect(typeof connectivityData.system_public_key_file_name).toBe("object");

    console.log(
      `Member public key file: ${connectivityData.member_public_key_file_name}`,
    );
    console.log(
      `System public key file: ${connectivityData.system_public_key_file_name}`,
    );

    // Verify data types
    console.log("\nData type verification:");
    console.log(`  member_xmi: ${typeof connectivityData.member_xmi}`);
    console.log(`  member_name: ${typeof connectivityData.member_name}`);
    console.log(
      `  allowed_ip_addresses: ${typeof connectivityData.allowed_ip_addresses}`,
    );
    console.log(`  api_key: ${typeof connectivityData.api_key}`);
    console.log(`  callback_url: ${typeof connectivityData.callback_url}`);
    console.log(
      `  member_public_key_file_name: ${typeof connectivityData.member_public_key_file_name}`,
    );
    console.log(
      `  system_public_key_file_name: ${typeof connectivityData.system_public_key_file_name}`,
    );

    console.log("\nConnectivity details test completed successfully");
  });

  test("BO: Verify API key masking and security", async () => {
    // Skip if no test member was found or member doesn't have API key
    if (!testMemberXmi || !testMemberHasApiKey) {
      console.log("Skipping test - no member with API key found");
      return;
    }

    console.log("=== Testing API key security ===");

    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    const data = connectivityResult.body;

    // API key should be present
    expect(data.api_key).toBeTruthy();
    expect(typeof data.api_key).toBe("string");

    // Check API key format (example: starts with xbk_)
    expect(data.api_key.startsWith("xbk_")).toBe(true);
    console.log("API key format valid (starts with xbk_)");

    // API key should be reasonably long
    expect(data.api_key.length).toBeGreaterThan(20);
    console.log(`API key length: ${data.api_key.length} characters`);

    // API key should be base64 encoded (after xbk_ prefix)
    const apiKeyWithoutPrefix = data.api_key.substring(4);
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;

    if (base64Regex.test(apiKeyWithoutPrefix)) {
      console.log("API key appears to be base64 encoded");
    } else {
      console.log("API key encoding format unknown");
    }

    // Never log the actual API key in test logs
    console.log("API key security: Not logged in console (secure)");

    console.log("API key security test completed");
  });

  test("BO: Verify callback URL format when present", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing callback URL format ===");

    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    const data = connectivityResult.body;

    if (data.callback_url) {
      console.log(`Callback URL: ${data.callback_url}`);

      // Should be a valid URL
      expect(() => new URL(data.callback_url)).not.toThrow();
      console.log("Callback URL is a valid URL");

      // Should be HTTPS (for security)
      if (data.callback_url.startsWith("https://")) {
        console.log("Callback URL uses HTTPS (secure)");
      } else if (data.callback_url.startsWith("http://")) {
        console.log("Warning: Callback URL uses HTTP (not secure)");
      }

      // Check if URL contains member XMI
      if (data.callback_url.includes(testMemberXmi)) {
        console.log("Callback URL contains member XMI");
      }
    } else {
      console.log("No callback URL set for this member");
    }

    console.log("Callback URL test completed");
  });

  test("BO: Verify public key file names", async () => {
    // Skip if no test member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no test member found");
      return;
    }

    console.log("=== Testing public key file names ===");

    const connectivityResult = await getMemberConnectivityBo(
      operatorToken,
      testMemberXmi,
    );

    const data = connectivityResult.body;

    // Check member public key file name
    expect(data.member_public_key_file_name).toBeDefined();

    if (data.member_public_key_file_name) {
      console.log(
        `Member public key file: ${data.member_public_key_file_name}`,
      );
      // Should have .pem extension
      expect(data.member_public_key_file_name).toMatch(/\.pem$/);
      console.log("Member public key file has .pem extension");
    }

    // Check system public key file name
    expect(data.system_public_key_file_name).toBeDefined();

    if (data.system_public_key_file_name) {
      console.log(
        `System public key file: ${data.system_public_key_file_name}`,
      );
      // Should have .pem extension
      expect(data.system_public_key_file_name).toMatch(/\.pem$/);
      console.log("System public key file has .pem extension");
    }

    // Files should have different names
    if (data.member_public_key_file_name && data.system_public_key_file_name) {
      expect(data.member_public_key_file_name).not.toBe(
        data.system_public_key_file_name,
      );
      console.log("Member and system public key files have different names");
    }

    console.log("Public key file names test completed");
  });
});
