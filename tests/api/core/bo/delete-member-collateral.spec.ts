import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { deleteMemberCollateral } from "@utils/coreService/members/bo/deleteMemberCollateral";
import { getMemberList } from "@utils/coreService/members/getMemberList";

test.describe("Delete collateral item for a specific member", () => {
  let operatorToken: string;
  let memberXmi: string;
  let createdCollateralId: string | null = null;

  test.beforeAll(async () => {
    // Get operator token
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Get member list to find a member for creating collateral
    console.log("Getting member list for creating collateral test...");
    const membersResponse = await getMemberList(operatorToken, 0, 10);

    if (membersResponse.content.length === 0) {
      console.log("No members found");
      return;
    }

    // Use the first active member for testing
    memberXmi = membersResponse.content[0].xmi;
    console.log(`Selected member for test: ${memberXmi}`);
  });

  test("should create and delete collateral successfully", async ({
    request,
  }) => {
    // Skip if no member was found
    if (!memberXmi) {
      console.log("Skipping test - no member found");
      return;
    }

    console.log(
      `Testing create and delete collateral for member: ${memberXmi}`,
    );

    // Generate unique test data
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);

    const collateralData = {
      name: `Test Collateral ${timestamp} ${randomString}`,
      description: `Test description for collateral created at ${timestamp}`,
      amount: 1000 + Math.floor(Math.random() * 9000), // 1000-10000
      asset: "SAR",
      contribution_percent: 50 + Math.floor(Math.random() * 50), // 50-100
    };

    console.log(`Creating collateral with data:`, collateralData);

    // Step 1: Create a collateral using direct request
    const createFormData = {
      member_collateral_create: {
        name: "blob",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(collateralData)),
      },
    };

    const createResponse = await request.post(
      `${config.backofficeBaseUrl}/api/v1/core-admin/members/${memberXmi}/collaterals`,
      {
        headers: {
          Authorization: `Bearer ${operatorToken}`,
        },
        multipart: createFormData,
      },
    );

    // Assert creation was successful
    expect([200, 201]).toContain(createResponse.status());
    console.log(
      `Collateral creation successful with status: ${createResponse.status()}`,
    );

    const createdCollateral = await createResponse.json();
    console.log(`Created collateral response:`, createdCollateral);

    // Validate the created collateral
    expect(createdCollateral).toBeDefined();
    expect(createdCollateral.id).toBeDefined();
    expect(typeof createdCollateral.id).toBe("string");
    expect(createdCollateral.name).toBe(collateralData.name);
    expect(createdCollateral.description).toBe(collateralData.description);
    expect(createdCollateral.amount).toBe(collateralData.amount);
    expect(createdCollateral.currency).toBe(collateralData.asset);
    expect(createdCollateral.contribution_percent).toBe(
      collateralData.contribution_percent,
    );
    expect(createdCollateral.member_xmi).toBe(memberXmi);

    createdCollateralId = createdCollateral.id;
    console.log(
      `Collateral created successfully with ID: ${createdCollateralId}`,
    );

    // Step 2: Delete the created collateral
    // Use non-null assertion (!) to tell TypeScript this is not null
    console.log(`Now deleting the created collateral: ${createdCollateralId}`);
    const deleteResult = await deleteMemberCollateral(
      operatorToken,
      memberXmi,
      createdCollateralId!, // Non-null assertion
    );

    // Assert deletion was successful
    expect(deleteResult.response.status()).toBe(200);
    console.log(
      `DELETE request successful with status: ${deleteResult.response.status()}`,
    );

    // Verify the response body is empty
    if (deleteResult.body !== null && deleteResult.body !== undefined) {
      expect(Object.keys(deleteResult.body).length).toBe(0);
      console.log(`Response body is empty as expected`);
    }

    // Step 3: Verify the collateral is actually deleted
    console.log(`Verifying collateral was deleted...`);
    try {
      const getResponse = await request.get(
        `${config.backofficeBaseUrl}/api/v1/core-admin/members/${memberXmi}/collaterals`,
        {
          headers: {
            Authorization: `Bearer ${operatorToken}`,
          },
        },
      );

      expect(getResponse.status()).toBe(200);
      const collateralsAfterDelete = await getResponse.json();

      const deletedCollateralStillExists = collateralsAfterDelete.some(
        (c: any) => c.id === createdCollateralId,
      );

      expect(deletedCollateralStillExists).toBe(false);
      console.log(
        `Successfully verified collateral ${createdCollateralId} was deleted`,
      );
    } catch (error: any) {
      console.log(`Could not verify deletion: ${error.message}`);
      throw error;
    }

    console.log(`Create and delete collateral test completed successfully`);
  });

  // Optional: Cleanup in case the test fails
  test.afterAll(async ({ request }) => {
    if (memberXmi && createdCollateralId) {
      console.log(
        `Cleaning up - checking if collateral ${createdCollateralId} still exists...`,
      );

      try {
        const getResponse = await request.get(
          `${config.backofficeBaseUrl}/api/v1/core-admin/members/${memberXmi}/collaterals`,
          {
            headers: {
              Authorization: `Bearer ${operatorToken}`,
            },
          },
        );

        if (getResponse.status() === 200) {
          const collaterals = await getResponse.json();
          const collateralStillExists = collaterals.some(
            (c: any) => c.id === createdCollateralId,
          );

          if (collateralStillExists) {
            console.log(
              `Cleaning up leftover collateral ${createdCollateralId}...`,
            );
            try {
              await deleteMemberCollateral(
                operatorToken,
                memberXmi,
                createdCollateralId!, // Non-null assertion
              );
              console.log(`Cleanup completed`);
            } catch (cleanupError: any) {
              console.log(`Cleanup delete failed: ${cleanupError.message}`);
            }
          }
        }
      } catch (error: any) {
        console.log(`Cleanup check failed: ${error.message}`);
      }
    }
  });
});
