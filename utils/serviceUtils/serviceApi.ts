import { request } from "@playwright/test";
import { config } from "../../test.config";
import { Service, ServiceCode } from "./serviceTypes";
import { createApiRequestContext } from "@utils/apiUtils/requestContext";

function createApiRequestContextOptions(
    token?: string,
    baseUrl: string = config.backofficeBaseUrl, // Use backofficeBaseUrl as default
    extraHeaders: Record<string, string> = {},
) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extraHeaders
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return {
        baseURL: baseUrl,
        extraHTTPHeaders: headers,
    };
}

// Used in Member Portal to get services of the current member
export async function getCurrentMemberServices(
    memberXmi: string,
    token: string,
): Promise<Service[]> {
    const apiRequestContext = await createApiRequestContext(
        token,
        config.apiBaseUrl,
        {
            "Content-Type": "application/json",
        },
    );
    const response = await apiRequestContext.get(
        `/api/v1/core/services`,
    );
    return await response.json();
}

export async function getMemberServices(
    memberXmi: string,
    operatorToken: string,
): Promise<Service[]> {
    const apiRequestContext = await request.newContext(
        createApiRequestContextOptions(operatorToken)
    );

    const response = await apiRequestContext.get(
        `/api/v1/core-admin/members/${memberXmi}/services`,
    );
    return await response.json();
}

/**
 * Generic function to enable a service for a member
 * @param memberXmi - Member identifier
 * @param operatorToken - Operator authentication token
 * @param serviceCode - Service code to enable (trd, lp, clr, ct, sm)
 */
export async function enableService(
    memberXmi: string,
    operatorToken: string,
    serviceCode: ServiceCode,
) {
    const apiRequestContext = await request.newContext(
        createApiRequestContextOptions(operatorToken)
    );

    return await apiRequestContext.post(
        `/api/v1/core-admin/members/${memberXmi}/services/${serviceCode}/assign`,
    );
}

/**
 * Generic function to disable a service for a member
 * @param memberXmi - Member identifier
 * @param operatorToken - Operator authentication token
 * @param serviceCode - Service code to disable (trd, lp, clr, ct, sm)
 */
export async function disableService(
    memberXmi: string,
    operatorToken: string,
    serviceCode: ServiceCode,
) {
    const apiRequestContext = await request.newContext(
        createApiRequestContextOptions(operatorToken)
    );

    // Handle the special case for trader service which uses 'remove' instead of 'unassign'
    //const action = serviceCode === ServiceCodes.TRADER ? 'remove' : 'unassign';

    return await apiRequestContext.post(
        `/api/v1/core-admin/members/${memberXmi}/services/${serviceCode}/remove`,
    );
}
