import { expect } from "@playwright/test";

export function verifyPaginationStructure(body: any) {
  const paginationFields = {
    total_pages: "number",
    total_elements: "number", 
    number: "number",
    size: "number",
    first: "boolean",
    last: "boolean",
    has_next: "boolean",
    has_previous: "boolean"
  };

  Object.entries(paginationFields).forEach(([field, expectedType]) => {
    expect(typeof body[field], `Pagination field '${field}' should be ${expectedType}`)
      .toBe(expectedType);
  });
}