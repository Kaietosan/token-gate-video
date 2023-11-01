import Image from 'next/image'
import { Inter } from 'next/font/google'
import React, { useEffect, useMemo, useRef, useState } from "react";
import useLit from "../../hooks/useLit";
import { nanoid } from "nanoid";
import { useAsset, useCreateAsset } from "@livepeer/react";
import Link from "next/link";
import { useAccount } from "wagmi";
import LitJsSdk from "lit-js-sdk";
import LitShareModal from "lit-share-modal-v3";


const resourceId = {
  baseUrl: "my-awesome-app.vercel.app",
  path: `/asset/${nanoid()}`,
  orgId: "some-app",
  role: "",
  extraData: `createdAt=${Date.now()}`,
};

// Inputs
const [file, setFile] = useState(undefined);
const fileInputRef = useRef(null);

// Lit
const [showShareModal, setShowShareModal] = useState(false);
const [savedSigningConditionsId, setSavedSigningConditionsId] = useState();
const [authSig, setAuthSig] = useState({});
const { litNodeClient, litConnected } = useLit();

const [litGateParams, setLitGateParams] = useState({
  unifiedAccessControlConditions: null,
  permanent: false,
  chains: [],
  authSigTypes: [],
});

// Misc
const { address: publicKey } = useAccount();

// Step 1: pre-sign the auth message
useEffect(() => {
  if (publicKey) {
    Promise.resolve().then(async () => {
      try {
        setAuthSig({
          ethereum: await LitJsSdk.checkAndSignAuthMessage({
            chain: "ethereum",
            switchChain: false,
          }),
        });
      } catch (err: any) {
        alert(`Error signing auth message: ${err?.message || err}`);
      }
    });
  }
}, [publicKey]);

// Step 2: Creating an asset
const {
  mutate: createAsset,
  data: createdAsset,
  status: createStatus,
  progress,
} = useCreateAsset(
  file
    ? {
        sources: [
          {
            file: file,
            name: file.name,
            playbackPolicy: {
              type: "webhook",
              webhookId: "WEBHOOK_ID",
              webhookContext: {
                accessControl: litGateParams.unifiedAccessControlConditions,
                resourceId: resourceId,
              },
            },
          },
        ] as const,
      }
    : null,
);

// Step 3: Getting asset and refreshing for the status
const {
  data: asset,
  error,
  status: assetStatus,
} = useAsset({
  assetId: createdAsset?.[0].id,
  refetchInterval: (asset) =>
    asset?.storage?.status?.phase !== "ready" ? 5000 : false,
});

const progressFormatted = useMemo(
  () =>
    progress?.[0].phase === "failed" || createStatus === "error"
      ? "Failed to upload video."
      : progress?.[0].phase === "waiting"
      ? "Waiting"
      : progress?.[0].phase === "uploading"
      ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
      : progress?.[0].phase === "processing"
      ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
      : null,
  [progress, createStatus],
);

const isLoading = useMemo(
  () =>
    createStatus === "loading" ||
    assetStatus === "loading" ||
    (asset && asset?.status?.phase !== "ready") ||
    (asset?.storage && asset?.storage?.status?.phase !== "ready"),
  [asset, assetStatus, createStatus],
);

// Step 4: After an asset is created, save the signing condition
useEffect(() => {
  if (
    createStatus === "success" &&
    asset?.id &&
    asset?.id !== savedSigningConditionsId
  ) {
    setSavedSigningConditionsId(asset?.id);
    // @ts-ignore
    const ACConditions = asset?.playbackPolicy.webhookContext.accessControl;
    console.log(ACConditions, resourceId);
    Promise.resolve().then(async () => {
      try {
        await litNodeClient.saveSigningCondition({
          unifiedAccessControlConditions: ACConditions,
          authSig,
          resourceId: resourceId,
        });
      } catch (err: any) {
        alert(`Error saving signing condition: ${err?.message || err}`);
      }
    });
  }
}, [litNodeClient, createStatus, savedSigningConditionsId, authSig, asset]);

const handleClick = async () => {
  if (!publicKey) {
    console.log("Please connect your wallet to continue");
    return;
  }

  if (!file) {
    console.log("Please choose a file");
    return;
  }
  if (!litGateParams.unifiedAccessControlConditions) {
    console.log("Please choose the access control conditions");
    return;
  }
  createAsset?.();
};



const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <section className="p-10 h-screen flex flex-col lg:flex-row-reverse">
      <div className="w-full h-1/2 lg:h-full lg:w-1/2 ">
        <div className="relative">
          <img
            src="<https://solana-nft.withlivepeer.com/_next/image?url=%2Fhero.png&w=2048&q=75>"
            alt="BannerImage"
            className=" h-[90vh] w-full lg:object-cover lg:block hidden rounded-xl"
          />
        </div>
      </div>
      <div className="lg:w-1/2  w-full h-full lg:mr-20">
        <p className="text-base font-light text-primary lg:mt-20 mt-5">
          Livepeer x Ethereum x Lit
        </p>
        <h1 className="text-5xl font-bold font-MontHeavy text-gray-100 mt-6 leading-tight">
          Token gate your videos on Ethereum with Livepeer.
        </h1>
        <p className="text-base font-light text-zinc-500 mt-2">
          Token gating is a powerful tool for content creators who want to
          monetize their video content. With Livepeer, you can easily create a
          gated video that requires users to hold a certain amount of tokens/NFT
          in order to access the content. <br /> <br /> Livepeer&apos;s token
          gating feature is easy to use and highly customizable
        </p>
        <div className="flex flex-col mt-6">
          <div className="h-4" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed border-zinc-800 border rounded-md text-zinc-700  p-4 flex items-center justify-center hover:border-zinc-700 "
          >
            <p className="">
              {file ? (
                file.name +
                " - " +
                Number(file.size / 1024 / 1024).toFixed() +
                " MB"
              ) : (
                <>Choose a video file to upload</>
              )}
            </p>
          </div>
          <div className="h-5" />
          <div onClick={() => setShowShareModal(true)}>
            <input
              className={
                " bg-transparent p-4  border-zinc-800 border rounded-md text-zinc-400 text-sm font-light w-full  placeholder:text-zinc-700 focus:outline-none"
              }
              placeholder={"Choose the access control conditions"}
              disabled
              value={
                !litGateParams.unifiedAccessControlConditions
                  ? ""
                  : JSON.stringify(
                      litGateParams.unifiedAccessControlConditions,
                      null,
                      2
                    )
              }
            />
          </div>
  
          <input
            onChange={(e) => {
              if (e.target.files) {
                setFile(e.target.files[0]);
              }
            }}
            type="file"
            accept="video/*"
            ref={fileInputRef}
            hidden
          />
        </div>
        <div className="flex flex-row items-center mb-20 lg:mb-0">
          <button
            onClick={handleClick}
            className={
              "rounded-xl  text-sm font-medium p-3 mt-6  w-36 hover:cursor-pointer bg-primary"
            }
          >
            {isLoading ? progressFormatted || "Uploading..." : "Upload"}
          </button>
  
          {asset?.status?.phase === "ready" && (
            <div>
              <div className="flex flex-col justify-center items-center ml-5 font-matter">
                <p className="mt-6 text-white">
                  Your token-gated video is uploaded, and you can view it{" "}
                  <Link
                    className="text-primary"
                    target={"_blank"}
                    rel={"noreferrer"}
                    href={`/watch/${asset?.playbackId}`}
                  >
                    here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
  
        {showShareModal && (
          <div className="fixed top-0 left-0 w-full h-full z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-1/3 h-[95%] mt-10">
              <LitShareModal
                onClose={() => {
                  setShowShareModal(false);
                }}
                chainsAllowed={["ethereum"]}
                injectInitialState={true}
                defaultChain={"ethereum"}
                initialUnifiedAccessControlConditions={
                  litGateParams?.unifiedAccessControlConditions
                }
                onUnifiedAccessControlConditionsSelected={(
                  val: LitGateParams
                ) => {
                  setLitGateParams(val);
                  setShowShareModal(false);
                }}
                darkMode={true}
                injectCSS={false}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
  
}
