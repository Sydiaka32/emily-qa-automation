import test, { expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { verifyContactData } from "@utils/coreService/members/verifyContactdata";
import { validateMemberStructure } from "@utils/coreService/members/verifyMemberStructure";
import { config } from "../../../../../test.config";
import { expectErrorResponseStructure } from "@utils/general/expectErrorResponseStructure";
import { generateContactData } from "data/generators";
import {  putRequest } from "@utils/apiUtils";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { updateMemberContacts } from "@utils/coreService/members/updateMemberContacts";


test.describe("Member profile - Update contact", () => {
  const update_memmber_url = "/api/v1/core/members/current/contacts";
  const { memberName: username, password: password, memberXmi: expected_xmi, apiBaseUrl } = config;

  let accessToken: string;
  let originalContactData: any; // Store original contacts

  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
  });


  test.beforeEach(async () => {
    // Get and store original contact data before each test
    const memeberResponse = await getCurrentMember(accessToken)


    // Store only the contact parts we need to restore
    originalContactData = {
      main_contact: { ...memeberResponse.main_contact },
      alt_contact: { ...memeberResponse.alt_contact }
    };

  });

  test.afterEach(async () => {
    if (!originalContactData) return;

    try {
      // Restore original data
      const restoreResponse = await updateMemberContacts(
        accessToken,
        originalContactData
      );

      // Verify restoration was successful
      const verifyBody = await getCurrentMember(accessToken)


      const isRestored =
        verifyBody.main_contact.first_name === originalContactData.main_contact.first_name &&
        verifyBody.main_contact.last_name === originalContactData.main_contact.last_name;

      if (isRestored) {
        console.log(" Contacts verified and restored successfully");
      } else {
        console.log("Contacts restored but verification failed");
      }

    } catch (error) {
      console.log(" Contact restoration failed:", error);
      // Don't throw to avoid masking the actual test failure
    }
  });

  test("200: should update contacts and return complete member data", async () => {

    // Arrange
    const contactData = generateContactData();

    // Act
    const { body } = await updateMemberContacts(
      accessToken,
      contactData
    );

    // Assert

    validateMemberStructure(body, expected_xmi);

    // Verify the new contacts were applied 
    verifyContactData(body.main_contact, contactData.main_contact, "main_contact");
    verifyContactData(body.alt_contact, contactData.alt_contact, "alt_contact");

  });


  test("400: should fail when contact data is invalid", async () => {
    const invalidData = {
      main_contact: {
        first_name: "", last_name: "", phone: "+553007277836", email: "julia.l@emily.tech"
      },
      alt_contact: {

        first_name: "João", last_name: "Akhman", phone: "+", email: "julia.l@emily.tech"
      }
    };

    const { response, body } = await putRequest(update_memmber_url, accessToken,apiBaseUrl, invalidData);
    expect(response.status()).toBe(400);
    expectErrorResponseStructure(body);
  });

})