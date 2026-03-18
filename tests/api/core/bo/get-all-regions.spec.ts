import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getAllRegions } from "@utils/coreService/regions/getAllRegions";

test.describe("BO: Region list", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator authentication token before running tests
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("200: GET region list", async () => {
    const regions = await getAllRegions(operatorToken);

    // Verify the response is a non-empty array
    expect(Array.isArray(regions)).toBe(true);
    expect(regions.length).toBeGreaterThan(0);

    // Verify each region object has the correct structure
    regions.forEach((region) => {
      // Required fields
      expect(region).toHaveProperty("code");
      expect(region).toHaveProperty("name");
      expect(region).toHaveProperty("asset");

      // Verify field types for required fields
      expect(typeof region.code).toBe("string");
      expect(typeof region.name).toBe("string");
      expect(typeof region.asset).toBe("string");

      // Verify required fields are not empty
      expect(region.code).toBeTruthy();
      expect(region.name).toBeTruthy();
      expect(region.asset).toBeTruthy();

      // Optional tariff field - if present, validate its structure
      if (region.tariff) {
        expect(typeof region.tariff).toBe("object");
        expect(region.tariff).toHaveProperty("code");
        expect(region.tariff).toHaveProperty("name");
        expect(typeof region.tariff.code).toBe("string");
        expect(typeof region.tariff.name).toBe("string");
        
        // Verify tariff fields are not empty if tariff exists
        expect(region.tariff.code).toBeTruthy();
        expect(region.tariff.name).toBeTruthy();
      }
    });

    // OCount regions with and without tariff for better test insights
    const regionsWithTariff = regions.filter(region => region.tariff);
    const regionsWithoutTariff = regions.filter(region => !region.tariff);
   
  });
});