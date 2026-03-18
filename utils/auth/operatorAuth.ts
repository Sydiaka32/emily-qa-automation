import { config } from "../../test.config";
import { authenticateUser } from "./authUtils";
import { AuthConfig } from "./types";

const OPERATOR_AUTH_CONFIG: AuthConfig = {
  clientId: "front-client",
  realm: "backoffice",
  baseUrl: config.authMPUrl
};

export async function getOperatorToken(
  username: string,
  password: string,
): Promise<string> {
  return authenticateUser(username, password, OPERATOR_AUTH_CONFIG);
}