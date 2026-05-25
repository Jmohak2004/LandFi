/**
 * On-chain integration layer for LandFi.
 * Set VITE_LANDFI_CONTRACT and VITE_FRACTION_TOKEN in .env when contracts are deployed.
 */

export const CONTRACT_CONFIG = {
  landFi: import.meta.env.VITE_LANDFI_CONTRACT || '',
  fractionToken: import.meta.env.VITE_FRACTION_TOKEN || '',
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 11155111),
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Sepolia',
};

export const LANDFI_ABI = [
  'function registerProperty(string name, uint256 price)',
  'function startEMI(uint256 propertyId, uint256 months)',
  'function payEMI(uint256 propertyId)',
  'function getProperty(uint256 propertyId) view returns (tuple(string name, uint256 price, address owner, bool isRegistered))',
  'function getEMI(address user, uint256 propertyId) view returns (tuple(uint256 totalAmount, uint256 paidAmount, uint256 emiPerMonth, uint256 monthsLeft, bool isActive))',
  'function propertyCount() view returns (uint256)',
];

export const FRACTION_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function totalSupply(uint256 id) view returns (uint256)',
];

export function isContractConfigured() {
  return Boolean(CONTRACT_CONFIG.landFi && CONTRACT_CONFIG.fractionToken);
}

export async function getContractReadiness(walletChainId) {
  const configured = isContractConfigured();
  const chainMatch = !walletChainId || walletChainId === CONTRACT_CONFIG.chainId;
  return {
    configured,
    chainMatch,
    ready: configured && chainMatch,
    message: !configured
      ? 'Deploy LandFi.sol and set VITE_LANDFI_CONTRACT in .env'
      : !chainMatch
        ? `Switch wallet to ${CONTRACT_CONFIG.chainName} (chain ${CONTRACT_CONFIG.chainId})`
        : 'Contracts ready for on-chain settlement',
  };
}
