import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferSubTypes } from "../../../consts/credit-transfer/creditTransferSubTypes";

export function createFictPayload(options: {
  domesticCurrency: string;
  ctAmount: number;
  memberXmi: string;
  receiverXmi: string;
}): any {
  const { domesticCurrency, ctAmount, memberXmi, receiverXmi } = options;

  return {
    tx_id: `TEST-FICT-${Date.now()}`,
    transfer_type: CreditTransferSubTypes.fict,
    settlement_type: SettlementTypes.dns,
    creditor_currency: domesticCurrency,
    end_to_end_id: `E2E-${Date.now()}`,
    creditor_amount: ctAmount,
    remittance_information: "API Test - FICT Domestic Currency",
    creditor_xmi: receiverXmi,
    requested_execution_date: new Date().toISOString().split("T")[0],
    debtor: {
      name: "Test Debtor Bank",
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
      name: "Test Creditor Bank",
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
