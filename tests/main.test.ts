import * as anchor from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import DLMM from "@meteora-ag/dlmm";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { connection, init } from "./config";
import { createAmmPool } from "./create_amm_pool";
import { createMarket } from "./create_market";
import { createPermissionlessDlmmPool } from "./libs/create_pool_utils";
import { createTokenMint } from "./libs/create_token_mint";
import { getQuoteMint } from "./libs/utils";
import { seedBin } from "./seed_liquidity_single_bin";
import { swap } from "./swap";
import { swapDlmm } from "./swap_dlmm";

const confirmOptions = {
  skipPreflight: true,
};

describe("amm-proxy", () => {
  // it("create market!", async () => {
  //   // createMarket();
  //   // createMarketV1();
  // });
  // it("create pool!", async () => {
  //   //  createAmmPool();
  // });
  it("create pool!", async () => {
    // const { owner } = await init();
    // console.log("🚀 ~ it ~ owner:", owner.secretKey.toString());
    // var string = bs58.encode(owner.secretKey);
    // console.log("🚀 ~ it ~ string:", string);

    // let ownerTokenX = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   owner,
    //   dlmmPool.lbPair.tokenXMint,
    //   owner.publicKey
    // );

    // await mintTo(
    //   connection,
    //   owner,
    //   dlmmPool.lbPair.tokenXMint,
    //   ownerTokenX.address,
    //   owner.publicKey,
    //   5 * 10 ** 9
    // );

    // ownerTokenX = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   owner,
    //   dlmmPool.lbPair.tokenXMint,
    //   owner.publicKey
    // );
    // console.log("🚀 ~ it ~ ownerTokenX:", ownerTokenX);

    // console.log("🚀 ~ it ~ dlmmPool:", dlmmPool.lbPair);
    // await swap();
    // getLBPairBySingleToken("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

    // const baseMint = await createTokenMint(connection, owner, {
    //   dryRun: false,
    //   mintTokenAmount: 1000000,
    //   decimals: 9,
    //   computeUnitPriceMicroLamports: 100000,
    // });

    // const account = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   owner,
    //   baseMint,
    //   owner.publicKey
    // );

    // let quoteMint = getQuoteMint("SOL");

    // const { poolKey } = await createPermissionlessDlmmPool(
    //   connection,
    //   owner,
    //   baseMint,
    //   quoteMint,
    //   {
    //     cluster: "localhost",
    //   }
    // );
    // const POOL_ADDRESS = poolKey;
    // const dlmmPool = await DLMM.create(connection, POOL_ADDRESS);
    // console.log("🚀 ~ it ~ dlmmPool:", dlmmPool.lbPair);
    // console.log(
    //   "🚀 ~ it ~ dlmmPool:",
    //   dlmmPool.lbPair.activationPoint.toNumber()
    // );

    // await seedBin(owner, poolKey);

    await swapDlmm();

    // const swapTx = await swap();
    // const swapDlmmTx = await swapDlmm();
    // let latestBlockHash = await connection.getLatestBlockhash();
    // const transaction = new Transaction({
    //   blockhash: latestBlockHash.blockhash,
    //   lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    // });
    // transaction.add(swapTx);
    // transaction.add(swapDlmmTx);
    // transaction.sign(owner);
    // const signature = await connection.sendRawTransaction(
    //   transaction.serialize()
    // );
    // latestBlockHash = await connection.getLatestBlockhash();
    // await connection.confirmTransaction({
    //   signature: signature,
    //   blockhash: latestBlockHash.blockhash,
    //   lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    // });
  });
});
