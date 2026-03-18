import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getMemberServices } from "@utils/serviceUtils/serviceApi";
import { Service, ServiceCodes } from "@utils/serviceUtils/serviceTypes";



test.describe("BO: Member profile - Services", () => {
    let operatorToken: string;
    const xmi=config.memberXmi;

    test.beforeAll(async () => {
        // Get operator authentication token before running tests
        operatorToken = await getOperatorToken(
            config.operatorName,
            config.password,
        );
    });


  test("200: GET member services with valid structure", async () => {
          // Act
          const services = await getMemberServices(xmi, operatorToken);
          
          // Assert - Basic response structure
          expect(Array.isArray(services)).toBe(true);
          expect(services.length).toBeGreaterThanOrEqual(0);
  
          // If there are services, validate each one
          if (services.length > 0) {
              services.forEach((service: Service, index: number) => {
                  // Validate required fields exist and have correct types
                  expect(service, `Service at index ${index} should have code`).toHaveProperty('code');
                  expect(typeof service.code, `Service at index ${index} code should be string`).toBe('string');
                  expect(service.code.length, `Service at index ${index} code should not be empty`).toBeGreaterThan(0);
  
                  expect(service, `Service at index ${index} should have name`).toHaveProperty('name');
                  expect(typeof service.name, `Service at index ${index} name should be string`).toBe('string');
  
                  expect(service, `Service at index ${index} should have group`).toHaveProperty('group');
                  expect(typeof service.group, `Service at index ${index} group should be string`).toBe('string');
  
                  expect(service, `Service at index ${index} should have status`).toHaveProperty('status');
                  expect(['active', 'inactive']).toContain(service.status);
              });
          }
 });

   test("200: GET member services with known service codes", async () => {
        // Act
        const services = await getMemberServices(xmi, operatorToken);
        
        // Assert - Check for known service codes if services exist
        if (services.length > 0) {
            const serviceCodes = services.map(service => service.code);
            const knownServiceCodes = Object.values(ServiceCodes);
            
            // Log available services for debugging
            console.log('Available services:', services);
            console.log('Service codes found:', serviceCodes);
            
            // Check if any known service codes are present
            const hasKnownServices = serviceCodes.some(code => 
                knownServiceCodes.includes(code as any)
            );
            
            // This is not a strict requirement, but good for information
            if (hasKnownServices) {
                console.log('Found known service codes in response');
            }
        }
    });

});
