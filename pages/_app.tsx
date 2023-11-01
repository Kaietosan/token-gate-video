import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig, mainnet } from "wagmi";
import { publicProvider } from 'wagmi/providers/public'
import { createPublicClient, http } from 'viem'
import { LivepeerConfig } from "@livepeer/react";
import LivepeerClient from "../client";
import "lit-share-modal-v3/dist/ShareModal.css";
import { LitProvider } from "../hooks/useLit";


// ... import { alchemyProvider } from 'wagmi/providers/alchemy';
// ... import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient, webSocketPublicClient } = configureChains([mainnet], [publicProvider()]);
const { connectors } = getDefaultWallets({

  appName: "My Awesome App",
  chains,
});

const wagmiClient = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain: mainnet,
    transport: http()
  })

  connectors,
  provider,
});

function MyApp({ Component, pageProps }) {
  return (
    <LitProvider>
      <LivepeerConfig client={LivepeerClient}>
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider chains={chains}>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </WagmiConfig>
      </LivepeerConfig>
    </LitProvider>
  );
}

export default MyApp;
