import { config } from "../../../test.config";

// Delete collateral function
async function deleteCollateral(operatorToken: string, memberXmi: string, collateralId: string) {
  const response = await fetch(
    `${config.backofficeBaseUrl}/api/v1/core-admin/members/${memberXmi}/collaterals/${collateralId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${operatorToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to delete collateral: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

// Cleanup function to delete created collaterals
export async function cleanupCollaterals(operatorToken: string, memberXmi: string, collateralIds: string[]) {
  for (const collateralId of collateralIds) {
    try {
      await deleteCollateral(operatorToken, memberXmi, collateralId);
      console.log(`Cleaned up collateral: ${collateralId}`);
    } catch (error) {
      console.error(`Failed to delete collateral ${collateralId}:`, error);
    }
  }
}