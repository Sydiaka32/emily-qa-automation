import test, { expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken } from "@utils/auth";
import { getCurrentMemberServices } from "@utils/serviceUtils/serviceApi";


test.describe("Member profile - Update contact", () => {
  const get_current_member_services = "/api/v1/core/services";
  const { memberName: username, password: password, memberXmi: expected_xmi } = config;

  let accessToken: string;

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
  });

  test("200: GET member services", async () => {
    const services = await getCurrentMemberServices(expected_xmi, accessToken);

    console.log(JSON.stringify(services, null, 2));

    // Basic response validation
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);

    for (const service of services) {
      expect(service).toHaveProperty("code");
      expect(service).toHaveProperty("name");
      expect(service).toHaveProperty("group");
      expect(service).toHaveProperty("status");

      expect(typeof service.code).toBe("string");
      expect(typeof service.name).toBe("string");
      expect(typeof service.group).toBe("string");
      expect(["active", "inactive"]).toContain(service.status);
    }
  });
});
