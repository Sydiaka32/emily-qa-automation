import { expect } from "@playwright/test";
import { getMemberServices } from "../../serviceUtils/serviceApi";

/**
 * Verifies that member has all required services for credit transfer
 */
export async function verifyCreditTransferServices(
  memberXmi: string,
  operatorToken: string,
  withExchange: boolean = false,
): Promise<void> {
  console.log("Verifying credit transfer services...");

  const services = await getMemberServices(memberXmi, operatorToken);

  const requiredServices = ["clr", "ct", "sm"];
  if (withExchange) {
    requiredServices.push("trd");
  }

  console.log(`Required services: ${requiredServices.join(", ")}`);

  requiredServices.forEach((serviceCode) => {
    const service = services.find((s) => s.code === serviceCode);
    expect(service, `Service ${serviceCode} should be assigned`).toBeDefined();
    expect(service!.status, `Service ${serviceCode} should be active`).toBe(
      "active",
    );
  });

  console.log(
    "All required services for credit transfer are verified and active",
  );
}
