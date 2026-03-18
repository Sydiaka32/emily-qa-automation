import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndValidateCct } from "@utils/creditTransferService/creditTransfer/createAndValidateCct";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";
import { getTomorrowDate } from "../../../data/generators";
import { config } from "../../../test.config";
import { PendingCTData } from "../../../modules/creditTransfer/pendingCtData";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";

/**
 * Create a CT in Pending status with future execution date
 */
export async function createPendingCT(
  remittanceInfo: string = "API Test - CCT Pending",
): Promise<PendingCTData> {
  console.log("Creating pending CT...");

  // 1. Get tokens and basic data
  const senderToken = await getAccessToken(config.memberName, config.password);
  const operatorToken = await getOperatorToken(
    config.operatorName,
    config.password,
  );

  const memberInfo = await getCurrentMember(senderToken);

  // 2. Calculate CCT amount
  const { ctAmount, domesticCurrency } = await calculateCtAmount(
    memberInfo,
    operatorToken,
    senderToken,
  );

  // 3. Generate CCT payload with future date
  const futureDate = getTomorrowDate();
  const cctPayload = createCctPayload({
    domesticCurrency,
    ctAmount,
    memberXmi: config.memberXmi,
    receiverXmi: config.receiverXmi,
    debtorName: "Test Debtor Bank",
    creditorName: "Test Creditor Bank",
    remittanceInformation: remittanceInfo,
    requestedExecutionDate: futureDate,
  });

  console.log(
    "CCT Payload for Pending CT:",
    JSON.stringify(cctPayload, null, 2),
  );
  console.log(`Using future execution date: ${futureDate}`);

  // 4. Create and validate CCT
  const { validationId } = await createAndValidateCct(cctPayload, senderToken);

  // 5. Approve CCT
  const { referenceId } = await approveCreditTransfer(
    validationId,
    senderToken,
  );

  // 6. Verify CCT in sender's history is Pending
  const senderTransaction = await verifyDnsCreditTransferInHistory(
    referenceId,
    senderToken,
    {
      ctAmount,
      domesticCurrency,
      debtorXmi: config.memberXmi,
      creditorXmi: config.receiverXmi,
    },
    CreditTransferStatuses.pending,
  );

  console.log(`CT created with status: ${senderTransaction.status}`);

  return {
    referenceId,
    ctAmount,
    domesticCurrency,
    senderToken,
    memberInfo,
  };
}
