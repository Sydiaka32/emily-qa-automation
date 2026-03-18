import {
  generateEndToEndId,
  generateRealisticIBAN,
  generateTxId,
  getCurrentDate,
} from "../../../data/generators";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";

export function createStpPayload(options: {
  domesticCurrency: string;
  ctAmount: number;
  memberXmi: string;
  receiverXmi: string;
  debtorName?: string;
  creditorName?: string;
  remittanceInformation?: string;
}): any {
  const {
    domesticCurrency,
    ctAmount,
    memberXmi,
    receiverXmi,
    debtorName = "Test Debtor Bank",
    creditorName = "Test Creditor Bank",
    remittanceInformation = "API Test - STP Domestic Currency",
  } = options;

  const txId = generateTxId();
  const endToEndId = generateEndToEndId();
  const requestedExecutionDate = getCurrentDate();

  // Generate unique IBANs and identifiers
  const debtorIBAN = generateRealisticIBAN("AR");
  const creditorIdentifier = generateRealisticIBAN("HR");

  return {
    tx_id: txId,
    transfer_type: CreditTransferSubTypes.stp,
    settlement_type: SettlementTypes.dns,
    creditor_currency: domesticCurrency,
    end_to_end_id: endToEndId,
    creditor_amount: ctAmount,
    remittance_information: remittanceInformation,
    creditor_xmi: receiverXmi,
    requested_execution_date: requestedExecutionDate,
    debtor: {
      name: debtorName,
      postal_address: {
        country_code: "AR",
      },
      account_identifier: {
        type: "iban",
        iban: debtorIBAN,
      },
    },
    creditor: {
      name: creditorName,
      postal_address: {
        country_code: "HR",
      },
      account_identifier: {
        type: "other",
        identifier: creditorIdentifier,
      },
    },
    debtor_agent: {
      agent_identifier: {
        type: "xmi",
        xmi: memberXmi,
      },
    },
    creditor_agent: {
      agent_identifier: {
        type: "xmi",
        xmi: receiverXmi,
      },
    },
  };
}
