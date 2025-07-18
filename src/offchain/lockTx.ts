import { BrowserWallet } from "@meshsdk/core";
import getTxBuilder from "./getTxBuilder";
import { scriptTestnetAddr } from "../../contracts/reclaimPluts";
import { Value, DataB, Address, Tx } from "@harmoniclabs/plu-ts";
import { toPlutsUtxo } from "./mesh-utils";
import koios from "./koios";
import { Proof } from "@reclaimprotocol/js-sdk";
import { sha3 } from "@harmoniclabs/crypto";
import { toHexString } from "./utils";
import identusManager from "./identusManager";

async function getLockTx(
  wallet: BrowserWallet,
  reclaimProof: Proof,
  Did: string
): Promise<Tx> {
  const myAddr = Address.fromString(await wallet.getChangeAddress());

  const txBuilder = await getTxBuilder();
  const myUTxOs = (await wallet.getUtxos()).map(toPlutsUtxo);

  if (myUTxOs.length === 0) {
    throw new Error("have you requested founds from the faucet?");
  }

  const parameters = reclaimProof.claimData.parameters;
  const signatures = reclaimProof.signatures[0];

  const utxo = myUTxOs.find((u) => u.resolved.value.lovelaces > 15_000_000);

  if (utxo === undefined) {
    throw "not enough ada";
  }

  const datumBytes = new TextEncoder().encode(parameters + signatures + Did);

  const hashedDatum = new DataB(
    new TextEncoder().encode(toHexString(sha3(datumBytes)))
  );

  //@ts-ignore
  return txBuilder.buildSync({
    //@ts-ignore
    inputs: [{ utxo }],
    outputs: [
      {
        // output holding the founds that we'll spend later
        //@ts-ignore
        address: scriptTestnetAddr,
        // 10M lovelaces === 10 ADA
        //@ts-ignore
        value: Value.lovelaces(10_000_000),
        // remeber to include a datum
        datum: hashedDatum,
      },
    ],
    // send everything left back to us
    //@ts-ignore
    changeAddress: myAddr,
  });
}

export async function lockTx(
  wallet: BrowserWallet,
  reclaimProof: Proof,
  Did: string
): Promise<string> {
  const unsingedTx = await getLockTx(wallet, reclaimProof, Did);

  const txStr = await wallet.signTx(unsingedTx.toCbor().toString());

  return (await koios.tx.submit(Tx.fromCbor(txStr) as any)).toString();
}
