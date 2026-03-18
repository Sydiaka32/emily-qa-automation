// Main barrel export for all API utilities
// Re-export everything from all modules for convenient importing

// Core request context
export { createApiRequestContext } from './requestContext';

// HTTP Methods - Generic request helpers
export { getRequest } from './httpMethods/getRequest';
export { postRequest } from './httpMethods/postRequest';
export { putRequest } from './httpMethods/putRequest';
export { deleteRequest } from './httpMethods/deleteRequest';
export { getRequestBinary } from './httpMethods/getRequestBinary';

// Market API - Trading and market operations
export { postOrder } from './market/postOrder';
export { getOrderByOuid } from './market/getOrderByOuid';
export { getTrades } from './market/getTrades';
export { deleteCurrencyPair } from './market/deleteCurrencyPair';
export { postCurrencyPair } from './market/postCurrencyPair';

// Ledger API - Balance and position operations
export { getBalances } from './ledger/getBalances';

// Public API - Public endpoints (no authentication required)
export { getFeed } from './public/getFeed';
export { getPublicCurrentMember } from './public/getPublicCurrentMember';

// You can also export types if needed
// export type { Balance } from '../types';