export interface RecallFlowResult {
  recallResponse: any;
  recallPayload: {
    reason_code: string;
    reason_info: string;
  };
  recallsListResponse: any;
  ourRecall: any;
}
