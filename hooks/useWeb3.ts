
import { useState, useCallback, useEffect } from 'react';
import type { Balances } from '../types';

// Type definition for the window.ethereum object injected by wallets
interface EthereumProvider {
    isMetaMask?: boolean;
    request: <T>(args: { method: string; params?: unknown[] | object }) => Promise<T>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}

// --- Network Configurations ---
const NETWORKS = {
    'bsc-mainnet': {
        chainId: '0x38', // 56
        chainName: 'Binance Smart Chain Mainnet',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        blockExplorerUrls: ['https://bscscan.com'],
        usdtContractAddress: '0x55d398326f99059fF775485246999027B3197955',
    },
    'bsc-testnet': {
        chainId: '0x61', // 97
        chainName: 'Binance Smart Chain Testnet',
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
        blockExplorerUrls: ['https://testnet.bscscan.com'],
        usdtContractAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    }
};

export type NetworkName = keyof typeof NETWORKS;

const formatBalance = (hexValue: string, decimals: number): string => {
    const displayDecimals = decimals > 6 ? 4 : 2;

    if (!hexValue || hexValue === '0x') {
        return (0).toFixed(displayDecimals);
    }

    const valueBigInt = BigInt(hexValue);
    let valueStr = valueBigInt.toString();

    if (valueStr.length <= decimals) {
        valueStr = '0'.repeat(decimals - valueStr.length + 1) + valueStr;
    }

    const decimalPointIndex = valueStr.length - decimals;
    const integerPart = valueStr.slice(0, decimalPointIndex);
    let fractionalPart = valueStr.slice(decimalPointIndex);

    fractionalPart = fractionalPart.slice(0, displayDecimals).padEnd(displayDecimals, '0');

    return `${integerPart}.${fractionalPart}`;
};

const switchOrAddNetwork = async (provider: EthereumProvider, networkConfig: typeof NETWORKS[NetworkName]) => {
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkConfig.chainId }],
        });
    } catch (switchError: any) {
        // Code 4902 indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [networkConfig],
                });
            } catch (addError) {
                console.error(`Failed to add ${networkConfig.chainName}:`, addError);
                throw addError;
            }
        } else {
            console.error(`Failed to switch to ${networkConfig.chainName}:`, switchError);
            throw switchError;
        }
    }
};

export const useWeb3 = () => {
    const [networkName, setNetworkName] = useState<NetworkName>(
        () => (localStorage.getItem('selectedNetwork') as NetworkName) || 'bsc-mainnet'
    );
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [address, setAddress] = useState<string | null>(null);
    const [balances, setBalances] = useState<Balances | null>(null);

    const activeNetwork = NETWORKS[networkName];



    const disconnectWallet = useCallback(() => {
        setIsConnected(false);
        setAddress(null);
        setBalances(null);
        console.log('Wallet state cleared.');
    }, []);


    const updateBalancesAndAccount = useCallback(async (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnectWallet();
            return;
        }

        const newAddress = accounts[0];
        setAddress(newAddress);
        setIsConnected(true);

        if (!window.ethereum) return;
        try {
            // Get Native Balance (tBNB or BNB)
            const nativeBalanceHex = await window.ethereum.request<string>({
                method: 'eth_getBalance',
                params: [newAddress, 'latest'],
            });

            // Get USDT Balance
            const usdtData = `0x70a08231${newAddress.substring(2).padStart(64, '0')}`;
            const usdtBalanceHex = await window.ethereum.request<string>({
                method: 'eth_call',
                params: [{ to: activeNetwork.usdtContractAddress, data: usdtData }, 'latest'],
            });

            setBalances({
                native: formatBalance(nativeBalanceHex || '0x0', 18),
                USDT: formatBalance(usdtBalanceHex || '0x0', 18),
            });
        } catch (error) {
            console.error("Failed to fetch balances:", error);
            setBalances({
                native: formatBalance('0x0', 18),
                USDT: formatBalance('0x0', 18)
            });
        }
    }, [disconnectWallet, activeNetwork]);

    const setCurrentNetwork = useCallback(async (name: NetworkName) => {
        if (!window.ethereum) {
            alert('Please install a Web3 wallet.');
            return;
        }
        localStorage.setItem('selectedNetwork', name);

        try {
            await switchOrAddNetwork(window.ethereum, NETWORKS[name]);

            setNetworkName(name);
            if (address) {

                await updateBalancesAndAccount([address]);
            }
        } catch (e) {
            console.error('Could not switch network automatically.', e);

            alert(`No fue posible cambiar a ${NETWORKS[name].chainName}. Revisa MetaMask.`);
        }
    }, [address, updateBalancesAndAccount]);





    const sendTransaction = useCallback(async (to: string, amount: number, currency: 'native' | 'USDT'): Promise<string> => {
        if (!window.ethereum || !address) {
            throw new Error("Wallet not connected");
        }

        const amountInWei = BigInt(Math.floor(amount * 1e18));
        const amountHex = '0x' + amountInWei.toString(16);

        try {
            if (currency === 'native') {
                const params = [{
                    from: address,
                    to: to,
                    value: amountHex,
                }];
                const txHash = await window.ethereum.request<string>({
                    method: 'eth_sendTransaction',
                    params: params,
                });
                return txHash;
            } else { // USDT
                const toAddressPadded = to.substring(2).padStart(64, '0');
                const amountHexPadded = amountInWei.toString(16).padStart(64, '0');
                const txData = `0xa9059cbb${toAddressPadded}${amountHexPadded}`;

                const params = [{
                    from: address,
                    to: activeNetwork.usdtContractAddress,
                    data: txData,
                }];
                const txHash = await window.ethereum.request<string>({
                    method: 'eth_sendTransaction',
                    params: params,
                });
                return txHash;
            }
        } catch (error) {
            console.error("Transaction failed:", error);
            throw error; // Re-throw to be handled by the caller
        }

    }, [address, activeNetwork]);

    const requestPermissions = async (provider: EthereumProvider) => {
        try {

            await provider.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });
            return true;
        } catch (err: any) {
            console.warn('Permissions request rejected or failed:', err);
            return false;
        }
    };


    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            alert('Please install a Web3 wallet like MetaMask to use this application.');
            return;
        }
        setIsConnecting(true);

        try {

            try {
                await switchOrAddNetwork(window.ethereum, NETWORKS[networkName]);
            } catch (switchErr: any) {

                console.warn('No se pudo cambiar la red antes de solicitar cuentas:', switchErr);
            }


            let accounts: string[] = [];
            try {

                accounts = await window.ethereum.request<string[]>({ method: 'eth_requestAccounts' });
            } catch (err: any) {

                console.warn('eth_requestAccounts failed, intentando wallet_requestPermissions...', err);
                const granted = await requestPermissions(window.ethereum);
                if (granted) {
                    accounts = await window.ethereum.request<string[]>({ method: 'eth_requestAccounts' });
                } else {
                    throw err;
                }
            }


            const currentChainId = await window.ethereum.request<string>({ method: 'eth_chainId' });
            const connectedNetworkName = Object.keys(NETWORKS).find(key => NETWORKS[key as NetworkName].chainId === currentChainId) as NetworkName | undefined;

            if (connectedNetworkName) {

                if (networkName !== connectedNetworkName) {
                    setNetworkName(connectedNetworkName);
                    localStorage.setItem('selectedNetwork', connectedNetworkName);
                }
                await updateBalancesAndAccount(accounts || []);
            } else {

                try {
                    await switchOrAddNetwork(window.ethereum, NETWORKS[networkName]);

                    await updateBalancesAndAccount(accounts || []);
                } catch (switchErr: any) {

                    console.warn('Usuario en red no soportada y rechazó cambiar/red:', switchErr);
                    alert(`Tu wallet está en una red no soportada. Cambia manualmente a ${NETWORKS[networkName].chainName} o acepta el cambio en MetaMask.`);

                    disconnectWallet();
                }
            }
        } catch (error: any) {
            if (error.code === 4001) {
                console.log('User rejected the connection request.');
            } else {
                console.error('Failed to connect wallet:', error);
            }
            disconnectWallet();
        } finally {
            setIsConnecting(false);
        }
    }, [networkName, updateBalancesAndAccount, disconnectWallet]);

    useEffect(() => {
        if (typeof window.ethereum === 'undefined') {
            return;
        }

        const handleAccountsChanged = (accounts: string[]) => {
            updateBalancesAndAccount(accounts);
        };

        const handleChainChanged = async (chainId: string) => {

            const connectedNetworkName = Object.keys(NETWORKS).find(key => NETWORKS[key as NetworkName].chainId === chainId) as NetworkName | undefined;
            if (connectedNetworkName) {
                setNetworkName(connectedNetworkName);
                localStorage.setItem('selectedNetwork', connectedNetworkName);
            } else {

                console.warn('Chain cambiado a una red no soportada:', chainId);

                setBalances(null);
                setIsConnected(false);
                setAddress(null);
            }

            try {
                const accounts = await window.ethereum!.request<string[]>({ method: 'eth_accounts' });
                if (accounts && accounts.length) await updateBalancesAndAccount(accounts);
            } catch (err) {
                console.warn('No se pudieron obtener cuentas tras cambio de chain:', err);
            }
        };


        const checkExistingConnection = async () => {
            try {
                const accounts = await window.ethereum!.request<string[]>({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    const currentChainId = await window.ethereum!.request<string>({ method: 'eth_chainId' });
                    const connectedNetworkName = Object.keys(NETWORKS).find(key => NETWORKS[key as NetworkName].chainId === currentChainId) as NetworkName | undefined;
                    if (connectedNetworkName) {
                        setNetworkName(connectedNetworkName);
                        await updateBalancesAndAccount(accounts);
                    } else {

                        try {
                            await switchOrAddNetwork(window.ethereum!, NETWORKS[networkName]);
                            await updateBalancesAndAccount(accounts);
                        } catch {

                            console.warn('Usuario conectado en red no soportada y no se pudo cambiar automáticamente.');
                        }
                    }
                }
            } catch (err) {
                console.error('Error checking for existing wallet connection:', err);
            }
        };

        checkExistingConnection();

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum?.removeListener('chainChanged', handleChainChanged);
        };
    }, [updateBalancesAndAccount, networkName]);

    return {
        isConnected,
        isConnecting,
        address,
        balances,
        connectWallet,
        disconnectWallet,
        sendTransaction,
        networkName,
        setCurrentNetwork,
        availableNetworks: NETWORKS,
        nativeCurrencySymbol: activeNetwork.nativeCurrency.symbol,
    };
};
