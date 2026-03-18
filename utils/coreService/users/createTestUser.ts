import { expect } from "@playwright/test";
import { postRequest } from "@utils/apiUtils";
import { generateUserData } from "../../../data/generators";

export async function createTestUser(accessToken: string): Promise<{ id: string; body: any }> {
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // ensures 4 digits
    const email = `julia.l+autotest${randomDigits}@emily.tech`;

    
  const payload = generateUserData({ email, role: "user" });
  const { response, body } = await postRequest("/api/v1/core/users", payload, accessToken);

  expect(response.status()).toBe(200);
  return { id: body.id, body };
}