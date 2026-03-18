import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getMemberList } from "@utils/coreService/members/getMemberList";
import { getMemberUsersBo } from "@utils/coreService/members/bo/getMemberUsersBo";
import { deactivateMemberUser } from "@utils/coreService/members/bo/deactivateMemberUser";

test.describe("Deactivate specific user of a specific member", () => {
  let operatorToken: string;
  let testMemberXmi: string;
  let activeUser: any | null = null;

  test.beforeAll(async () => {
    // Get operator token
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Get member list to find a member for testing
    console.log("Getting member list for deactivate user test...");
    const membersResponse = await getMemberList(operatorToken, 0, 10);

    if (membersResponse.content.length === 0) {
      console.log("No members found");
      return;
    }

    // Find a member with at least one active user
    for (const member of membersResponse.content) {
      console.log(`Checking member ${member.xmi} for active users...`);

      try {
        const usersResponse = await getMemberUsersBo(operatorToken, member.xmi);

        // Find an active user (not already deactivated)
        const activeUsers = usersResponse.content.filter((user) => user.active);

        if (activeUsers.length > 0) {
          testMemberXmi = member.xmi;
          activeUser = activeUsers[0]; // Use the first active user
          console.log(
            `Found active user: ${activeUser.first_name} ${activeUser.last_name} (ID: ${activeUser.id})`,
          );
          break;
        }
      } catch (error) {
        console.log(`Failed to get users for member ${member.xmi}: ${error}`);
      }
    }

    if (!testMemberXmi || !activeUser) {
      console.log("No member with active users found");
    }
  });

  test("should deactivate user successfully", async () => {
    // Skip if no active user was found
    if (!testMemberXmi || !activeUser) {
      console.log("Skipping test - no active user found");
      return;
    }

    console.log(`Testing user deactivation for member: ${testMemberXmi}`);
    console.log(
      `User to deactivate: ${activeUser.first_name} ${activeUser.last_name} (ID: ${activeUser.id})`,
    );
    console.log(`Current active status: ${activeUser.active}`);

    // Verify the user is currently active
    expect(activeUser.active).toBe(true);

    // Get a fresh token right before the operation to avoid expiration
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

    // Act - Deactivate the user using the utility function
    console.log(`Sending deactivation request...`);
    const deactivatedUser = await deactivateMemberUser(
      freshOperatorToken,
      testMemberXmi,
      activeUser.id,
    );

    console.log(`Deactivation response received`);

    // Assert response structure
    expect(deactivatedUser).toBeDefined();
    expect(deactivatedUser.id).toBe(activeUser.id);
    expect(deactivatedUser.active).toBe(false); // Should now be inactive

    // Check all fields are present and correct
    expect(deactivatedUser.first_name).toBe(activeUser.first_name);
    expect(deactivatedUser.last_name).toBe(activeUser.last_name);
    expect(deactivatedUser.phone_number).toBe(activeUser.phone_number);
    expect(deactivatedUser.email).toBe(activeUser.email);
    expect(deactivatedUser.role).toBe(activeUser.role);

    // Verify field types
    expect(typeof deactivatedUser.first_name).toBe("string");
    expect(typeof deactivatedUser.last_name).toBe("string");
    expect(typeof deactivatedUser.phone_number).toBe("string");
    expect(typeof deactivatedUser.email).toBe("string");
    expect(typeof deactivatedUser.role).toBe("string");
    expect(typeof deactivatedUser.id).toBe("string");
    expect(typeof deactivatedUser.active).toBe("boolean");

    console.log(`Successfully deactivated user ${deactivatedUser.id}`);
  });

  test("should verify user is actually deactivated in the system", async () => {
    // Skip if no active user was found (or if previous test didn't run)
    if (!testMemberXmi || !activeUser) {
      console.log("Skipping test - no active user found");
      return;
    }

    console.log(
      `Verifying user deactivation for: ${activeUser.first_name} ${activeUser.last_name}`,
    );

    // Get a fresh token
    const freshOperatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // First, check current status
    console.log(`Checking current user status...`);
    const currentStatus = await getMemberUsersBo(
      freshOperatorToken,
      testMemberXmi,
    );
    const userInSystem = currentStatus.content.find(
      (u: any) => u.id === activeUser.id,
    );

    if (!userInSystem) {
      console.log(`User ${activeUser.id} not found in system`);
      return;
    }

    // If user is still active, deactivate them
    if (userInSystem.active) {
      console.log(`User is still active, deactivating now...`);

      await deactivateMemberUser(
        freshOperatorToken,
        testMemberXmi,
        activeUser.id,
      );

      console.log(`User deactivated successfully`);
    }

    // Get the updated user list and verify deactivation
    console.log(`Fetching updated user list...`);
    const updatedUsersResponse = await getMemberUsersBo(
      freshOperatorToken,
      testMemberXmi,
    );

    const updatedUser = updatedUsersResponse.content.find(
      (u: any) => u.id === activeUser.id,
    );

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.active).toBe(false);

    console.log(
      `Verified: User ${updatedUser!.first_name} ${updatedUser!.last_name} is now inactive`,
    );

    // Also verify other user data remains unchanged
    expect(updatedUser!.first_name).toBe(activeUser.first_name);
    expect(updatedUser!.last_name).toBe(activeUser.last_name);
    expect(updatedUser!.email).toBe(activeUser.email);
    expect(updatedUser!.role).toBe(activeUser.role);
  });
});
