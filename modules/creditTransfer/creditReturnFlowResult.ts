export interface CreditReturnFlowResult {
  creditReturnResponse: { status: number };
  creditReturn: any;
  creditReturnPayload: {
    reason_code: string;
    reason_info: string;
  };
}
