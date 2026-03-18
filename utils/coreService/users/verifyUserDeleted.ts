import { expect } from "@playwright/test";
import { getRequest } from "@utils/apiUtils";

export async function verifyUserDeleted(userId: string, accessToken: string): Promise<void> {
  const { response, body } = await getRequest("/api/v1/core/users", accessToken);
  expect(response.status()).toBe(200);

  const userIds = body.content.map((user: any) => user.id);
  expect(userIds).not.toContain(userId);
}