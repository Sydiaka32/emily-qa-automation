import { putRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { MemberResponse } from "modules/core/memberResponse";

export interface UpdateMemberRequest {
  name: string;
  branch_name: string;
  tax_ref: string;
  address: string;
  country_code: string;
  main_contact: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  alt_contact: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  region_code?: string;
}

export async function updateMemberData(
  token: string,
  xmi: string,
  updateData: UpdateMemberRequest
): Promise<{ response: any; body: MemberResponse }> {
  const { response, body } = await putRequest(
    `/api/v1/core-admin/members/${xmi}`,    
    token,
    config.backofficeBaseUrl,
    updateData
  );

  if (response.status() !== 200) {
    throw new Error(
      `Update member by XMI failed with status ${response.status()}: ${JSON.stringify(body)}`
    );
  }
  
  return { response, body };
}