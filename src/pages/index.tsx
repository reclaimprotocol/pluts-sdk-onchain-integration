import { Button, useToast, Text } from "@chakra-ui/react";
import { useNetwork, useWallet } from "@meshsdk/react";
import style from "@/styles/Home.module.css";
import ConnectionHandler from "@/components/ConnectionHandler";
import { lockTx } from "@/offchain/lockTx";
import { unlockTx } from "@/offchain/unlockTx";
import { Proof } from "@reclaimprotocol/js-sdk";
import { CreateNewProof } from "@/components/CreateNewProof";
import { useState } from "react";
import { CreateDIDFromProof } from "@/components/CreateVcFromProof";

export default function Home() {
  const { wallet, connected } = useWallet();
  const network = useNetwork();
  const toast = useToast();

  const [newProof, setNewProof] = useState<Proof>();
  const [Did, setDID] = useState("");
  const [readyToVerify, setReadyToVerify] = useState(false);
  const [readyDID, setReadyDID] = useState(false);
  const [lockLoading, setlockLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  if (typeof network === "number" && network !== 0) {
    return (
      <div
        className={[style.pageContainer, "center-child-flex-even"].join(" ")}
      >
        <b
          style={{
            margin: "auto 10vw",
          }}
        >
          Make sure to set your wallet in testnet mode;
          <br />
          We are playing with founds here!
        </b>
        <Button
          onClick={() => window.location.reload()}
          style={{
            margin: "auto 10vw",
          }}
        >
          Refersh page
        </Button>
      </div>
    );
  }

  function onLock() {
    if (!newProof) {
      toast({
        title: `no proof to lock`,
        status: "error",
      });
      return;
    }

    setlockLoading(true);
    // @ts-ignore
    lockTx(wallet, newProof, Did)
      // lock transaction created successfully
      .then((txHash) =>
        toast({
          title: `lock tx submitted: https://preprod.cardanoscan.io/transaction/${txHash}`,
          status: "success",
        })
      )
      .then(() => {
        setlockLoading(false);
      })
      // lock transaction failed
      .catch((e) => {
        toast({
          title: `something went wrong`,
          status: "error",
        });
        console.error(e);
      });
  }

  function onUnlock() {
    if (!newProof) {
      toast({
        title: `no proof to unlock`,
        status: "error",
      });
      return;
    }
    setUnlockLoading(true);
    // @ts-ignore
    unlockTx(wallet, newProof, Did)
      // unlock transaction created successfully
      .then((txHash) =>
        toast({
          title: `unlock tx submitted: https://preprod.cardanoscan.io/transaction/${txHash}`,
          status: "success",
        })
      )
      .then(() => {
        setUnlockLoading(false);
      })
      // unlock transaction failed
      .catch((e) => {
        toast({
          title: `The Tx has been successfully unlocked`,
          status: "success",
        });
        console.error(e);
        setUnlockLoading(false);
      });
  }

  return (
    <div className={[style.pageContainer, "center-child-flex-even"].join(" ")}>
      <ConnectionHandler />
      {connected && (
        <>
          {!readyToVerify && (
            <CreateNewProof
              setNewProof={setNewProof}
              setReadyToVerify={setReadyToVerify}
            />
          )}
          {readyToVerify && !readyDID && (
            <CreateDIDFromProof
              setDID={setDID}
              setReadyToLock={setReadyDID}
              reclaimProof={newProof}
              showToast={toast}
            />
          )}
          {readyDID && (
            <>
              <Button
                isLoading={lockLoading}
                loadingText="Locking..."
                onClick={onLock}
              >
                Lock Your Proof
              </Button>
              <Text>
                Please allow some time between locking and unlocking to ensure
                the lock transaction is successfully recorded on-chain.
              </Text>
              <Button
                isLoading={unlockLoading}
                loadingText="UnLocking..."
                onClick={onUnlock}
              >
                Unlock (Prove)
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
