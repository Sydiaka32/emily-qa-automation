import { getMemberList } from "@utils/coreService/members/getMemberList";
import { getMemberConnectivityBo } from "./getMemberConnectivityBo";

/**
 * Find a member with existing callback URL for testing
 */
export async function findMemberWithCallbackUrl(
  operatorToken: string,
): Promise<{
  memberXmi: string;
  memberName: string;
  currentCallbackUrl: string | null;
  hasApiKey: boolean;
}> {
  console.log("Searching for member with callback URL for testing...");

  // Get member list
  const membersResponse = await getMemberList(operatorToken, 0, 30);

  if (membersResponse.content.length === 0) {
    throw new Error("No members found for callback URL testing");
  }

  console.log(`Found ${membersResponse.content.length} members`);

  // Look for a member with a callback URL set
  for (const member of membersResponse.content) {
    console.log(`Checking member ${member.xmi} for callback URL...`);

    try {
      const connectivityResponse = await getMemberConnectivityBo(
        operatorToken,
        member.xmi,
      );

      if (connectivityResponse.response.status() === 200) {
        const connectivityData = connectivityResponse.body;

        // Check if callback URL exists (could be null or empty string)
        const hasCallbackUrl =
          connectivityData.callback_url &&
          connectivityData.callback_url.trim().length > 0;

        console.log(
          `Member ${member.xmi}: ${hasCallbackUrl ? "Has callback URL" : "No callback URL"}`,
        );

        return {
          memberXmi: member.xmi,
          memberName: connectivityData.member_name || member.name || member.xmi,
          currentCallbackUrl: connectivityData.callback_url,
          hasApiKey: !!connectivityData.api_key,
        };
      }
    } catch (error: any) {
      console.log(
        `Failed to get connectivity for member ${member.xmi}: ${error.message}`,
      );
    }
  }

  // If no member has callback URL, use the first member
  const firstMember = membersResponse.content[0];
  console.log(
    `No member with callback URL found, using first member: ${firstMember.xmi}`,
  );

  // Get connectivity for first member
  try {
    const connectivityResponse = await getMemberConnectivityBo(
      operatorToken,
      firstMember.xmi,
    );
    const connectivityData = connectivityResponse.body;

    return {
      memberXmi: firstMember.xmi,
      memberName:
        connectivityData.member_name || firstMember.name || firstMember.xmi,
      currentCallbackUrl: connectivityData.callback_url,
      hasApiKey: !!connectivityData.api_key,
    };
  } catch (error: any) {
    throw new Error(
      `Failed to get connectivity for member ${firstMember.xmi}: ${error.message}`,
    );
  }
}
