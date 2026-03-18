import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { verifyUserContentStructure } from "@utils/coreService/users/verifyUserContentStructure";
import { verifyPaginationStructure } from "@utils/general/verifyPaginationStructure";
import { getRequest } from "@utils/apiUtils";


test.describe("Core Users API", () => {
  const endpoint = "/api/v1/core/users";
  const { memberName: username, password: password } = config;

  let accessToken: string;

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
  });

  test("200: GET users returns expected structure", async () => {
    // Act
    const { response, body } = await getRequest(endpoint, accessToken);

    // Assert
    expect(response.status(), "Should return 200 OK").toBe(200);

    verifyPaginationStructure(body);
    verifyUserContentStructure(body);
  });

});
