import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getSpecificMember } from "@utils/coreService/members/getSpecificMember";
import { validateMemberStructure } from "@utils/coreService/members/verifyMemberStructure";


test.describe("BO: Member profile - Details", () => {
    let operatorToken: string;
    const xmi=config.memberXmi;

    test.beforeAll(async () => {
        // Get operator authentication token before running tests
        operatorToken = await getOperatorToken(
            config.operatorName,
            config.password,
        );
    });


    test("200: GET specific member", async () => {
        const memberResponse = await getSpecificMember(operatorToken,xmi);

           validateMemberStructure(memberResponse, undefined,   { requireAsset: true });
              expect(memberResponse.xmi, "Member XMI should match configured member").toBe(xmi);

    
            expect(typeof memberResponse.xmi).toBe("string");
            expect(typeof memberResponse.name).toBe("string");
            expect(['active', 'inactive']).toContain(memberResponse.status);
            expect(typeof memberResponse.country?.code).toBe("string");
            expect(typeof memberResponse.country?.name).toBe("string");
            expect(typeof memberResponse.main_contact?.email).toBe("string");
            expect(typeof memberResponse.alt_contact?.email).toBe("string");
        
    })

});
