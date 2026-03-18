export interface ReconciliationReportResult {
  filename: string;
  downloadResult: any;
  textContent: string;
  lines: string[];
  dataLines: string[];
  foundRecordTypes: string[];
  headerLine: string;
  trailerLine: string;
  recordCount: string;
}
