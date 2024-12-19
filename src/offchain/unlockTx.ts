import { BrowserWallet } from "@meshsdk/core";
import getTxBuilder from "./getTxBuilder";
import {
  Address,
  isData,
  DataB,
  Tx,
  DataMap,
  DataPair,
} from "@harmoniclabs/plu-ts";
import { script, scriptTestnetAddr } from "../../contracts/reclaimPluts";
import { koios } from "./koios";
import { fromAscii, uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { toPlutsUtxo } from "./mesh-utils";
import { Proof } from "@reclaimprotocol/js-sdk";
import { sha3 } from "@harmoniclabs/crypto";
import axios from "axios";
import { toHexString } from "./utils";
import identusManager from "./identusManager";

function buildRedemeer(signatures: string, parameters: string) {
  return new DataMap<DataB, DataB>([
    new DataPair(
      new DataB(fromAscii("parameters")),
      new DataB(fromAscii(parameters))
    ),
    new DataPair(
      new DataB(fromAscii("signatures")),
      new DataB(fromAscii(signatures))
    ),
  ]);
}

async function getUnlockTx(
  wallet: BrowserWallet,
  reclaimProof: Proof,
  Did: string
): Promise<Tx> {
  // ---- Reclaim Proof Verification ---- //
  // verify proof here with @reclaimprotocol/js-sdk
  // Reclaim.verifySignedProof(reclaimProof); <-----------------------------------------------------------------

  const myAddrs = (await wallet.getUsedAddresses()).map(Address.fromString);

  const txBuilder = await getTxBuilder();
  const myUTxOs = (await wallet.getUtxos()).map(toPlutsUtxo);
  const myAddr = myAddrs[0];

  const datumBytes = new TextEncoder().encode(
    reclaimProof.claimData.parameters + reclaimProof.signatures[0] + Did
  );

  const hashedDatum = new DataB(
    new TextEncoder().encode(toHexString(sha3(datumBytes)))
  );

  // only the onses with valid datum
  const utxoToSpend = (await koios.address.utxos(scriptTestnetAddr))
    .reverse()
    .find((utxo) => {
      const datum = utxo.resolved.datum;

      if (isData(datum) && datum instanceof DataB) {
        // Convert datum.bytes to Uint8Array
        const datumBytesUint8Array = new Uint8Array(datum.bytes.toBuffer());

        // Compare the hashed datum
        if (uint8ArrayEq(hashedDatum.bytes.toBuffer(), datumBytesUint8Array)) {
          return true; // Correct UTxO found
        }
        return false;
      }
      return false;
    });

  if (utxoToSpend === undefined) {
    throw "uopsie, are you sure your tx had enough time to get to the blockchain?";
  }

  //   console.log("myUTxOs[0]", myUTxOs[0]);

  const collateralUtxos = await koios.address.utxos(myAddr.toString());

  return txBuilder.buildSync({
    inputs: [
      {
        utxo: utxoToSpend as any,
        // we must include the utxo that holds our script
        inputScript: {
          script,
          datum: "inline", // the datum is present already on `utxoToSpend`
          redeemer: hashedDatum,
        },
      },
    ],
    requiredSigners: [myAddr.paymentCreds.hash],
    // make sure to include collateral when using contracts
    collaterals: [collateralUtxos[0]],
    // send everything back to us
    changeAddress: myAddr,
  });
}
const BLOCKFROST_PROJECT_ID = "preprod3iSOTdbT267sIEEDPKX2rGqmzd5BCDXY";
const BLOCKFROST_URL = "https://cardano-preprod.blockfrost.io/api/v0"; // Preprod endpoint

export async function unlockTx(
  wallet: BrowserWallet,
  proof: Proof,
  Did: string
): Promise<string> {
  const unsingedTx = await getUnlockTx(wallet, proof, Did);

  const txStr = await wallet.signTx(
    unsingedTx.toCbor().toString(),
    true // partial sign because we have smart contracts in the transaction
  );

  try {
    const response = await axios.post(
      `${BLOCKFROST_URL}/tx/submit`,
      Buffer.from(txStr, "hex"), // Convert the CBOR to a binary buffer
      {
        headers: {
          "Content-Type": "application/cbor",
          project_id: BLOCKFROST_PROJECT_ID,
        },
      }
    );

    console.log("Transaction successfully submitted:", response.data);
    return response.data; // The transaction ID
  } catch (error: any) {
    console.error(
      "Error submitting transaction to Blockfrost:",
      error.response?.data || error.message
    );
    throw new Error("Transaction submission failed");
  }
  //
  //   return (await koios.tx.submit(Tx.fromCbor(txStr))).toString();
}
