import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, rabbyWallet, coinbaseWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { sepolia } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';

// WalletConnect v2 requires a project id. Replace this with your own project id if you want WalletConnect-based wallets.
const WALLETCONNECT_PROJECT_ID = '00000000000000000000000000000000';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        coinbaseWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'CryptStore',
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

export const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(),
  },
  ssr: false,
});
