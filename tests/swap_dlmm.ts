import { PublicKey, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import { connection, init } from "./config";
import BN from "bn.js";
import DLMM, { StrategyParameters } from "@meteora-ag/dlmm";

export const swapDlmm = async () => {
  const { owner } = await init();

  const POOL_ADDRESS = new PublicKey(
    "7bA2uEzHZpazFHMrAw1xhhR3kZefCTasRdLXh2cJvYob"
  ); // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all
  const dlmmPool = await DLMM.create(connection, POOL_ADDRESS);

  console.log("🚀 ~ swapDlmm ~ dlmmPool:", dlmmPool.lbPair);
  // const swapAmount = new BN(1);
  // // Swap quote
  // const swapYtoX = false;
  // const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
  // console.log("🚀 ~ swapDlmm ~ binArrays:", binArrays);
  // const swapQuote = await dlmmPool.swapQuote(
  //   swapAmount,
  //   swapYtoX,
  //   new BN(1),
  //   binArrays
  // );

  // try {
  //   // Swap
  //   const swapTx = await dlmmPool.swap({
  //     inToken: dlmmPool.tokenX.publicKey,
  //     binArraysPubkey: swapQuote.binArraysPubkey,
  //     inAmount: swapAmount,
  //     lbPair: dlmmPool.pubkey,
  //     user: owner.publicKey,
  //     minOutAmount: swapQuote.minOutAmount,
  //     outToken: dlmmPool.tokenY.publicKey,
  //   });
  //   swapTx.feePayer = owner.publicKey;
  //   swapTx.sign(owner);

  //   await sendAndConfirmTransaction(connection, swapTx, [owner]);

  //   return swapTx;
  // } catch (error) {
  //   return null;
  // }
};
