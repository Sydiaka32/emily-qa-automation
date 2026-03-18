import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { validateMemberStructure } from "@utils/coreService/members/verifyMemberStructure";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";


test.describe("Member profile - Details", () => {
  const endpoint = "/api/v1/core/members/current";
  const { memberName: username, password: password, memberXmi: expected_xmi } = config;

  let accessToken: string;

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
  });

  test("200: GET current member", async () => {
   const memeberResponse = await getCurrentMember(accessToken)

    // If the endpoint returns an array:
    if (Array.isArray(memeberResponse) && memeberResponse.length > 0) {
      validateMemberStructure(memeberResponse[0], undefined, { requireDomesticCurrency: true });
    }
    // If the endpoint returns a single object:
    else if (memeberResponse && typeof memeberResponse === "object") {
      await validateMemberStructure(memeberResponse, undefined, { requireDomesticCurrency: true });
      expect(memeberResponse.xmi, "Member XMI should match configured member").toBe(expected_xmi);
    } else {
      throw new Error("Unexpected response format for current member");
    }


  });
});