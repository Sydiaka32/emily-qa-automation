import {
  generateEndToEndId,
  generateRealisticIBAN,
  generateTxId,
  getCurrentDate,
} from "../../../data/generators";

/**
 * Create credit transfer payload with generated IBANs and account identifiers
 * (Maintains original signature for backward compatibility)
 */
export function createCTPayload(options: {
  creditorXmi: string;
  creditorCurrency: string;
  creditorAmount: number;
  settlementType: "DNS" | "RTGS";
  debtorXmi: string;
  debtorName?: string;
  creditorName?: string;
  remittanceInformation?: string;
}): any {
  const txId = generateTxId();
  const endToEndId = generateEndToEndId();
  const requestedExecutionDate = getCurrentDate();

  // Generate unique IBANs and identifiers for each transfer
  const debtorIBAN = generateRealisticIBAN("AR");
  const creditorIdentifier = generateRealisticIBAN("AT");

  return {
    tx_id: txId,
    transfer_type: "cct",
    settlement_type: options.settlementType,
    creditor_currency: options.creditorCurrency,
    end_to_end_id: endToEndId,
    creditor_amount: options.creditorAmount,
    remittance_information:
      options.remittanceInformation || "API Test Credit Transfer",
    creditor_xmi: options.creditorXmi,
    requested_execution_date: requestedExecutionDate,
    debtor: {
      name: options.debtorName || "Test Debtor Bank",
      postal_address: {
        country_code: "AR", // Hardcoded to match IBAN country
      },
      account_identifier: {
        type: "iban",
        iban: debtorIBAN,
      },
    },
    creditor: {
      name: options.creditorName || "Test Creditor Bank",
      postal_address: {
        country_code: "AT", // Hardcoded as before
      },
      account_identifier: {
        type: "other",
        identifier: creditorIdentifier,
      },
    },
    debtor_agent: {
      agent_identifier: {
        type: "xmi",
        xmi: options.debtorXmi,
      },
    },
    creditor_agent: {
      agent_identifier: {
        type: "xmi",
        xmi: options.creditorXmi,
      },
    },
  };
}
