import { test, expect, APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { config } from "../../../../../test.config";
import { getAccessToken } from "@utils/auth";
import { verifyUserContentStructure } from "@utils/coreService/users/verifyUserContentStructure";
import { deleteUserInKeycloack } from "@utils/coreService/users/deleteUserInKeycloack";
import { verifyUserDeleted } from "@utils/coreService/users/verifyUserDeleted";
import { createTestUser } from "@utils/coreService/users/createTestUser";


test.describe("User management - Create user", () => {
  const endpoint = "/api/v1/core/users";
  const { memberName: username, password } = config;

  let accessToken: string;

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
  });

  test("200: POST /users - should create user successfully", async () => {
   const { id: createdUserId, body } = await createTestUser(accessToken);

    // Validate response structure
    // Wrap response in expected structure for validator
    verifyUserContentStructure({ content: [body] });

    //Delete User
    await deleteUserInKeycloack(createdUserId);
    //Verify that user is deleted
    await verifyUserDeleted(createdUserId, accessToken);
  });

});

