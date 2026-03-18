/**
 * Find a suitable service parameter for fee creation
 * Based on the service parameter structure from the API
 */
export function findSuitableServiceParameter(serviceParameters: any): {
  serviceCode: string;
  serviceName: string;
  parameterCode: string;
  parameterName: string;
  periods: string[];
} | null {
  console.log("Finding suitable service parameter for fee creation...");

  if (!serviceParameters || typeof serviceParameters !== "object") {
    console.log("Invalid service parameters structure");
    return null;
  }

  // First, try to find the exact parameter used in the example (withdrawn_amount)
  if (serviceParameters.clr && Array.isArray(serviceParameters.clr)) {
    const withdrawnAmountParam = serviceParameters.clr.find(
      (param: any) => param.code === "withdrawn_amount",
    );

    if (withdrawnAmountParam) {
      console.log("Found example parameter: withdrawn_amount");
      return {
        serviceCode: "clr",
        serviceName: "CLR",
        parameterCode: withdrawnAmountParam.code,
        parameterName: withdrawnAmountParam.name,
        periods: withdrawnAmountParam.periods,
      };
    }
  }

  // Second, look for parameters with "event" period in any service
  const services = Object.keys(serviceParameters);

  for (const serviceCode of services) {
    const serviceParams = serviceParameters[serviceCode];

    if (Array.isArray(serviceParams) && serviceParams.length > 0) {
      // Look for parameters with "event" period
      const eventParams = serviceParams.filter(
        (param: any) => param.periods && param.periods.includes("event"),
      );

      if (eventParams.length > 0) {
        // Use the first parameter with event period
        const param = eventParams[0];
        console.log(
          `Found suitable parameter: ${param.code} (${param.name}) in service ${serviceCode}`,
        );

        return {
          serviceCode,
          serviceName: serviceCode.toUpperCase(),
          parameterCode: param.code,
          parameterName: param.name,
          periods: param.periods,
        };
      }
    }
  }

  // If no event parameters, just use the first available parameter
  for (const serviceCode of services) {
    const serviceParams = serviceParameters[serviceCode];

    if (Array.isArray(serviceParams) && serviceParams.length > 0) {
      const param = serviceParams[0];
      console.log(
        `Found available parameter: ${param.code} (${param.name}) in service ${serviceCode}`,
      );

      return {
        serviceCode,
        serviceName: serviceCode.toUpperCase(),
        parameterCode: param.code,
        parameterName: param.name,
        periods: param.periods,
      };
    }
  }

  console.log("No suitable service parameters found");
  return null;
}
