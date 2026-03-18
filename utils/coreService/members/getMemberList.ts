import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { MembersListResponse } from "../../../modules/core/membersListResponse";

export async function getMemberList(
    operatorToken: string,
    page: number = 0,
    size: number = 10,
): Promise<MembersListResponse> {
    const { response, body } = await getRequest(
        `/api/v1/core-admin/members?page=${page}&size=${size}`,
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
