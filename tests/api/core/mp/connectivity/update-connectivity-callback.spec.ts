import { test, expect } from "@playwright/test";
import { config } from "../../../../../test.config";
import { getRequest, putRequest} from "@utils/apiUtils";
import { getAccessToken } from "@utils/auth";
import { expectErrorResponseStructure } from "@utils/general/expectErrorResponseStructure";



test.describe("Member connectivity - update callback", () => {
  const connectivity_endpoint = "/api/v1/core/connectivity";
  const update_url_endpoint= "/api/v1/core/connectivity/url";
  const { memberName: username, password , apiBaseUrl} = config;

  let accessToken: string;
  let originalCallbackUrl: string;

   // Helper functions
  const getCurrentCallbackUrl = async (): Promise<string> => {
    const { response, body } = await getRequest(connectivity_endpoint, accessToken);
    expect(response.status()).toBe(200);
    return body.callback_url;
  };

  const updateCallbackUrl = async (url: string): Promise<any> => {
    return await putRequest(update_url_endpoint, accessToken, apiBaseUrl, { url });
  };

  const restoreOriginalCallbackUrl = async (): Promise<void> => {
    if (!originalCallbackUrl) return;

    const { response } = await updateCallbackUrl(originalCallbackUrl);
    
    if (response.status() !== 200) {
      throw new Error(`Failed to restore callback URL: ${response.status()}`);
    }

    // Verify restoration   
    const currentUrl = await getCurrentCallbackUrl();
    expect(currentUrl).toBe(originalCallbackUrl);
  };


  test.beforeAll(async () => {
    accessToken = await getAccessToken(username, password);
  });

  test.beforeEach(async () => {
     // Capture the current callback URL before each test
    originalCallbackUrl = await getCurrentCallbackUrl();
    console.log(originalCallbackUrl)   
  });

   test.afterEach(async () => {
    await restoreOriginalCallbackUrl();
  });

  // Tests must run sequentially because they modify shared state (callback URL)
  // and depend on clean setup/teardown between tests
  test.describe.configure({ mode: 'serial' });

  test("200: PUT /connectivity/url - should update URL", async () => {
    const validUrl = `https://iso-emulator.dev.emily.tech/iso/message11/${config.memberXmi}`;
    const payload = { url: validUrl };

    const { response, body, error } = await updateCallbackUrl(validUrl);

    if (error) console.log("Error (non-critical):", error);

    expect(response.status(), "Should return 200 OK").toBe(200);
   // Verify the URL was actually updated
    const currentUrl = await getCurrentCallbackUrl();
    console.log(`Current URL ${currentUrl}`)
    console.log(`Valid URL ${validUrl}`)
    expect(currentUrl).toBe(validUrl);


    if (Object.keys(body).length === 0 && !error) {
      console.log("Empty response is acceptable for PUT operations");
    }
  });

  test("400: PUT /connectivity/url - should handle invalid URL format with 400", async () => {
    const invalidUrl = "not-a-valid-url";
    const { response, body } = await updateCallbackUrl(invalidUrl);

    expect(response.status(), "Should return 400 for invalid URL").toBe(400);
    expectErrorResponseStructure(body);
    expect(Array.isArray(body.fieldErrors)).toBe(true);

    const urlFieldError = body.fieldErrors.find((err: any) => err.field === "url");
    if (urlFieldError) {
      expect(urlFieldError).toHaveProperty("code");
      expect(urlFieldError).toHaveProperty("message");
    }
  });

  test("400: PUT /connectivity/url - should handle empty URL", async () => {
    const { response, body } = await updateCallbackUrl("");

    expect(response.status()).toBe(400);
    expectErrorResponseStructure(body);
    
  });
});
