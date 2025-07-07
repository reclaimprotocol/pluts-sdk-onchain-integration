import {
  ProtocolParamters,
  TxBuilder,
  defaultProtocolParameters,
} from "@harmoniclabs/plu-ts";
import { koios } from "./koios";

/**
 * we don't want to do too many API call if we already have our `txBuilder`
 *
 * so after the first call we'll store a copy here.
 **/
let _cachedTxBuilder: TxBuilder | undefined = undefined;

export default async function getTxBuilder(): Promise<TxBuilder> {
  if (!(_cachedTxBuilder instanceof TxBuilder)) {
    const pp =
      (await koios.epoch.protocolParams()) as Readonly<ProtocolParamters>;

    try {
      // just in kase koios returns protocol paramters that don't look good
      //@ts-ignore
      _cachedTxBuilder = new TxBuilder(pp);
    } catch {
      // if that happens then use the default protocol paramters
      // !!! IMPORTANT !!! use only as fallback;
      // parameters might (and will) change from the real world
      //@ts-ignore
      _cachedTxBuilder = new TxBuilder(defaultProtocolParameters);
    }
  }

  return _cachedTxBuilder;
}
