import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getMemberList } from "@utils/coreService/members/getMemberList";
import { verifyPaginationStructure } from "@utils/general/verifyPaginationStructure";


test.describe("BO: Member list", () => {
    let operatorToken: string;

    test.beforeAll(async () => {
        // Get operator authentication token before running tests
        operatorToken = await getOperatorToken(
            config.operatorName,
            config.password,
        );
    });


    test("200: GET member list", async () => {
        const memberListResponse = await getMemberList(operatorToken);

        // Verify pagination structure
        verifyPaginationStructure(memberListResponse);

        // Verify content array exists
        expect(Array.isArray(memberListResponse.content)).toBe(true);

        // Verify pagination fields have reasonable values
        expect(memberListResponse.total_pages).toBeGreaterThanOrEqual(0);
        expect(memberListResponse.total_elements).toBeGreaterThanOrEqual(0);
        expect(memberListResponse.number).toBeGreaterThanOrEqual(0);
        expect(memberListResponse.size).toBeGreaterThanOrEqual(0);

        // Validate structure of first member
        if (memberListResponse.content.length > 0) {
            const member = memberListResponse.content[0];
            expect(typeof member.xmi).toBe("string");
            expect(typeof member.name).toBe("string");
            expect(['active', 'inactive']).toContain(member.status);
            expect(typeof member.country?.code).toBe("string");
            expect(typeof member.country?.name).toBe("string");
            expect(typeof member.main_contact?.email).toBe("string");
            expect(typeof member.alt_contact?.email).toBe("string");
        }
    })

});
