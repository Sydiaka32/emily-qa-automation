import { getYesterdayDate } from "./getYesterdayDate";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";

/**
 * Generate reconciliation report filename
 * Format: DRC_X_{memberXmi}_{date}_{asset}_{settlementType}.txt
 */
export function generateReconciliationReportFilename(
  memberXmi: string,
  asset: string,
  settlementType: string = SettlementTypes.dns,
): string {
  const date = getYesterdayDate();
  const filename = `DRC_X_${memberXmi}_${date}_${asset}_${settlementType}.txt`;
  console.log(`Generated report filename: ${filename}`);
  return filename;
}
