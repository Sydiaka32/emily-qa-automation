import { APIRequestContext, expect, request as playwrightRequest } from "@playwright/test";
import { config } from "../../../test.config";

 export async function deleteUserInKeycloack(userId: string): Promise<void> {
  const requestContext: APIRequestContext = await playwrightRequest.newContext();

  // Step 1: Get admin access token
  const tokenResponse = await requestContext.post(`${config.authMPUrl}/realms/master/protocol/openid-connect/token`, {
    form: {
      grant_type: "password",
      client_id: "admin-cli",
      username: config.keycloackLogin,
      password: config.keycloackPwd
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  expect(tokenResponse.status(), "Failed to get admin token").toBe(200);
  const adminAccessToken = (await tokenResponse.json()).access_token;

  // Step 2: Delete user
  const deleteUrl = `${config.authMPUrl}/admin/realms/emily/users/${userId}`;
  console.log("Delet URL " + deleteUrl);
  const deleteResponse = await requestContext.delete(deleteUrl, {
    headers: {
      Authorization: `Bearer ${adminAccessToken}`
    }
  });

  expect(deleteResponse.status(), `Failed to delete user ${userId}`).toBe(204);

  // // Step 3: Confirm deletion
  // const verifyResponse = await requestContext.get(deleteUrl, {
  //   headers: {
  //     Authorization: `Bearer ${adminAccessToken}`
  //   }
  // });

  //expect(verifyResponse.status(), `User ${userId} was not deleted`).toBe(404);

}