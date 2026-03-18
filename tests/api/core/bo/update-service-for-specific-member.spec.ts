import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getMemberServices } from "@utils/serviceUtils/serviceApi";
import { ServiceCodes } from "@utils/serviceUtils/serviceTypes";
import { 
  enableClearingService, 
  enableCreditTransferService, 
  enableTraderService,
  disableTraderService,
  disableClearingService
} from "@utils/serviceUtils/serviceHelpers";
import { getSavedState, saveServicesState } from "@utils/coreService/services/saveServiceState";
import { disableAllServices } from "@utils/coreService/services/disableAllServices";
import { isServiceActive } from "@utils/coreService/services/isServiceActive";
import { restoreMemberServices } from "@utils/coreService/services/restoreMemberServices";

test.describe.configure({ mode: 'serial' });

test.describe("BO: Member Services Management", () => {
  let operatorToken: string;
  let  savedState: any;
  const xmi = config.memberXmi;

  test.beforeAll(async () => {
    operatorToken = await getOperatorToken(config.operatorName, config.password);
  });

  test.beforeEach(async () => {
    // Save original state before each test
    savedState=await saveServicesState(xmi, operatorToken);
    // Make all services inactive for clean test state
    await disableAllServices(xmi, operatorToken);
  });

  test.afterEach(async () => {     
    // Restore original state after each test
    await restoreMemberServices(xmi,operatorToken, savedState);
  });

  // Test 1: Assign CLR service
  test("200: should assign clearing service successfully", async () => {
    // Act
    const response = await enableClearingService(xmi, operatorToken);
    
    // Assert
    expect(response.status()).toBe(200);
    
    const services = await getMemberServices(xmi, operatorToken);
    expect(isServiceActive(services, ServiceCodes.CLEARING)).toBeTruthy();
  });

  // Test 2: Assign CLR and then CT services
  test("200: should assign clearing and credit transfer services sequentially", async () => {
    // Act - Assign CLR
    let response = await enableClearingService(xmi, operatorToken);
    expect(response.status()).toBe(200);
    
    // Act - Assign CT
    response = await enableCreditTransferService(xmi, operatorToken);
    expect(response.status()).toBe(200);
    
    // Assert
    const services = await getMemberServices(xmi, operatorToken);
    expect(isServiceActive(services, ServiceCodes.CLEARING)).toBeTruthy();
    expect(isServiceActive(services, ServiceCodes.CREDIT_TRANSFER)).toBeTruthy();
  });

  // Test 3: Assign CT without CLR should fail
  test("400: should fail when assigning CT without CLR", async () => {
    // Act & Assert
    const response = await enableCreditTransferService(xmi, operatorToken);
    
    // Expect 400 Bad Request with error message
    expect(response.status()).toBe(400);
    
    const errorBody = await response.json();
    expect(errorBody.code).toBeDefined();
    expect(errorBody.message).toBeDefined();
    
  });

  // Test 4: Assign CLR → TRD → Remove TRD
  test("200: should handle CLR → TRD → Remove TRD workflow", async () => {
    // Arrange - Enable CLR first
    await enableClearingService(xmi, operatorToken);
    
    // Act - Enable TRD
    let response = await enableTraderService(xmi, operatorToken);
    expect(response.status()).toBe(200);
    
    // Verify both services are active
    let services = await getMemberServices(xmi, operatorToken);
    expect(isServiceActive(services, ServiceCodes.CLEARING)).toBeTruthy();
    expect(isServiceActive(services, ServiceCodes.TRADER)).toBeTruthy();
    
    // Act - Remove TRD
    response = await disableTraderService(xmi, operatorToken);
    expect(response.status()).toBe(200);
    
    // Assert - Only CLR should remain active
    services = await getMemberServices(xmi, operatorToken);
    expect(isServiceActive(services, ServiceCodes.CLEARING)).toBeTruthy();
    expect(isServiceActive(services, ServiceCodes.TRADER)).toBeFalsy();
  });

  // Test 5: Assign CLR → TRD → Remove CLR should fail
  test("400: should fail when removing CLR while TRD is active", async () => {
    // Arrange - Enable both services
    await enableClearingService(xmi, operatorToken);
    await enableTraderService(xmi, operatorToken);
    
    // Act & Assert - Try to remove CLR (should fail)
    const response = await disableClearingService(xmi, operatorToken);
    expect(response.status()).toBe(400);
      
    const errorBody = await response.json();
    expect(errorBody.code).toBeDefined();
    expect(errorBody.message).toBeDefined();
      
   // Verify both services are still active
    const services = await getMemberServices(xmi, operatorToken);
    expect(isServiceActive(services, ServiceCodes.CLEARING)).toBeTruthy();
    expect(isServiceActive(services, ServiceCodes.TRADER)).toBeTruthy();
  });


});