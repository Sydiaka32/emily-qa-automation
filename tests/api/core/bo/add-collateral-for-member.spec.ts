import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { generateCollateralData } from "data/generators";
import { cleanupCollaterals } from "@utils/coreService/members/cleanupCollaterals";

test.describe("BO: Create Member Collateral", () => {
  let operatorToken: string;
  const memberXmi =config.memberXmi;
   let createdCollateralIds: string[] = [];

  test.beforeAll(async () => {
    operatorToken = await getOperatorToken(config.operatorName, config.password);
  });
  
   test.beforeEach(() => {
    // Reset the array before each test
    createdCollateralIds = [];
  });

  test.afterEach(async () => {
    // Cleanup after each test
    await cleanupCollaterals(operatorToken, memberXmi, createdCollateralIds);
  });

  test("200: POST create member collateral", async ({ request }) => {
    const collateralData = generateCollateralData();
    // Create FormData
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(collateralData)], { type: 'application/json' });
    formData.append('member_collateral_create', blob, 'collateral.json');

    // Make request using Playwright's request API
    const response = await request.post(
      `${config.backofficeBaseUrl}/api/v1/core-admin/members/${memberXmi}/collaterals`,
      {
        headers: {
          'Authorization': `Bearer ${operatorToken}`,
        },
        multipart: formData
      }
    );

    // Verify response status
    expect(response.status()).toBe(200);

    // Parse and verify response body
    const responseBody = await response.json();
     createdCollateralIds.push(responseBody.id);

    // Verify response structure
    expect(responseBody).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      member_xmi: expect.any(String),
      currency: expect.any(String),
      amount: expect.any(Number),
      contribution_percent: expect.any(Number),
      documents: expect.any(Array)
    });

    // Verify specific values
    expect(responseBody.name).toBe(collateralData.name);
    expect(responseBody.description).toBe(collateralData.description);
    expect(responseBody.amount).toBe(collateralData.amount);
    expect(responseBody.contribution_percent).toBe(collateralData.contribution_percent);

    // Verify member_xmi matches the one in URL
    expect(responseBody.member_xmi).toBe(memberXmi);

    // Verify documents array structure
    responseBody.documents.forEach((document: any) => {
      expect(document).toMatchObject({
        id: expect.any(String),
        filename: expect.any(String)
      });
    });

    console.log(`Successfully created collateral with ID: ${responseBody.id}`);
  });
});