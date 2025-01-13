import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createAmmPool } from "./create_amm_pool";
import { createMarket } from "./create_market";
import { swap } from "./swap";

const globalInfo = {
  marketProgram: new PublicKey("EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj"),
  ammProgram: new PublicKey("HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8"),
  ammCreateFeeDestination: new PublicKey(
    "3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"
  ),
  market: new Keypair(),
};

const confirmOptions = {
  skipPreflight: true,
};

describe("amm-proxy", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const marketId = globalInfo.market.publicKey.toString();
  console.log("market:", marketId.toString());
  it("create market!", async () => {
    // createMarket();
    // createMarketV1();
  });
  it("create pool!", async () => {
    // createAmmPool();
  });
  it("create pool!", async () => {
    swap();
  });
});
