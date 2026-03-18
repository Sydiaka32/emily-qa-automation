import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getSpecificMember } from "@utils/coreService/members/getSpecificMember";
import { updateMemberData } from "@utils/coreService/members/updateMemberData";
import { validateMemberStructure } from "@utils/coreService/members/verifyMemberStructure";
import { generateContactData, generateMemberData } from "data/generators";

test.describe("BO: Member profile - Update", () => {
    let operatorToken: string;
    let originalData: any;
    const xmi = config.memberXmi;

    test.beforeAll(async () => {
        // Get operator authentication token before running tests
        operatorToken = await getOperatorToken(
            config.operatorName,
            config.password,
        );
    });

    test.beforeEach(async () => {
        // Get and store original member data before each test
        const memberResponse = await getSpecificMember(operatorToken, xmi);
    
        // Store the complete member data for restoration
        originalData = {
            name: memberResponse.name,
            branch_name: memberResponse.branch_name,
            tax_ref: memberResponse.tax_ref,
            address: memberResponse.address,
            country_code: memberResponse.country.code,
            main_contact: { ...memberResponse.main_contact },
            alt_contact: { ...memberResponse.alt_contact },
            region_code: memberResponse.region.code
        };

        console.log(`Original member data stored for restoration`);
    });

    test.afterEach(async () => {
        if (!originalData) {
            console.log("No original data to restore");
            return;
        }

        try {
            // Restore original data
            const { response: restoreResponse } = await updateMemberData(
                operatorToken,
                xmi,
                originalData
            );

            if (restoreResponse.status() !== 200) {
                throw new Error(`Restore failed with status: ${restoreResponse.status()}`);
            }

            // Verify restoration was successful
            const verifyBody = await getSpecificMember(operatorToken, xmi);
            const isRestored = 
                verifyBody.main_contact.first_name === originalData.main_contact.first_name &&
                verifyBody.main_contact.last_name === originalData.main_contact.last_name &&
                verifyBody.name === originalData.name;

            if (isRestored) {
                console.log("Member data verified and restored successfully");
            } else {
                console.log("Member data restored but verification failed");
            }

        } catch (error) {
            console.log("Member data restoration failed:", error);
            // Don't throw to avoid masking the actual test failure
        }
    });

    test("200: should update contacts and return complete member data", async () => {
        // Arrange
        const contactData = generateContactData();
        const memberData = generateMemberData();

        // Combine contact data with other member fields for the update
        const updateData = {
            ...memberData,
            main_contact: contactData.main_contact,
            alt_contact: contactData.alt_contact
        };

        console.log (`New data ${JSON.stringify(updateData)}`)

        // Act
        const { body } = await updateMemberData(
            operatorToken,
            xmi,
            updateData
        );

        // Assert
        validateMemberStructure(body, xmi);

        // Verify the new contacts were applied 
        expect(body.main_contact.first_name).toBe(contactData.main_contact.first_name);
        expect(body.main_contact.last_name).toBe(contactData.main_contact.last_name);
        expect(body.main_contact.email).toBe(contactData.main_contact.email);
        expect(body.main_contact.phone).toBe(contactData.main_contact.phone);

        expect(body.alt_contact.first_name).toBe(contactData.alt_contact.first_name);
        expect(body.alt_contact.last_name).toBe(contactData.alt_contact.last_name);
        expect(body.alt_contact.email).toBe(contactData.alt_contact.email);
        expect(body.alt_contact.phone).toBe(contactData.alt_contact.phone);

        // Verify other member data was updated
        expect(body.name).toBe(memberData.name);
        expect(body.branch_name).toBe(memberData.branch_name);
        expect(body.tax_ref).toBe(memberData.tax_ref);
        expect(body.address).toBe(memberData.address);
    });

    test("200: should update only contact information", async () => {
        // Arrange - update only contacts, keep other fields as original
        const contactData = generateContactData();
        
        const updateData = {
            ...originalData, // Keep original name, address, etc.
            main_contact: contactData.main_contact,
            alt_contact: contactData.alt_contact
        };

        // Act
        const { body } = await updateMemberData(
            operatorToken,
            xmi,
            updateData
        );
         
        console.log (`New data ${JSON.stringify(updateData)}`)
        // Assert
        validateMemberStructure(body, xmi);

        // Verify contacts were updated
        expect(body.main_contact.first_name).toBe(contactData.main_contact.first_name);
        expect(body.main_contact.email).toBe(contactData.main_contact.email);
        expect(body.alt_contact.first_name).toBe(contactData.alt_contact.first_name);
        expect(body.alt_contact.email).toBe(contactData.alt_contact.email);

        // Verify other fields remained unchanged
        expect(body.name).toBe(originalData.name);
        expect(body.branch_name).toBe(originalData.branch_name);
        expect(body.address).toBe(originalData.address);
    });
});

