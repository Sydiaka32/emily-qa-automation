import { test, expect } from "@playwright/test";
import { config } from "../../../../../test.config";
import { getAccessToken } from "@utils/auth";
import {
  generateInvalidUserData,
  generateUserData,
} from "../../../../../data/generators";
import { getRequest, putRequest } from "@utils/apiUtils";
import { expectErrorResponseStructure } from "@utils/general/expectErrorResponseStructure";
import { verifyUserContentStructure } from "@utils/coreService/users/verifyUserContentStructure";
import { getUserIdFromJwt } from "@utils/coreService/users/getUserIdFromJwt";

test.describe("User profile - Update and restore user", () => {
  const update_user_url = "/api/v1/core/users";
  const { memberName: username, password, apiBaseUrl } = config;

  let accessToken: string;
  let originalUserData: any;
  let get_user_url: string;

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
    const userId = getUserIdFromJwt(accessToken);
    console.log("User ID from JWT:", userId);
    get_user_url = `/api/v1/core/users/${userId}`;
  });

  test.beforeEach(async () => {
    const { response, body } = await getRequest(get_user_url, accessToken);
    expect(response.status(), "Should fetch current user").toBe(200);

    // Save original user data
    originalUserData = {
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    };
  });

  test.afterEach(async () => {
    if (!originalUserData) return;

    try {
      const { response: restoreResponse } = await putRequest(
        update_user_url,
        accessToken,
        apiBaseUrl,
        originalUserData
      );
      expect(restoreResponse.status(), "Restore should succeed").toBe(200);
      console.log("User data restored successfully");
    } catch (error) {
      console.log(" Failed to restore user data:", error);
    }
  });

  // Tests must run sequentially because they modify shared state (callback URL)
  // and depend on clean setup/teardown between tests
  test.describe.configure({ mode: "serial" });

  test("200: PUT /users - should update user ", async () => {
    const newUserData = generateUserData();

    const { response, body } = await putRequest(
      update_user_url,
      accessToken,
      apiBaseUrl,
      newUserData
    );
    expect(response.status(), "Expected 200 OK").toBe(200);

    // Wrap response in expected structure for validator
    const wrappedBody = {
      content: [body],
    };

    verifyUserContentStructure(wrappedBody);
  });

  test("400: PUT /users - empty first name", async () => {
    const payload = {
      ...generateUserData(),
      ...generateInvalidUserData.emptyFirstName(),
    };

    const { response, body } = await putRequest(
      update_user_url,
      accessToken,
      apiBaseUrl,
      payload
    );
    expect(response.status(), "Should return 400 for empty first name").toBe(
      400,
    );

    expectErrorResponseStructure(body);
    expect(Array.isArray(body.fieldErrors)).toBe(true);
  });

  // Empty last name
  test("400: PUT /users - empty last name", async () => {
    const payload = {
      ...generateUserData(),
      ...generateInvalidUserData.emptyLastName(),
    };

    const { response, body } = await putRequest(
      update_user_url,
      accessToken,
      apiBaseUrl,
      payload
    );
    expect(response.status(), "Should return 400 for empty last name").toBe(
      400,
    );
    expectErrorResponseStructure(body);
    expect(Array.isArray(body.fieldErrors)).toBe(true);
  });

  //  Invalid phone number
  test("400: PUT /users - invalid phone number", async () => {
    const payload = {
      ...generateUserData(),
      ...generateInvalidUserData.invalidPhone(),
    };

    const { response, body } = await putRequest(
      update_user_url,
      accessToken,
      apiBaseUrl,
      payload
    );
    expect(
      response.status(),
      "Should return 400 for invalid phone number",
    ).toBe(400);

    expectErrorResponseStructure(body);
    expect(Array.isArray(body.fieldErrors)).toBe(true);
  });
});
