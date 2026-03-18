import "dotenv/config";

export const config = {
  apiBaseUrl: process.env.API_BASE_URL!,
  backofficeBaseUrl: process.env.BACKOFFICE_BASE_URL!,
  authBoUrl: process.env.AUTH_BOT_URL!,
  devUrl: process.env.DEV_URL!,

  // Keycloack
  authMPUrl: process.env.KEYCLOAK_MP_URL!,
  keycloackLogin: process.env.KEYCLOACK_MP_LOGIN!,
  keycloackPwd: process.env.KEYCLOACK_MP_PWD!,

  // Member credentials
  memberName: process.env.MEMBERNAME!,
  password: process.env.PASSWORD!,
  takerName: process.env.TAKERNAME!,
  makerName: process.env.MAKER_NAME!,
  makerXmi: process.env.MAKER_XMI!,
  clMemberXmi: process.env.CL_MEMBER_XMI!,
  clMemberName: process.env.CL_MEMBER_NAME!,
  indirectMemberXmi: process.env.INDIRECT_MEMBER_XMI!,
  indirectMemberName: process.env.INDIRECT_MEMBER_NAME!,

  // Operator credentials for  service management
  operatorName: process.env.OPERATOR_NAME!,

  // Member ID
  memberXmi: process.env.MEMBER_XMI!,
  setMemberXmi: process.env.SET_MEMBER_XMI!,
  publicBaseUrl: process.env.PUBLIC_BASE_URL!,
  publicApiKey: process.env.PUBLIC_API_KEY!,

  receiverName: process.env.RECEIVER_NAME!,
  receiverXmi: process.env.RECEIVER_XMI!,

  // DB ledger
  dbHostLedger: process.env.DB_HOST_LEDGER!,
  dbPort: process.env.DB_PORT!,
  dbNameLedger: process.env.DB_NAME_LEDGER!,
  dbUsernameLedger: process.env.DB_USERNAME_LEDGER!,
  dbPasswordLedger: process.env.DB_PASSWORD_LEDGER!,
  networkAsset: process.env.NETWORK_ASSET!,
  custodianAsset: process.env.CUSTODIAN_ASSET!,

  //Messaging
  senderMemberIso: process.env.SENDER_MEMBER_ISO!,
  receiverClearingIso: process.env.RECEIVER_CLEARING_ISO!,
  receiverMemberIso: process.env.RECEIVER_MEMBER_ISO!,
};
