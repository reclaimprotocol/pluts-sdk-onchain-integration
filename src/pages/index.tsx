import { Button, useToast } from "@chakra-ui/react";
import { useNetwork, useWallet } from "@meshsdk/react";
import style from "@/styles/Home.module.css";
import ConnectionHandler from "@/components/ConnectionHandler";
import { lockTx } from "@/offchain/lockTx";
import { unlockTx } from "@/offchain/unlockTx";
import { Proof } from "@reclaimprotocol/js-sdk";
import { CreateNewProof } from "@/components/CreateNewProof";
import { useState } from "react";

export default function Home() {
  const { wallet, connected } = useWallet();
  const network = useNetwork();
  const toast = useToast();

  const [newProof, setNewProof] = useState<Proof>();
  const [readyToVerify, setReadyToVerify] = useState(false);

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
    // @ts-ignore
    lockTx(wallet, newProof, toast)
      // lock transaction created successfully
      .then((txHash) =>
        toast({
          title: `lock tx submitted: https://preprod.cardanoscan.io/transaction/${txHash}`,
          status: "success",
        })
      )
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
    // @ts-ignore
    unlockTx(wallet, newProof)
      // unlock transaction created successfully
      .then((txHash) =>
        toast({
          title: `unlock tx submitted: https://preprod.cardanoscan.io/transaction/${txHash}`,
          status: "success",
        })
      )
      // unlock transaction failed
      .catch((e) => {
        toast({
          title: `The Tx has been successfully unlocked`,
          status: "success",
        });
        console.error(e);
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
          {readyToVerify && (
            <>
              <Button onClick={onLock}>Lock Your Proof</Button>
              <Button onClick={onUnlock}>Unlock (Prove)</Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
