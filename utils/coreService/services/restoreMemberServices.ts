import { disableService, enableService, getMemberServices } from "@utils/serviceUtils/serviceApi";
import { ServiceCode } from "@utils/serviceUtils/serviceTypes";

// Define service enablement order (services that have dependencies)
const SERVICE_ENABLE_ORDER: ServiceCode[] = [
  'clr',  // Enable CLR first
  'ct',   // Then CT (depends on CLR)
  'trd',  // Then TRD (depends on CLR)
  'lp',   // Then lp (depends on CLR)
  'sm',
];

// Accept the saved state as a parameter
export async function restoreMemberServices(
  memberXmi: string,
  operatorToken: string,
  originalState: { services: Array<{ code: string; status: string }> } // Accept state as parameter
): Promise<void> {
  if (!originalState) return;

  console.log(`Restoring services for ${memberXmi}`);

  // Disable all first
  const currentServices = await getMemberServices(memberXmi, operatorToken);
  for (const service of currentServices) {
    if (service.status === "active") {
      await disableService(memberXmi, operatorToken, service.code as ServiceCode);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // Enable in correct order considering dependencies
  for (const serviceCode of SERVICE_ENABLE_ORDER) {
    const shouldBeActive = originalState.services.some(
      s => s.code === serviceCode && s.status === "active"
    );

    if (shouldBeActive) {
      await enableService(memberXmi, operatorToken, serviceCode);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}





