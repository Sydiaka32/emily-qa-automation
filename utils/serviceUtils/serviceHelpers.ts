import { disableService, enableService } from "./serviceApi";
import { ServiceCodes } from "./serviceTypes";


export async function disableTraderService(
  memberXmi: string,
  operatorToken: string,
) {
  return disableService(memberXmi, operatorToken, ServiceCodes.TRADER);
}

export async function enableLiquidityProviderService(
  memberXmi: string,
  operatorToken: string,
) {
  return enableService(memberXmi, operatorToken, ServiceCodes.LIQUIDITY_PROVIDER);
}

export async function disableLiquidityProviderService(
  memberXmi: string,
  operatorToken: string,
) {
  return disableService(memberXmi, operatorToken, ServiceCodes.LIQUIDITY_PROVIDER);
}

export async function enableTraderService(
  memberXmi: string,
  operatorToken: string,
) {
  return enableService(memberXmi, operatorToken, ServiceCodes.TRADER);
}

export async function enableClearingService(
  memberXmi: string,
  operatorToken: string,
) {
  return enableService(memberXmi, operatorToken, ServiceCodes.CLEARING);
}

export async function enableCreditTransferService(
  memberXmi: string,
  operatorToken: string,
) {
  return enableService(memberXmi, operatorToken, ServiceCodes.CREDIT_TRANSFER);
}

export async function enableSecureMessagingService(
  memberXmi: string,
  operatorToken: string,
) {
  return enableService(memberXmi, operatorToken, ServiceCodes.SECURE_MESSAGING);
}

export async function disableClearingService(
  memberXmi: string,
  operatorToken: string,
) {
  return disableService(memberXmi, operatorToken, ServiceCodes.CLEARING);
}

export async function disableCreditTransferService(
  memberXmi: string,
  operatorToken: string,
) {
  return disableService(memberXmi, operatorToken, ServiceCodes.CREDIT_TRANSFER);
}

export async function disableSecureMessagingService(
  memberXmi: string,
  operatorToken: string,
) {
  return disableService(memberXmi, operatorToken, ServiceCodes.SECURE_MESSAGING);
}