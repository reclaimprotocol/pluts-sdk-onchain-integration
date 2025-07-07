import { Button } from "@chakra-ui/react";
import { useWallet, CardanoWallet } from "@meshsdk/react";

export default function ConnectionHandler() {
  const { connected, connect, disconnect } = useWallet();

  return (
    <>
    
      {connected ? (
        <Button size="lg" colorScheme="blue" onClick={disconnect}>
          Disconnect
        </Button>
      ) : (
        <>
          <CardanoWallet
            label={"Connect a Wallet"}
            onConnected={() => {}}
            //@ts-ignore
            metamask={{ network: "preprod" }}
          />
        </>
      )}
    </>
  );
}
