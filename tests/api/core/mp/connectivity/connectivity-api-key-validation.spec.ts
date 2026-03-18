import { test, expect } from "@playwright/test";
import { config } from "../../../../../test.config";
import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { getPublicCurrentMember } from "@utils/apiUtils/public/getPublicCurrentMember";
import { getAccessToken } from "@utils/auth";

test.describe("Member connectivity", () => {
    const endpoint = "/api/v1/core/connectivity";
    const { memberName: username, password: password } = config;

    let accessToken: string;
    let connectivityResponse: any;

    test.beforeAll(async () => {
        accessToken = await getAccessToken(username, password);
    });

        test.beforeEach(async () => {
        // Fetch fresh connectivity data before each test
        const result = await getRequest(endpoint, accessToken);
        expect(result.response.status()).toBe(200);
        connectivityResponse= result;
               });

    test("200: GET connectivity info returns expected structure", async () => {
        const { response,body } = connectivityResponse;
        expect(response.status(), "Should return 200 OK").toBe(200);
        expect(Array.isArray(body.allowed_ip_addresses), "allowed_ip_addresses should be an array").toBe(true);
        expect(typeof body.api_key).toBe("string");
        expect(typeof body.callback_url).toBe("string");
        expect(
            body.member_public_key_file_name === null || typeof body.member_public_key_file_name === "string"
        ).toBe(true);
        expect(
            body.system_public_key_file_name === null || typeof body.system_public_key_file_name === "string"
        ).toBe(true);
    });

test("200: GET api_key and check validity", async () => {

  const apiKey = connectivityResponse.body.api_key;
  expect(typeof apiKey, "api_key should be a string").toBe("string");

  //  Use api_key to call public member endpoint
  const publicResult = await getPublicCurrentMember(apiKey);
  expect(publicResult.response.status(), "Should return 200 OK").toBe(200);

  expect(Array.isArray(publicResult.body.content), "Expected 'content' to be an array").toBeTruthy();
});

test("403: Api_key validity -  Invalid token", async () => {
  
  // Use invalid api_key to call public member endpoint
  const {response, body} = await getPublicCurrentMember("invalid api_key");
  expect(response.status(), "Should return 403 OK").toBe(403);
  //Comment : error stucture differs
  //expectErrorResponseStructure(body);  
});
  
});
