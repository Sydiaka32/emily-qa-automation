import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndValidateCct } from "@utils/creditTransferService/creditTransfer/createAndValidateCct";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";
import { config } from "../../../test.config";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { CompletedTransactionResult } from "../../../modules/creditTransfer/completedTransactionResult";

export async function createCompletedCctTransaction(options?: {
  senderName?: string;
  receiverName?: string;
  customPayload?: Partial<Parameters<typeof createCctPayload>[0]>;
  remittanceInformation?: string;
}): Promise<CompletedTransactionResult> {
  console.log("Creating completed CCT transaction...");

  // Use provided names or defaults from config
  const senderName = options?.senderName || config.memberName;
  const receiverName = options?.receiverName || config.receiverName;
  const remittanceInfo =
    options?.remittanceInformation || "API Test - CCT Domestic Currency";

  // 1. Get tokens and basic data
  const senderToken = await getAccessToken(senderName, config.password);
  const operatorToken = await getOperatorToken(
    config.operatorName,
    config.password,
  );
  const receiverToken = await getAccessToken(receiverName, config.password);

  const memberInfo = await getCurrentMember(senderToken);

  // 2. Calculate CCT amount
  const { ctAmount, domesticCurrency } = await calculateCtAmount(
    memberInfo,
    operatorToken,
    senderToken,
  );

  // 3. Generate CCT payload with optional overrides
  const basePayload = {
    domesticCurrency,
    ctAmount,
    memberXmi: config.memberXmi,
    receiverXmi: config.receiverXmi,
    debtorName: "Test Debtor Bank",
    creditorName: "Test Creditor Bank",
    remittanceInformation: remittanceInfo,
  };

  const cctPayload = createCctPayload({
    ...basePayload,
    ...options?.customPayload,
  });

  console.log("CCT Payload:", JSON.stringify(cctPayload, null, 2));

  // 4. Create and validate CCT
  const { validationId } = await createAndValidateCct(cctPayload, senderToken);

  // 5. Approve CCT
  const { referenceId } = await approveCreditTransfer(
    validationId,
    senderToken,
  );

  // 6. Verify CCT in sender's history
  const senderTransaction = await verifyDnsCreditTransferInHistory(
    referenceId,
    senderToken,
    {
      ctAmount,
      domesticCurrency,
      debtorXmi: config.memberXmi,
      creditorXmi: config.receiverXmi,
    },
    CreditTransferStatuses.completed,
  );

  // 7. Verify CCT in receiver's history
  const receiverTransaction = await verifyDnsCreditTransferInHistory(
    referenceId,
    receiverToken,
    {
      ctAmount,
      domesticCurrency,
      debtorXmi: config.memberXmi,
      creditorXmi: config.receiverXmi,
    },
    CreditTransferStatuses.completed,
  );

  // 8. Final assertions
  if (senderTransaction.status !== CreditTransferStatuses.completed) {
    throw new Error(
      `Sender transaction status is ${senderTransaction.status}, expected ${CreditTransferStatuses.completed}`,
    );
  }

  if (receiverTransaction.status !== CreditTransferStatuses.completed) {
    throw new Error(
      `Receiver transaction status is ${receiverTransaction.status}, expected ${CreditTransferStatuses.completed}`,
    );
  }

  console.log(
    `Completed CCT transaction created successfully. Reference ID: ${referenceId}`,
  );

  return {
    referenceId,
    ctAmount,
    domesticCurrency,
    senderTransaction,
    receiverTransaction,
    senderToken,
    receiverToken,
    operatorToken,
  };
}
