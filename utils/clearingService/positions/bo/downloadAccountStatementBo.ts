import { getRequestBinary } from "@utils/apiUtils/httpMethods/getRequestBinary";
import { config } from "../../../../test.config";

/**
 * Download account statement via Back Office for a specific member
 */
export async function downloadAccountStatementBo(
  operatorToken: string,
  memberXmi: string,
  fromDate: string,
  toDate: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    `/api/v1/settlement-admin/account-statement-reports/csv?member_xmi=${memberXmi}&from=${fromDate}&to=${toDate}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  return { response, body };
}
