import { Client } from "pg";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface TransactionCountResult {
  count: number;
  business_day: string;
}

/**
 * Database client for running SQL queries
 */
export class DbClient {
  private client: Client;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.client = new Client(config);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection error:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.end();
      console.log("Database disconnected");
    } catch (error) {
      console.error("Database disconnection error:", error);
    }
  }

  /**
   * Count transactions for a specific business day
   */
  async countTransactionsByBusinessDay(businessDay: string): Promise<number> {
    try {
      // Convert YYYY-MM-DD to YYYY-MM-DDT00:00:00Z format
      const businessDayRef = `${businessDay}T00:00:00Z`;

      const query = `
        SELECT COUNT(*) as count
        FROM transaction
        WHERE business_day_ref = $1
      `;

      const result = await this.client.query(query, [businessDayRef]);

      if (result.rows.length > 0) {
        return parseInt(result.rows[0].count, 10);
      }

      return 0;
    } catch (error) {
      console.error("Error counting transactions:", error);
      throw error;
    }
  }

  /**
   * Get transaction count for multiple business days
   */
  async getTransactionCountsByBusinessDays(
    businessDays: string[],
  ): Promise<TransactionCountResult[]> {
    try {
      const results: TransactionCountResult[] = [];

      for (const businessDay of businessDays) {
        const count = await this.countTransactionsByBusinessDay(businessDay);
        results.push({
          business_day: businessDay,
          count: count,
        });
      }

      return results;
    } catch (error) {
      console.error("Error getting transaction counts:", error);
      throw error;
    }
  }

  /**
   * Verify EOD cycle records match transaction count
   */
  async verifyEodCycleRecords(
    eodId: string,
    businessDay: string,
    expectedRecords: number,
  ): Promise<{
    match: boolean;
    actualCount: number;
    expectedCount: number;
    difference: number;
  }> {
    try {
      const actualCount =
        await this.countTransactionsByBusinessDay(businessDay);

      return {
        match: actualCount === expectedRecords,
        actualCount,
        expectedCount: expectedRecords,
        difference: Math.abs(actualCount - expectedRecords),
      };
    } catch (error) {
      console.error("Error verifying EOD cycle records:", error);
      throw error;
    }
  }

  /**
   * Get sample transactions for a business day
   */
  async getSampleTransactions(
    businessDay: string,
    limit: number = 5,
  ): Promise<any[]> {
    try {
      const businessDayRef = `${businessDay}T00:00:00Z`;

      const query = `
        SELECT id,
               reference_id,
               type,
               status,
               amount,
               currency,
               debtor_xmi,
               creditor_xmi,
               created_at,
               settled_at
        FROM transaction
        WHERE business_day_ref = $1
        ORDER BY created_at DESC
          LIMIT $2
      `;

      const result = await this.client.query(query, [businessDayRef, limit]);
      return result.rows;
    } catch (error) {
      console.error("Error getting sample transactions:", error);
      throw error;
    }
  }

  /**
   * Get detailed transaction statistics for a business day
   */
  async getTransactionStatistics(businessDay: string): Promise<any> {
    try {
      const businessDayRef = `${businessDay}T00:00:00Z`;

      const query = `
        SELECT COUNT(*)                                       as total_count,
               COUNT(CASE WHEN status = 'SETTLED' THEN 1 END) as settled_count,
               COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
               COUNT(CASE WHEN status = 'FAILED' THEN 1 END)  as failed_count,
               COUNT(DISTINCT type)                           as unique_types,
               COUNT(DISTINCT currency)                       as unique_currencies,
               COUNT(DISTINCT debtor_xmi)                     as unique_debtors,
               COUNT(DISTINCT creditor_xmi)                   as unique_creditors,
               SUM(amount)                                    as total_amount,
               AVG(amount)                                    as average_amount,
               MIN(amount)                                    as min_amount,
               MAX(amount)                                    as max_amount
        FROM transaction
        WHERE business_day_ref = $1
      `;

      const result = await this.client.query(query, [businessDayRef]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      return null;
    } catch (error) {
      console.error("Error getting transaction statistics:", error);
      throw error;
    }
  }
}
