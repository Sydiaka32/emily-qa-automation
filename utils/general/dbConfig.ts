import { DatabaseConfig } from "./dbClient";

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Extract from your pgweb URL pattern: https://pgweb.{env}.{project_name}.tech/#
  // And other connection details

  // For now, let's assume these come from environment variables or config
  // You'll need to adjust this based on your actual setup
  return {
    host: `xa-ledger-cluster-rw.dev.emily.tech`,
    port: parseInt("5432"),
    database: "xa_ledger",
    user: "emily",
    password:
      "OqODtCcjwnpXjpijFLkMT4kyNbgPxyr7mo1gJyRcmr2AD3ebFZK8CL22GBXz2j3w",
    ssl: false,
  };
}
