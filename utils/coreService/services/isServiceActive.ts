import { Service, ServiceCode } from "@utils/serviceUtils/serviceTypes";

export function isServiceActive(services: Service[], serviceCode: ServiceCode): boolean {
  return services.some(service => 
    service.code === serviceCode && service.status === "active"
  );
}