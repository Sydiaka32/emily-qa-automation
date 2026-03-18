import { getRecalls } from "./getRecalls";

/**
 * Find recall by clr_sys_ref (which is the CT reference_id)
 */
export async function findRecallByClrSysRef(
  clrSysRef: string,
  token: string,
  maxAttempts: number = 10,
  delayMs: number = 500,
): Promise<any> {
  console.log(`Looking for recall with clr_sys_ref: ${clrSysRef}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { body } = await getRecalls(token);

      if (body.content && body.content.length > 0) {
        const recall = body.content.find(
          (r: any) => r.clr_sys_ref === clrSysRef,
        );

        if (recall) {
          console.log(
            `Recall found in list (attempt ${attempt}/${maxAttempts})`,
          );
          return recall;
        }
      }

      console.log(
        `Attempt ${attempt}/${maxAttempts} - Recall not found yet...`,
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Recall with clr_sys_ref ${clrSysRef} not found in list after ${maxAttempts} attempts`,
  );
}
