import { postRequest } from "@utils/apiUtils/httpMethods/postRequest";
import { config } from "../../../../test.config";

/**
 * Add fee expression to a tariff via Back Office
 */
export async function addTariffFeeExpressionBo(
  operatorToken: string,
  tariffCode: string,
  feeData: {
    name: string;
    service_parameter: string;
    billing_period: string;
    charge_side: string | null;
    value: Array<{
      value_from: number | null;
      value_to: number | null;
      min_value: number | null;
      max_value: number | null;
      percent: number | null;
      fixed_value: number | null;
    }>;
  },
): Promise<{ response: any; body: any }> {
  console.log(`Adding fee expression to tariff ${tariffCode}...`);
  console.log(`Fee name: ${feeData.name}`);
  console.log(`Service parameter: ${feeData.service_parameter}`);
  console.log(`Billing period: ${feeData.billing_period}`);

  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}/fees/expression`;

  const result = await postRequest(
    endpoint,
    feeData,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Fee expression addition completed with status: ${result.response.status()}`,
  );
  return result;
}
