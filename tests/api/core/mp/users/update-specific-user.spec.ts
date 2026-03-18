import { test, expect } from "@playwright/test";
import { config } from "../../../../../test.config";
import { getAccessToken } from "@utils/auth";
import { verifyUserContentStructure } from "@utils/coreService/users/verifyUserContentStructure";
import { createTestUser } from "@utils/coreService/users/createTestUser";
import { getRequest, postRequest, putRequest } from "@utils/apiUtils";
import { generateUserData } from "data/generators";
import { getUserIdFromJwt } from "@utils/coreService/users/getUserIdFromJwt";

test.describe("User management - Update another user", () => {
  const endpoint = "/api/v1/core/users";
  const { memberName: username, password, apiBaseUrl } = config;
  let currentUserId: string;

  let accessToken: string;
  let targetUserId: string;
  let originalTargetUserData: any;
  let currentUserRole: string;
  let otherUser: any;

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
    currentUserId = getUserIdFromJwt(accessToken)!;

    // Confirm current user is admin
    const { body: currentUser } = await getRequest(
      `${endpoint}/${currentUserId}`,
      accessToken,
    );
    currentUserRole = currentUser.role;
    expect(currentUser.role).toBe("admin");

    // Get list of users and pick one that's not the current user
    const { body: userList } = await getRequest(endpoint, accessToken);
    otherUser = userList.content.find((user: any) => user.id !== currentUserId);

    if (!otherUser) {
      otherUser = await createTestUser(accessToken);
    }

    targetUserId = otherUser.id;

    // Save original data
    const { body: targetUser } = await getRequest(
      `${endpoint}/${targetUserId}`,
      accessToken,
    );
    originalTargetUserData = {
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      phone_number: targetUser.phone_number,
    };
  });

  test.afterAll(async () => {
    if (!originalTargetUserData) return;

    const { response: restoreResponse } = await putRequest(
      `${endpoint}/${targetUserId}`,
      accessToken,
      apiBaseUrl,
      originalTargetUserData
    );
    expect(restoreResponse.status(), "Restore should succeed").toBe(200);
    console.log(`Restored user ${targetUserId} to original state`);
  });

  test("200: PUT /users/{id} - should update another user", async () => {
    const newUserData = generateUserData();

    const { response, body } = await putRequest(
      `${endpoint}/${targetUserId}`,
            accessToken,
            apiBaseUrl,
            newUserData
    );
    expect(response.status(), "Expected 200 OK").toBe(200);

    verifyUserContentStructure({ content: [body] });

    console.log(`Updated user ${targetUserId} successfully`);
  });

  test("200: POST /{user_id}/deactivate - should deactivate specific user", async () => {
    const deactivate_url = `${endpoint}/${otherUser.id}/deactivate`;
    const { response } = await postRequest(deactivate_url, null, accessToken);
    expect(response.status(), "Expected 200 OK").toBe(200);
    console.log(`Updated user ${targetUserId} successfully`);
  });

  test("200: POST /{user_id}/activate - should deactivate specific user", async () => {
    const deactivate_url = `${endpoint}/${otherUser.id}/activate`;
    const { response } = await postRequest(deactivate_url, null, accessToken);
    expect(response.status(), "Expected 200 OK").toBe(200);
    console.log(`Updated user ${targetUserId} successfully`);
  });

  test("200: PUT /users/{id}/roles/{role} - update role based on current user permissions", async () => {
    let newRole: string;
    let expectedStatus: number;

    if (currentUserRole === "admin") {
      newRole = "delegated_admin";
      expectedStatus = 200;
    } else if (currentUserRole === "delegated_admin") {
      newRole = "user";
      expectedStatus = 200;
    } else {
      newRole = "admin"; // not allowed
      expectedStatus = 403;
    }

    const updateUrl = `${endpoint}/${targetUserId}/roles/${newRole}`;
    const { response, body } = await putRequest(updateUrl, accessToken, apiBaseUrl,{});

    expect(response.status()).toBe(expectedStatus);

    if (expectedStatus === 200) {
      expect(body.role).toBe(newRole);
      console.log(`Role of user ${targetUserId} updated to ${newRole}`);
    } else {
      console.log(
        `Current user (${currentUserRole}) not allowed to update roles`,
      );
    }
  });
});
