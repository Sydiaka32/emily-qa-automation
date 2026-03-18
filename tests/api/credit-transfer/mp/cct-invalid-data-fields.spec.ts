import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndValidateCct } from "@utils/creditTransferService/creditTransfer/createAndValidateCct";

test.describe("Credit Transfer - Invalid Data Fields", () => {
  let senderToken: string;
  let operatorToken: string;
  let memberInfo: any;
  let ctAmount: number;
  let domesticCurrency: string;

  test.beforeAll(async () => {
    console.log("Setting up test environment for invalid data fields tests...");

    // Get tokens and member info
    senderToken = await getAccessToken(config.memberName, config.password);
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    memberInfo = await getCurrentMember(senderToken);

    // Calculate dynamic CCT amount that respects business rules
    const amountData = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );
    ctAmount = amountData.ctAmount;
    domesticCurrency = amountData.domesticCurrency;

    console.log(
      `Test setup completed. Using dynamic amount: ${ctAmount} ${domesticCurrency}`,
    );
  });

  test("CT with tx_id longer than 35 characters should fail", async () => {
    console.log("Testing CT with tx_id longer than 35 characters...");

    // Generate a tx_id with 36 characters (exceeds 35 character limit)
    const invalidTxId = "a".repeat(36);

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with invalid tx_id
    const invalidPayload = {
      ...basePayload,
      tx_id: invalidTxId,
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Tx_id length: ${invalidTxId.length} characters (exceeds 35 character limit)`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log("CT with long tx_id correctly failed validation");
  });

  test("CT with incorrect debtor agent XMI format should fail", async () => {
    console.log("Testing CT with incorrect debtor agent XMI format...");

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with invalid debtor agent XMI (doesn't match expected XMI pattern)
    const invalidPayload = {
      ...basePayload,
      debtor_agent: {
        agent_identifier: {
          type: "xmi",
          xmi: "INVALID_XMI_FORMAT_123", // Invalid XMI format
        },
      },
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Invalid debtor agent XMI: ${invalidPayload.debtor_agent.agent_identifier.xmi}`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log("CT with invalid debtor agent XMI correctly failed validation");
  });

  test("CT with incorrect creditor agent XMI format should fail", async () => {
    console.log("Testing CT with incorrect creditor agent XMI format...");

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with invalid creditor agent XMI
    const invalidPayload = {
      ...basePayload,
      creditor_agent: {
        agent_identifier: {
          type: "xmi",
          xmi: "TOO_SHORT", // Invalid XMI format (too short)
        },
      },
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Invalid creditor agent XMI: ${invalidPayload.creditor_agent.agent_identifier.xmi}`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log(
      "CT with invalid creditor agent XMI correctly failed validation",
    );
  });

  test("CT with incorrect debtor account number should fail", async () => {
    console.log("Testing CT with incorrect debtor account number...");

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with invalid debtor account number
    const invalidPayload = {
      ...basePayload,
      debtor: {
        ...basePayload.debtor,
        account_identifier: {
          type: "iban",
          iban: "INVALID_IBAN_FORMAT_12345", // Invalid IBAN format
        },
      },
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Invalid debtor IBAN: ${invalidPayload.debtor.account_identifier.iban}`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log(
      "CT with invalid debtor account number correctly failed validation",
    );
  });

  test("CT with incorrect creditor account number should fail", async () => {
    console.log("Testing CT with incorrect creditor account number...");

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with invalid creditor account number
    const invalidPayload = {
      ...basePayload,
      creditor: {
        ...basePayload.creditor,
        account_identifier: {
          type: "other",
          identifier: "", // Empty identifier (invalid)
        },
      },
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Invalid creditor account identifier: "${invalidPayload.creditor.account_identifier.identifier}" (empty)`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log(
      "CT with invalid creditor account number correctly failed validation",
    );
  });

  test("CT with remittance information longer than 140 characters should fail", async () => {
    console.log(
      "Testing CT with remittance information longer than 140 characters...",
    );

    // Generate remittance information with 141 characters (exceeds 140 character limit)
    const longRemittanceInfo =
      "This remittance information is way too long and exceeds the maximum allowed length of 140 characters by having exactly 141 characters in total.";

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with long remittance information
    const invalidPayload = {
      ...basePayload,
      remittance_information: longRemittanceInfo,
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Remittance info length: ${longRemittanceInfo.length} characters (exceeds 140 character limit)`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log(
      "CT with long remittance information correctly failed validation",
    );
  });

  test("CT with multiple invalid fields should fail", async () => {
    console.log("Testing CT with multiple invalid fields...");

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with multiple invalid fields
    const invalidPayload = {
      ...basePayload,
      tx_id: "a".repeat(36), // Invalid: too long (36 characters)
      debtor_agent: {
        agent_identifier: {
          type: "xmi",
          xmi: "INVALID_DEBTOR_XMI", // Invalid: wrong format
        },
      },
      creditor_agent: {
        agent_identifier: {
          type: "xmi",
          xmi: "INVALID_CREDITOR_XMI", // Invalid: wrong format
        },
      },
      remittance_information: "B".repeat(141), // Invalid: too long (141 characters)
    };

    console.log(
      "Invalid Payload with multiple errors:",
      JSON.stringify(invalidPayload, null, 2),
    );
    console.log("Multiple invalid fields:");
    console.log(`- Tx_id length: ${invalidPayload.tx_id.length} characters`);
    console.log(
      `- Debtor agent XMI: ${invalidPayload.debtor_agent.agent_identifier.xmi}`,
    );
    console.log(
      `- Creditor agent XMI: ${invalidPayload.creditor_agent.agent_identifier.xmi}`,
    );
    console.log(
      `- Remittance info length: ${invalidPayload.remittance_information.length} characters`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log("CT with multiple invalid fields correctly failed validation");
  });

  test("CT with extremely long remittance information should fail", async () => {
    console.log("Testing CT with extremely long remittance information...");

    // Generate remittance information with 500 characters (way over the limit)
    const extremelyLongRemittanceInfo = "X".repeat(500);

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with extremely long remittance information
    const invalidPayload = {
      ...basePayload,
      remittance_information: extremelyLongRemittanceInfo,
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(
      `Remittance info length: ${extremelyLongRemittanceInfo.length} characters (significantly exceeds 140 character limit)`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log(
      "CT with extremely long remittance information correctly failed validation",
    );
  });

  test("CT with special characters in invalid fields should fail", async () => {
    console.log("Testing CT with special characters in invalid fields...");

    // Create base payload with valid dynamic data
    const basePayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    // Modify the payload with special characters in invalid fields
    const invalidPayload = {
      ...basePayload,
      tx_id: "tx_id_with_special_chars!@#$%^&*()", // Invalid: contains special characters
      debtor_agent: {
        agent_identifier: {
          type: "xmi",
          xmi: "XMI_WITH_SPECIAL!@#", // Invalid: contains special characters
        },
      },
    };

    console.log("Invalid Payload:", JSON.stringify(invalidPayload, null, 2));
    console.log(`Tx_id with special chars: ${invalidPayload.tx_id}`);
    console.log(
      `Debtor agent XMI with special chars: ${invalidPayload.debtor_agent.agent_identifier.xmi}`,
    );

    // Attempt to create CCT and expect it to fail
    await expect(
      createAndValidateCct(invalidPayload, senderToken),
    ).rejects.toThrow();

    console.log(
      "CT with special characters in invalid fields correctly failed validation",
    );
  });
});

console.log("All invalid data field tests completed successfully!");
