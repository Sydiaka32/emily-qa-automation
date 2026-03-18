import { expect } from "@playwright/test";

export function verifyContactData(actual: any, expected: any, contactType: string) {
  const fields = ['first_name', 'last_name', 'phone', 'email'];
  
  fields.forEach(field => {
    expect(actual[field], `${contactType}.${field} should match`).toBe(expected[field]);
  });
}