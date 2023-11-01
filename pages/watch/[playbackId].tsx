import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { Player, usePlaybackInfo } from "@livepeer/react";
import useLit from "../../hooks/useLit";
import LitJsSdk from "lit-js-sdk";

// ... import LitJsSdk from "lit-js-sdk";

export default function Watch() {
    const router = useRouter();
    const playbackId = router.query.playbackId?.toString();
    const { address } = useAccount();
    const { litNodeClient, litConnected } = useLit();
  
    const [gatingError, setGatingError] = useState();
    const [gateState, setGateState] = useState();
    const [jwt, setJwt] = useState("");
  
// Step 1: Fetch playback URL
const { data: playbackInfo, status: playbackInfoStatus } = usePlaybackInfo({
    playbackId,
  });

  async function checkLitGate(litNodeClient, playbackPolicy) {
    const ethSign = await LitJsSdk.checkAndSignAuthMessage({
      chain: "ethereum",
      switchChain: false,
    });
    const jwt = await litNodeClient.getSignedToken({
      unifiedAccessControlConditions: playbackPolicy.webhookContext.accessControl,
      authSig: { ethereum: ethSign },
      resourceId: playbackPolicy.webhookContext.resourceId,
    });
  
    console.log(jwt);
    setGateState("open");
    setJwt(jwt);
    return jwt;
  }

// Step 2: Check Lit signing condition and obtain playback cookie
useEffect(() => {
    if (playbackInfoStatus !== "success" || !playbackId) return;
    const { playbackPolicy } = playbackInfo?.meta ?? {};
    setGateState("checking");
  
    setTimeout(() => {
      checkLitGate(litNodeClient, playbackPolicy)
        .then(() => {
          console.log("open");
        })
        .catch((err: any) => {
          setGateState("closed");
        });
    }, 1000);
  }, [address, playbackInfoStatus, playbackInfo, playbackId, litNodeClient]);
  
return (
  <>
    <div className="flex flex-col text-lg items-center justify-center mt-40">
      <h1 className="text-4xl font-bold font-MontHeavy text-gray-100 mt-6">
        Asset Token Gating with Lit Signing Conditions
      </h1>
      <p className="text-base font-light text-gray-500 mt-2 w-1/2 text-center">
        Prove your identity to access the gated content.
      </p>
    </div>
    <div className="flex justify-center text-center font-matter">
      <div className="overflow-auto border border-solid border-[#00FFB250] rounded-md p-6 w-3/5 mt-20">
        {jwt && <Player playbackId={playbackId} accessKey={jwt} />}
        {gateState == "checking" && (
          <p className="text-white">Checking, please wait...</p>
        )}
        {gateState == "closed" && (
          <p className="text-white">
            Sorry, you do not have access to this content
          </p>
        )}
      </div>
    </div>
  </>
);
