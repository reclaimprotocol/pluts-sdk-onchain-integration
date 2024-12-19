// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ReclaimProofRequest, Proof } from "@reclaimprotocol/js-sdk";
import { useQRCode } from "next-qrcode";
import { Button, Text } from "@chakra-ui/react";

export const CreateNewProof = ({
  setNewProof,
  setReadyToVerify,
}: {
  setNewProof: (proof: Proof) => void;
  setReadyToVerify: (ready: boolean) => void;
}) => {
  const [url, setUrl] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [proof, setproof] = useState("");
  const [reclaimProofRequest, setReclaimProofRequest] = useState(null);
  const { Canvas } = useQRCode();

  useEffect(() => {
    async function initializeReclaim() {
      const APP_ID = "0x6E0338a6D8594101Ea9e13840449242015d71B19"; // This is an example App Id Replace it with your App Id.
      const APP_SECRET =
        "0x1e0d6a6548b72286d747b4ac9f2ad6b07eba8ad6a99cb1191890ea3f77fae48f"; // This is an example App Secret Replace it with your App Secret.
      const PROVIDER_ID = "6d3f6753-7ee6-49ee-a545-62f1b1822ae5"; // This is GitHub Provider Id Replace it with the provider id you want to use.

      const proofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );
      setReclaimProofRequest(proofRequest);
    }

    initializeReclaim();
  }, []);

  async function generateVerificationRequest() {
    if (!reclaimProofRequest) {
      console.error("Reclaim Proof Request not initialized");
      return;
    }

    const url = await reclaimProofRequest.getRequestUrl();
    setUrl(url);
    const status = reclaimProofRequest.getStatusUrl();
    setStatusUrl(status);
    await reclaimProofRequest.startSession({
      onSuccess: async (proof: Proof) => {
        setNewProof(proof);
        setReadyToVerify(true);
      },
      onFailure: (error: Error) => {
        console.error("Verification failed", error);
        setTxLoading(false);
      },
    });
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "50vh",
      }}
    >
      {!url && (
        <Button
          className="btn btn-secondary"
          onClick={generateVerificationRequest}
        >
          Create New Proof
        </Button>
      )}
      {url && (
        <>
          <Canvas
            text={url}
            options={{
              errorCorrectionLevel: "M",
              margin: 3,
              scale: 4,
              width: 200,
              color: {
                dark: "#010599FF",
                light: "#FFBF60FF",
              },
            }}
          />
          <Text>
            Scan this QR code with your mobile device to verify your proof
          </Text>
        </>
      )}
    </div>
  );
};
