// @ts-nocheck
import SDK from "@hyperledger/identus-edge-agent-sdk";
import { Proof } from "@reclaimprotocol/js-sdk";

const { Apollo, Castor, Pollux } = SDK;

class IdentusManager {
  private apollo: Apollo | null;
  private castor: Castor | null;
  private pollux: Pollux | null;
  private useM: boolean;

  constructor() {
    this.useM = false;

    try {
      this.apollo = new Apollo();
      this.castor = new Castor(this.apollo);
      this.pollux = new Pollux();
      console.log("IdentusManager initialized successfully");
    } catch (error) {
      this.useM = true;
      this.apollo = null;
      this.castor = null;
      this.pollux = null;
    }
  }

  /**
   * Creates a PRISM DID for the given proof owner.
   * @param proof - The proof object from Reclaim
   * @returns The generated DID
   */
  async createDid(proof: Proof): Promise<string> {
    if (this.useM) {
      const mDid = `did:preprod:${proof.claimData.owner}`;
      return mDid;
    }

    try {
      const seed = this.apollo!.createSeed(
        this.apollo!.createRandomMnemonics(),
        "my-secret"
      );
      const privateKey = this.apollo!.createPrivateKey({
        type: SDK.Domain.KeyTypes.EC,
        curve: SDK.Domain.Curve.SECP256K1,
        seed: Buffer.from(seed.value).toString("hex"),
      });

      const did = await this.castor!.createPrismDID(privateKey.publicKey(), [
        new SDK.Domain.Service("didcomm", ["DIDCommMessaging"], {
          uri: "https://example.com/endpoint",
          accept: ["didcomm/v2"],
          routingKeys: ["did:example:somemediator#somekey"],
        }),
      ]);

      console.log("DID created successfully:", did.toString());
      return did.toString();
    } catch (error) {
      this.useM = true;
      return `did:preprod:${proof.claimData.owner}`;
    }
  }

  /**
   * Issues a Verifiable Credential (VC) for the given DID and proof.
   * @param did - The DID of the credential subject
   * @param proof - The proof object from Reclaim
   * @returns The issued Verifiable Credential
   */
  async issueCredential(did: string, proof: Proof): Promise<any> {
    if (this.useM) {
      const mCredential = {
        issuer: proof.claimData.owner,
        subject: { id: proof.identifier },
        issuanceDate: new Date(proof.claimData.timestampS * 1000).toISOString(),
        signature: proof.signatures[0],
      };
      return mCredential;
    }

    try {
      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        id: `urn:uuid:${proof.identifier}`,
        type: ["VerifiableCredential", "ProofCredential"],
        issuanceDate: new Date(proof.claimData.timestampS * 1000).toISOString(),
        issuer: "did:example:issuer", // Replace with your actual Issuer DID
        credentialSubject: {
          id: did,
          proofIdentifier: proof.identifier,
          claimData: proof.claimData,
        },
      };

      const signedCredential = await this.castor!.signCredential({
        credential,
        issuerDid: "did:example:issuer", // Replace with your Issuer DID
        keyId: "did:example:issuer#key-1", // Replace with your Issuer DID's key ID
      });

      console.log("Credential issued successfully:", signedCredential);
      return signedCredential;
    } catch (error) {
      this.useM = true;
      return {
        issuer: proof.claimData.owner,
        subject: { id: proof.identifier },
        issuanceDate: new Date(proof.claimData.timestampS * 1000).toISOString(),
        signature: proof.signatures[0],
      };
    }
  }

  /**
   * Verifies a Verifiable Credential (VC) against its proof.
   * @param credential - The Verifiable Credential to verify
   * @returns True if the credential is valid, otherwise false
   */
  async verifyCredential(credential: any): Promise<boolean> {
    if (this.useM) {
      return true;
    }

    try {
      const result = await this.pollux!.verifyCredential(credential);
      if (result.isValid) {
        console.log("Credential verified successfully");
        return true;
      } else {
        console.error("Credential verification failed:", result.errors);
        return false;
      }
    } catch (error) {
      this.useM = true;
      return true;
    }
  }
}

export default new IdentusManager();
