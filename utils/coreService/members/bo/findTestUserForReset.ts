import { getMemberList } from "@utils/coreService/members/getMemberList";
import { getMemberUsersBo } from "@utils/coreService/members/bo/getMemberUsersBo";

/**
 * Find a test user for password reset testing by searching through members
 */
export async function findTestUserForReset(
  operatorToken: string,
): Promise<{
  memberXmi: string;
  userId: string;
  userName: string;
  userEmail: string;
}> {
  console.log("Searching for a member with users for password reset test...");

  // Get member list
  const membersResponse = await getMemberList(operatorToken, 0, 20);

  if (membersResponse.content.length === 0) {
    throw new Error("No members found for password reset testing");
  }

  console.log(
    `Found ${membersResponse.content.length} members, searching for users...`,
  );

  // Search through members to find one with users
  for (const member of membersResponse.content) {
    console.log(`Checking member ${member.xmi} for users...`);

    try {
      const usersResponse = await getMemberUsersBo(operatorToken, member.xmi);

      if (usersResponse.content.length > 0) {
        // Use the first user found
        const firstUser = usersResponse.content[0];
        console.log(
          `Found user in member ${member.xmi}: ${firstUser.first_name} ${firstUser.last_name} (ID: ${firstUser.id})`,
        );

        return {
          memberXmi: member.xmi,
          userId: firstUser.id,
          userName: `${firstUser.first_name} ${firstUser.last_name}`,
          userEmail: firstUser.email || "",
        };
      }
    } catch (error: any) {
      console.log(
        `Failed to get users for member ${member.xmi}: ${error.message}`,
      );
    }
  }

  throw new Error("No users found in any member for password reset testing");
}
