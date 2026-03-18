import { putRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { Contact } from "modules/core/contact";
import { MemberResponse } from "modules/core/memberResponse";

export interface UpdateContactsRequest {
  main_contact: Contact;
  alt_contact: Contact;
}

export async function updateMemberContacts(
  token: string,
  contactsData: UpdateContactsRequest | string
): Promise< {response: any; body: MemberResponse}> {
  const { response, body } = await putRequest(
    "/api/v1/core/members/current/contacts",
    token,
    config.apiBaseUrl, 
    contactsData
  );

  if (response.status() !== 200) {
    throw new Error(
      `Update member contacts failed with status ${response.status()}: ${JSON.stringify(body)}`
    );
  }
  
   return { response, body };
}