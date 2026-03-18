import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getMemberList } from "@utils/coreService/members/getMemberList";
import { getMemberUsersBo } from "@utils/coreService/members/bo/getMemberUsersBo";
import { deactivateMemberUser } from "@utils/coreService/members/bo/deactivateMemberUser";
import { activateMemberUser } from "@utils/coreService/members/bo/activateMemberUser";

test.describe("Activate specific user of a specific member", () => {
  let operatorToken: string;
  let testMemberXmi: string;
  let testUserId: string;
  let originalUserData: any | null = null;

  test.beforeAll(async () => {
    // Get operator token
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Get member list to find a member for testing
    console.log("Getting member list for activate user test...");
    const membersResponse = await getMemberList(operatorToken, 0, 10);

    if (membersResponse.content.length === 0) {
      console.log("No members found");
      return;
    }

    // Find a member with at least one user that we can work with
    for (const member of membersResponse.content) {
      console.log(`Checking member ${member.xmi} for users...`);

      try {
        const usersResponse = await getMemberUsersBo(operatorToken, member.xmi);

        if (usersResponse.content.length > 0) {
          // Use the first user for testing
          const testUser = usersResponse.content[0];
          testMemberXmi = member.xmi;
          testUserId = testUser.id;
          originalUserData = { ...testUser };

          console.log(
            `Selected user for testing: ${testUser.first_name} ${testUser.last_name} (ID: ${testUser.id})`,
          );
          console.log(`Current active status: ${testUser.active}`);

          // If user is active, deactivate them first to set up for activation test
          if (testUser.active) {
            console.log(`User is active, deactivating first to set up test...`);
            const freshToken = await getOperatorToken(
              config.operatorName,
              config.password,
            );
            await deactivateMemberUser(freshToken, testMemberXmi, testUserId);
            console.log(`User deactivated successfully for test setup`);
          }

          break;
        }
      } catch (error) {
        console.log(`Failed to get users for member ${member.xmi}: ${error}`);
      }
    }

    if (!testMemberXmi || !testUserId) {
      console.log("No suitable user found for testing");
    }
  });

  test("should activate user successfully", async () => {
    // Skip if no test user was found
    if (!testMemberXmi || !testUserId || !originalUserData) {
      console.log("Skipping test - no test user found");
      return;
    }

    console.log(`Testing user activation for member: ${testMemberXmi}`);
    console.log(
      `User to activate: ${originalUserData.first_name} ${originalUserData.last_name} (ID: ${testUserId})`,
    );

    // Get a fresh token right before the operation
    let freshOperatorToken: string;
    try {
      freshOperatorToken = await getOperatorToken(
        config.operatorName,
        config.password,
      );
      console.log("Got fresh operator token");
    } catch (tokenError: any) {
      console.log(`Failed to get fresh token: ${tokenError.message}`);
      throw tokenError;
    }

    // Verify the user is currently inactive before activation
    console.log(`Verifying user is currently inactive...`);
    const currentStatus = await getMemberUsersBo(
      freshOperatorToken,
      testMemberXmi,
    );
    const userBeforeActivation = currentStatus.content.find(
      (u: any) => u.id === testUserId,
    );

    if (userBeforeActivation) {
      console.log(
        `User active status before activation: ${userBeforeActivation.active}`,
      );
      expect(userBeforeActivation.active).toBe(false); // Should be inactive
    }

    // Act - Activate the user using the utility function
    console.log(`Sending activation request...`);
    const activatedUser = await activateMemberUser(
      freshOperatorToken, // Use fresh token
      testMemberXmi,
      testUserId,
    );

    console.log(`Activation response received`);

    // Assert response structure
    expect(activatedUser).toBeDefined();
    expect(activatedUser.id).toBe(testUserId);
    expect(activatedUser.active).toBe(true); // Should now be active

    // Check all fields are present and correct
    expect(activatedUser.first_name).toBe(originalUserData.first_name);
    expect(activatedUser.last_name).toBe(originalUserData.last_name);
    expect(activatedUser.phone_number).toBe(originalUserData.phone_number);
    expect(activatedUser.email).toBe(originalUserData.email);
    expect(activatedUser.role).toBe(originalUserData.role);

    // Verify field types
    expect(typeof activatedUser.first_name).toBe("string");
    expect(typeof activatedUser.last_name).toBe("string");
    expect(typeof activatedUser.phone_number).toBe("string");
    expect(typeof activatedUser.email).toBe("string");
    expect(typeof activatedUser.role).toBe("string");
    expect(typeof activatedUser.id).toBe("string");
    expect(typeof activatedUser.active).toBe("boolean");

    console.log(`Successfully activated user ${activatedUser.id}`);
  });

  test("should verify user is actually activated in the system", async () => {
    // Skip if no test user was found
    if (!testMemberXmi || !testUserId || !originalUserData) {
      console.log("Skipping test - no test user found");
      return;
    }

    console.log(
      `Verifying user activation for: ${originalUserData.first_name} ${originalUserData.last_name}`,
    );

    // Get a fresh token
    const freshOperatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // First, ensure user is inactive before testing activation
    console.log(`Ensuring user is inactive before activation test...`);
    const currentStatus = await getMemberUsersBo(
      freshOperatorToken,
      testMemberXmi,
    );
    const currentUser = currentStatus.content.find(
      (u: any) => u.id === testUserId,
    );

    if (!currentUser) {
      console.log(`User ${testUserId} not found in system`);
      return;
    }

    // If user is active, deactivate them first
    if (currentUser.active) {
      console.log(`User is active, deactivating first...`);
      await deactivateMemberUser(freshOperatorToken, testMemberXmi, testUserId);
      console.log(`User deactivated successfully`);
    }

    // Now activate the user
    console.log(`Activating user...`);
    await activateMemberUser(freshOperatorToken, testMemberXmi, testUserId);

    // Get the updated user list and verify activation
    console.log(`Fetching updated user list...`);
    const updatedUsersResponse = await getMemberUsersBo(
      freshOperatorToken,
      testMemberXmi,
    );

    const updatedUser = updatedUsersResponse.content.find(
      (u: any) => u.id === testUserId,
    );

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.active).toBe(true);

    console.log(
      `Verified: User ${updatedUser!.first_name} ${updatedUser!.last_name} is now active`,
    );

    // Also verify other user data remains unchanged
    expect(updatedUser!.first_name).toBe(originalUserData.first_name);
    expect(updatedUser!.last_name).toBe(originalUserData.last_name);
    expect(updatedUser!.email).toBe(originalUserData.email);
    expect(updatedUser!.role).toBe(originalUserData.role);
  });
});
