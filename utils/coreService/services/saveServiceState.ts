import { getMemberServices } from "@utils/serviceUtils/serviceApi";
import { Service } from "@utils/serviceUtils/serviceTypes";

export interface ServiceState {
  memberXmi: string;
  services: Service[];
  timestamp: Date;
}

// Store original service states
const originalServiceStates = new Map<string, ServiceState>();

/**
 * Save current services state for a member
 */
export async function saveServicesState(
  memberXmi: string,
  operatorToken: string
): Promise<ServiceState> {
  const services = await getMemberServices(memberXmi, operatorToken);
  const state: ServiceState = {
    memberXmi,
    services: JSON.parse(JSON.stringify(services)), // Deep clone
    timestamp: new Date()
  };
  
  originalServiceStates.set(memberXmi, state);
  return state;
}

export function getSavedState(memberXmi: string): ServiceState | undefined {
  return originalServiceStates.get(memberXmi);
}