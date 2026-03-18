import { disableService, getMemberServices } from "@utils/serviceUtils/serviceApi";
import { ServiceCode } from "@utils/serviceUtils/serviceTypes";

const SERVICE_DISABLE_ORDER: ServiceCode[] = [
  'ct',   // CT depends on CLR - disable before CLR
  'trd',  // TRD depends on CLR - disable before CLR  
  'lp',   // LP depends on CLR - disable before CLR
  'sm',   // SM might have dependencies
  'clr',  // CLR is depended upon - disable LAST
];

export async function disableAllServices(
  memberXmi: string,
  operatorToken: string
): Promise<void> {
  console.log(`Disabling all services for ${memberXmi} in dependency order`);

  const services = await getMemberServices(memberXmi, operatorToken);
  const activeServices = services.filter(service => service.status === "active");

  if (activeServices.length === 0) {
    console.log('No active services found');
    return;
  }

  console.log('Active services to disable:', activeServices.map(s => s.code));

  // Use the SERVICE_DISABLE_ORDER to disable services in correct sequence
  for (const serviceCode of SERVICE_DISABLE_ORDER) {
    // Check if this service is currently active
    const isActive = activeServices.some(service => service.code === serviceCode);

    if (isActive) {
      const response = await disableService(memberXmi, operatorToken, serviceCode);

      if (response.status() === 200) {
        console.log(`✓ Successfully disabled ${serviceCode}`);
      } else {
        console.error(`✗ Failed to disable ${serviceCode}: ${response.status()}`);
      }

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Verify all services are disabled
  const finalServices = await getMemberServices(memberXmi, operatorToken);
  const stillActive = finalServices.filter(service => service.status === "active");

  if (stillActive.length > 0) {
    console.warn(`Warning: Some services are still active: ${stillActive.map(s => s.code).join(', ')}`);
  } else {
    console.log('✓ All services disabled successfully');
  }
}