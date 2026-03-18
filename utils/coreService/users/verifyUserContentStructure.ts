import { expect } from "@playwright/test";

export function verifyUserContentStructure(body: any) {
  expect(Array.isArray(body.content), "Content should be an array").toBe(true);
  
  if (body.content.length === 0) return;

  const userFields = {
    first_name: "string",
    last_name: "string", 
    phone_number: "string",
    email: "string",
    role: "string",
    id: "string",
    active: "boolean"
  };

  // Test first user as representative
  const user = body.content[0];
  Object.entries(userFields).forEach(([field, expectedType]) => {
    expect(typeof user[field], `User field '${field}' should be ${expectedType}`)
      .toBe(expectedType);
  });
}