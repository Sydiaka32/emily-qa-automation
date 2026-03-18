import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getSystemConnectivityDataBo } from "@utils/coreService/connectivity/getSystemConnectivityDataBo";
import { searchMemberByXmiBo } from "@utils/coreService/members/bo/searchMemberByXmiBo";

test.describe("BackOffice - Core Admin - System Connectivity", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test("BO: Get API base URL and test receiver data - verify response structure", async () => {
    console.log("=== Testing get system connectivity data ===");

    const result = await getSystemConnectivityDataBo(operatorToken);

    // Verify response
    const response = result.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const responseBody = result.body;
    console.log("Response body:", responseBody);

    // Check required fields exist
    expect(responseBody).toHaveProperty("api_base_url");
    expect(responseBody).toHaveProperty("test_receiver");

    console.log(`API Base URL: ${responseBody.api_base_url}`);
    console.log(`Test Receiver:`, responseBody.test_receiver);

    // Verify API base URL is a valid URL
    expect(typeof responseBody.api_base_url).toBe("string");
    expect(responseBody.api_base_url).toContain("http");
    console.log("API base URL is a valid string with http/https protocol");

    // Verify test receiver structure
    const testReceiver = responseBody.test_receiver;
    expect(testReceiver).toHaveProperty("xmi");
    expect(testReceiver).toHaveProperty("name");

    expect(typeof testReceiver.xmi).toBe("string");
    expect(typeof testReceiver.name).toBe("string");

    console.log(`Test Receiver XMI: ${testReceiver.xmi}`);
    console.log(`Test Receiver Name: ${testReceiver.name}`);

    // Verify test receiver XMI has correct format
    expect(testReceiver.xmi).toMatch(/^X[A-Z0-9]+$/);
    console.log("Test receiver XMI has valid format");

    console.log("\nGet system connectivity data test completed successfully");
  });

  test("BO: Verify test receiver exists in members list", async () => {
    console.log(
      "=== Testing verification of test receiver in members list ===",
    );

    // First, get the system connectivity data to get test receiver info
    const connectivityResult = await getSystemConnectivityDataBo(operatorToken);
    expect(connectivityResult.response.status()).toBe(200);

    const testReceiver = connectivityResult.body.test_receiver;
    const testReceiverXmi = testReceiver.xmi;
    const testReceiverName = testReceiver.name;

    console.log(`Test Receiver from connectivity data:`);
    console.log(`  XMI: ${testReceiverXmi}`);
    console.log(`  Name: ${testReceiverName}`);

    // Now search for the member by XMI
    console.log(`\nSearching for member with XMI: ${testReceiverXmi}...`);
    const searchResult = await searchMemberByXmiBo(
      operatorToken,
      testReceiverXmi,
    );

    // Verify the search was successful
    expect(searchResult.response.status()).toBe(200);
    console.log("Search request successful");

    // Verify the response structure
    const searchBody = searchResult.body;
    console.log("Search response body:", searchBody);

    // Check that the response has the expected structure
    expect(searchBody).toHaveProperty("content");
    expect(Array.isArray(searchBody.content)).toBe(true);
    console.log(`Found ${searchBody.content.length} result(s) in search`);

    // Since we're searching by XMI, we should get exactly one result
    expect(searchBody.content.length).toBe(1);
    console.log(
      "Exactly one member found (as expected when searching by unique XMI)",
    );

    // Get the found member
    const foundMember = searchBody.content[0];

    // Verify the XMI matches
    expect(foundMember.xmi).toBe(testReceiverXmi);
    console.log(`XMI matches: ${foundMember.xmi}`);

    // Verify the name matches
    expect(foundMember.name).toBe(testReceiverName);
    console.log(`Name matches: ${foundMember.name}`);

    // Verify the member is active
    expect(foundMember.status).toBe("active");
    console.log(`Member is active`);

    console.log("\nTest receiver verification completed successfully");
  });
});
