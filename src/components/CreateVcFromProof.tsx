// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ReclaimProofRequest, Proof } from "@reclaimprotocol/js-sdk";
import { useQRCode } from "next-qrcode";
import { Button, Text, Stack } from "@chakra-ui/react";
import identusManager from "@/offchain/identusManager";

export const CreateDIDFromProof = ({
  setDID,
  setReadyToLock,
  reclaimProof,
  showToast,
}: {
  setDID: (DID: string) => void;
  setReadyToLock: (ready: boolean) => void;
  reclaimProof: Proof | undefined;
  showToast?: (options: { title: string; status: "success" | "error" }) => void;
}) => {
  const [url, setUrl] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [proof, setproof] = useState("");
  const [loading, setLoading] = useState(false);

  async function createVC() {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const did = await identusManager.createDid(reclaimProof);
    const credential = await identusManager.issueCredential(did, reclaimProof);
    setDID(credential);
    setLoading(false);
    setReadyToLock(true);
    if (showToast) {
      showToast({
        title: "DID Certificate created successfully!",
        status: "success",
      });
    }
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
      <Button
        isLoading={loading}
        loadingText="Generating..."
        className="btn btn-secondary"
        onClick={createVC}
      >
        Create a Certificate
      </Button>
    </div>
  );
};
