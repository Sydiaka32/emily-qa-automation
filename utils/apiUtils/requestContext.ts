import { request } from "@playwright/test";
import { config } from "../../test.config";

export function createApiRequestContext(
    token?: string,
    baseUrl: string = config.apiBaseUrl,
    extraHeaders: Record<string, string> = {},
) {
    const headers: Record<string, string> = { ...extraHeaders };
    if (token) headers.Authorization = `Bearer ${token}`;
    return request.newContext({
        baseURL: baseUrl,
        extraHTTPHeaders: headers,
    });
}