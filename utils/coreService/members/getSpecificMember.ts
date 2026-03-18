import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { MemberResponse } from "modules/core/memberResponse";

export async function getSpecificMember(
    operatorToken: string,
    xmi: string
): Promise<MemberResponse> {
    const { response, body } = await getRequest(
        `/api/v1/core-admin/members/${xmi}`,
        operatorToken,
        config.backofficeBaseUrl,
    );


    if (response.status() !== 200) {
        throw new Error(
            `Get members list failed with status ${response.status()}: ${JSON.stringify(body)}`,
        );
    }
    return body;
}
