import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { createRtgsCctPayload } from "@utils/creditTransferService/creditTransfer/createRtgsCctPayload";
import { createAndValidateRtgsCct } from "@utils/creditTransferService/creditTransfer/createAndValidateRtgsCct";
import { verifyRtgsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyRtgsCreditTransferHistory";
import { config } from "../../../test.config";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { SettledTransactionResult } from "../../../modules/creditTransfer/settledTransactionResult";

export async function createSettledRtgsTransaction(options?: {
  senderName?: string;
  receiverName?: string;
  customPayload?: Partial<Parameters<typeof createRtgsCctPayload>[0]>;
  remittanceInformation?: string;
}): Promise<SettledTransactionResult> {
  console.log("Creating settled RTGS transaction...");

  // Use provided names or defaults from config
  const senderName = options?.senderName || config.memberName;
  const receiverName = options?.receiverName || config.receiverName;
  const remittanceInfo =
    options?.remittanceInformation || "API Test - RTGS Domestic Currency";

  // 1. Get tokens and basic data
  const senderToken = await getAccessToken(senderName, config.password);
  const operatorToken = await getOperatorToken(
    config.operatorName,
    config.password,
  );
  const receiverToken = await getAccessToken(receiverName, config.password);

  const memberInfo = await getCurrentMember(senderToken);

  // 2. Calculate RTGS amount
  const { ctAmount, domesticCurrency } = await calculateCtAmount(
    memberInfo,
    operatorToken,
    senderToken,
  );

  // 3. Generate RTGS payload with optional overrides
  const basePayload = {
    domesticCurrency,
    ctAmount,
    memberXmi: config.memberXmi,
    receiverXmi: config.receiverXmi,
    debtorName: "Test Debtor Bank",
    creditorName: "Test Creditor Bank",
    remittanceInformation: remittanceInfo,
  };

  const rtgsPayload = createRtgsCctPayload({
    ...basePayload,
    ...options?.customPayload,
  });

  console.log("RTGS Payload:", JSON.stringify(rtgsPayload, null, 2));

  // 4. Create and validate RTGS
  const { validationId } = await createAndValidateRtgsCct(
    rtgsPayload,
    senderToken,
  );

  // 5. Approve RTGS
  const { referenceId } = await approveCreditTransfer(
    validationId,
    senderToken,
  );

  // 6. Verify RTGS in sender's history
  const senderTransaction = await verifyRtgsCreditTransferInHistory(
    referenceId,
    senderToken,
    {
      ctAmount,
      domesticCurrency,
      debtorXmi: config.memberXmi,
      creditorXmi: config.receiverXmi,
    },
    CreditTransferStatuses.settled,
  );

  // 7. Verify RTGS in receiver's history
  const receiverTransaction = await verifyRtgsCreditTransferInHistory(
    referenceId,
    receiverToken,
    {
      ctAmount,
      domesticCurrency,
      debtorXmi: config.memberXmi,
      creditorXmi: config.receiverXmi,
    },
    CreditTransferStatuses.settled,
  );

  // 8. Final assertions
  if (senderTransaction.status !== CreditTransferStatuses.settled) {
    throw new Error(
      `Sender transaction status is ${senderTransaction.status}, expected ${CreditTransferStatuses.settled}`,
    );
  }

  if (receiverTransaction.status !== CreditTransferStatuses.settled) {
    throw new Error(
      `Receiver transaction status is ${receiverTransaction.status}, expected ${CreditTransferStatuses.settled}`,
    );
  }

  console.log(
    `Settled RTGS transaction created successfully. Reference ID: ${referenceId}`,
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
