import { GetCreditTransfersConfig } from "../../../modules/creditTransfer/getCreditTransferConfig";
import { CreditTransfersResponse } from "../../../modules/creditTransfer/getCreditTransferResponse";

export async function getCreditTransfers(
  config: GetCreditTransfersConfig,
): Promise<CreditTransfersResponse> {
  const {
    request,
    apiBaseUrl,
    accessToken,
    search,
    page = 0,
    size = 10,
  } = config;

  const response = await request.get(
    `${apiBaseUrl}/api/v1/ct/credit-transfers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        search,
        page,
        size,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to get credit transfers: ${response.status()} ${response.statusText()}`,
    );
  }

  return await response.json();
}
