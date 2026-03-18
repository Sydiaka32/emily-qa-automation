import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { MemberResponse } from "modules/core/memberResponse";

export async function getCurrentMember(
    token: string,
): Promise<MemberResponse> {
    const { response, body } = await getRequest(
        `/api/v1/core/members/current`,
        token,
        config.apiBaseUrl,
    );


    if (response.status() !== 200) {
        throw new Error(
            `Get members list failed with status ${response.status()}: ${JSON.stringify(body)}`,
        );
    }
    return body;
}
