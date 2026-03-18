import { getRequest } from "@utils/apiUtils";
import { Position } from "../../../modules/clearing/position";

export async function getPositions(authToken: string): Promise<Position[]> {
  const { response, body } = await getRequest(
    "/api/v1/ledger/positions",
    authToken,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get positions failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
