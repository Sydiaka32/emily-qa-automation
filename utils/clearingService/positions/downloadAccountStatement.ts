import { getRequestBinary } from "@utils/apiUtils/httpMethods/getRequestBinary";

/**
 * Download account statement report
 */
export async function downloadAccountStatement(
  token: string,
  fromDate: string,
  toDate: string,
): Promise<{ response: any; body: Buffer }> {
  const endpoint = `/api/v1/settlement/account-statement-reports/csv?from=${fromDate}&to=${toDate}`;

  console.log(`Downloading account statement from ${fromDate} to ${toDate}`);

  const { response, body } = await getRequestBinary(endpoint, token);

  return { response, body };
}
