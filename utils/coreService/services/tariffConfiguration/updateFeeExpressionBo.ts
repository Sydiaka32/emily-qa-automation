import { putRequest } from "@utils/apiUtils/httpMethods/putRequest";
import { config } from "../../../../test.config";

/**
 * Update fee expression for a fee via Back Office
 */
export async function updateFeeExpressionBo(
  operatorToken: string,
  tariffCode: string,
  feeCode: string,
  feeData: {
    name: string;
    service_parameter: string;
    billing_period: string;
    value: Array<{
      value_from: number | null;
      value_to: number | null;
      min_value: number | null;
      max_value: number | null;
      percent: number | null;
      fixed_value: number | null;
    }>;
  },
): Promise<{ response: any; body: any; error?: string }> {
  console.log(
    `Updating fee expression for fee ${feeCode} in tariff ${tariffCode}...`,
  );
  console.log(`Fee name: ${feeData.name}`);
  console.log(`Service parameter: ${feeData.service_parameter}`);

  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}/fees/${feeCode}/expression`;

  const result = await putRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
    feeData,
  );

  console.log(
    `Fee expression update request completed with status: ${result.response.status()}`,
  );
  return result;
}
