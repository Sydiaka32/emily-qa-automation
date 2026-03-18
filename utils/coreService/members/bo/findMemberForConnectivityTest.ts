import { getMemberList } from "@utils/coreService/members/getMemberList";
import { getMemberConnectivityBo } from "./getMemberConnectivityBo";

/**
 * Find a member for connectivity testing
 * Tries to find a member with API key set, falls back to any member
 */
export async function findMemberForConnectivityTest(
  operatorToken: string,
): Promise<{ memberXmi: string; memberName: string; hasApiKey: boolean }> {
  console.log("Searching for member with connectivity details...");

  // Get member list
  const membersResponse = await getMemberList(operatorToken, 0, 30);

  if (membersResponse.content.length === 0) {
    throw new Error("No members found for connectivity testing");
  }

  console.log(`Found ${membersResponse.content.length} members`);

  // First, try to find a member with API key
  for (const member of membersResponse.content) {
    console.log(`Checking member ${member.xmi} for connectivity details...`);

    try {
      const connectivityResponse = await getMemberConnectivityBo(
        operatorToken,
        member.xmi,
      );

      if (connectivityResponse.response.status() === 200) {
        const connectivityData = connectivityResponse.body;

        console.log(`Member ${member.xmi} connectivity status: OK`);
        console.log(`  API key present: ${!!connectivityData.api_key}`);

        return {
          memberXmi: member.xmi,
          memberName: connectivityData.member_name || member.name || member.xmi,
          hasApiKey: !!connectivityData.api_key,
        };
      }
    } catch (error: any) {
      console.log(
        `Failed to get connectivity for member ${member.xmi}: ${error.message}`,
      );
    }
  }

  // If no member responded with 200, try the first member anyway
  const firstMember = membersResponse.content[0];
  console.log(
    `No member with connectivity details found, using first member: ${firstMember.xmi}`,
  );

  return {
    memberXmi: firstMember.xmi,
    memberName: firstMember.name || firstMember.xmi,
    hasApiKey: false,
  };
}
