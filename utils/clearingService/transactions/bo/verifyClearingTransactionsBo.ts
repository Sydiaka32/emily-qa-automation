import { Transaction } from "../../../../modules/clearing/transaction";
import { expect } from "@playwright/test";

/**
 * Verify clearing transactions structure for Back Office
 */
export function verifyClearingTransactionsBo(
  transactions: Transaction[],
): void {
  console.log(`Verifying ${transactions.length} clearing transactions...`);

  transactions.forEach((transaction, index) => {
    console.log(`  Transaction ${index + 1}: ${transaction.reference_id}`);

    // Required fields
    expect(transaction.reference_id).toBeDefined();
    expect(typeof transaction.reference_id).toBe("string");
    expect(transaction.reference_id.length).toBeGreaterThan(0);

    expect(transaction.type).toBeDefined();
    expect(typeof transaction.type).toBe("string");

    expect(transaction.status).toBeDefined();
    expect(typeof transaction.status).toBe("string");

    expect(transaction.debtor).toBeDefined();
    expect(transaction.debtor.xmi).toBeDefined();
    expect(transaction.debtor.name).toBeDefined();

    expect(transaction.creditor).toBeDefined();
    expect(transaction.creditor.xmi).toBeDefined();
    expect(transaction.creditor.name).toBeDefined();

    expect(transaction.amount).toBeDefined();
    expect(typeof transaction.amount).toBe("number");

    expect(transaction.currency).toBeDefined();
    expect(typeof transaction.currency).toBe("string");

    // Optional fields (should be defined but can be null/empty)
    expect(transaction.note).toBeDefined(); // can be null or string

    // Timestamps
    expect(transaction.created_at).toBeDefined();
    expect(typeof transaction.created_at).toBe("string");

    expect(transaction.updated_at).toBeDefined();
    expect(typeof transaction.updated_at).toBe("string");

    // These can be null for pending transactions
    if (transaction.completed_at) {
      expect(typeof transaction.completed_at).toBe("string");
    }

    if (transaction.settled_at) {
      expect(typeof transaction.settled_at).toBe("string");
    }

    // Settlement type
    if (transaction.settlement_type) {
      expect(typeof transaction.settlement_type).toBe("string");
    }

    // Additional BO-specific checks
    console.log(`    Type: ${transaction.type}, Status: ${transaction.status}`);
    console.log(
      `    Debtor: ${transaction.debtor.xmi}, Creditor: ${transaction.creditor.xmi}`,
    );
    console.log(`    Amount: ${transaction.amount} ${transaction.currency}`);
  });

  console.log("All clearing transactions verified");
}
