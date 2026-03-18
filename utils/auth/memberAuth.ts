import { config } from "../../test.config";
import { authenticateUser } from "./authUtils";
import { AuthConfig } from "./types";

const MEMBER_AUTH_CONFIG: AuthConfig = {
    clientId: "front-client",
    realm: "emily",
    baseUrl: config.authMPUrl
};

export async function getAccessToken(
    username: string,
    password: string,
): Promise<string> {
    return authenticateUser(username, password, MEMBER_AUTH_CONFIG);
}