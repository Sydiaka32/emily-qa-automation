import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";

export function createRtgsFictPayload(options: {
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
    remittanceInformation = "API Test - FICT RTGS Domestic Currency",
  } = options;

  const txId = `TEST-FICT-RTGS-${Date.now()}`;
  const endToEndId = `E2E-RTGS-${Date.now()}`;
  const requestedExecutionDate = new Date().toISOString().split("T")[0];

  return {
    tx_id: txId,
    transfer_type: CreditTransferSubTypes.fict,
    settlement_type: SettlementTypes.rtgs,
    creditor_currency: domesticCurrency,
    end_to_end_id: endToEndId,
    creditor_amount: ctAmount,
    remittance_information: remittanceInformation,
    creditor_xmi: receiverXmi,
    requested_execution_date: requestedExecutionDate,
    debtor: {
      name: debtorName,
      fi_identifier: {
        type: "xmi",
        xmi: memberXmi,
      },
      postal_address: {
        country_code: "SA",
      },
      account_identifier: {
        type: "iban",
        iban: "CD111111111111111111111111111111",
      },
    },
    creditor: {
      name: creditorName,
      fi_identifier: {
        type: "xmi",
        xmi: receiverXmi,
      },
      postal_address: {
        country_code: "BR",
      },
      account_identifier: {
        type: "other",
        identifier: "CD111111111111111111111111111111",
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
