import { BrowserProvider, formatEther } from 'ethers';

export function hasMetaMask() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

export async function connectMetaMask() {
  if (!hasMetaMask()) {
    throw new Error('MetaMask not installed. Get it at metamask.io');
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(address);

  return {
    address: address.toLowerCase(),
    chainId: Number(network.chainId),
    chainName: network.name,
    ethBalance: formatEther(balance),
    provider,
    signer,
  };
}

export async function getWalletState(address) {
  if (!hasMetaMask() || !address) return null;
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.listAccounts();
  const connected = accounts.some(a => a.address.toLowerCase() === address.toLowerCase());
  if (!connected) return null;
  const balance = await provider.getBalance(address);
  const network = await provider.getNetwork();
  return {
    address: address.toLowerCase(),
    chainId: Number(network.chainId),
    ethBalance: formatEther(balance),
  };
}

export function onAccountsChanged(callback) {
  if (!window.ethereum) return () => {};
  const handler = (accounts) => callback(accounts);
  window.ethereum.on('accountsChanged', handler);
  return () => window.ethereum.removeListener('accountsChanged', handler);
}

export function onChainChanged(callback) {
  if (!window.ethereum) return () => {};
  const handler = () => callback();
  window.ethereum.on('chainChanged', handler);
  return () => window.ethereum.removeListener('chainChanged', handler);
}
