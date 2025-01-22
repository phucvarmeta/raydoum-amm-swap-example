import {
  PublicKey,
  sendAndConfirmTransaction,
  Keypair,
  AccountMeta,
} from "@solana/web3.js";
import { connection, init } from "../config";
import BN from "bn.js";
import DLMM from "@meteora-ag/dlmm";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { DLMM_PROGRAM_IDS } from "../constants";

export const swapDlmm = async () => {
  const { owner, program } = await init();
  console.log("🚀 ~ swapDlmm ~ owner:", owner);

  // const a = await DLMM.getLbPairs(connection, {
  //   cluster: "devnet",
  // });
  // console.log(
  //   "🚀 ~ swapDlmm ~ a:",
  //   a.filter(
  //     (item) =>
  //       item.account.tokenXMint.toString() ===
  //       "x2iv8BgzTLCnso9CnG2QuBgAJ2VyAtdwMmXqHpjRC2T"
  //   )
  // );

  const POOL_ADDRESS = new PublicKey(
    "2dPLDdZd957tPPaeGaXNoAKvEY1X36PtUu5GwbnF7Vay"
  ); // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all
  const dlmmPool = await DLMM.create(connection, POOL_ADDRESS);
  console.log("🚀 ~ swapDlmm ~ dlmmPool: abc", dlmmPool.pubkey.toString());

  const swapAmount = new BN(100);
  // Swap quote
  const swapXtoY = false;
  const binArrays = await dlmmPool.getBinArrayForSwap(swapXtoY);
  // const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
  const swapQuote = await dlmmPool.swapQuote(
    swapAmount,
    swapXtoY,
    new BN(10),
    binArrays
  );
  // console.log("🚀 ~ swapDlmm ~ swapQuote:", swapQuote);

  const userTokenX = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    dlmmPool.lbPair.tokenXMint,
    owner.publicKey
  );
  const userTokenY = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    dlmmPool.lbPair.tokenYMint,
    owner.publicKey
  );

  const seed = Buffer.from("__event_authority");

  const [eventAuthority] = PublicKey.findProgramAddressSync(
    [seed],
    new PublicKey(DLMM_PROGRAM_IDS["devnet"])
  );

  try {
    const binArrays: AccountMeta[] = swapQuote.binArraysPubkey.map((pubkey) => {
      return {
        isSigner: false,
        isWritable: true,
        pubkey,
      };
    });

    const signature = await program.methods
      .proxySwapDlmm(swapAmount, swapQuote.minOutAmount)
      .accounts({
        binArrayBitmapExtension: null,
        eventAuthority: eventAuthority,
        reserveY: dlmmPool.lbPair.reserveY,
        tokenYMint: dlmmPool.lbPair.tokenYMint,
        tokenXMint: dlmmPool.lbPair.tokenXMint,
        reserveX: dlmmPool.lbPair.reserveX,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        user: owner.publicKey,
        userTokenIn: userTokenY.address,
        userTokenOut: userTokenX.address,
        oracle: dlmmPool.lbPair.oracle,
        dlmmProgram: DLMM_PROGRAM_IDS["devnet"],
        lbPair: dlmmPool.pubkey,
        hostFeeIn: null,
      })
      .remainingAccounts(binArrays)
      .signers([owner])
      .rpc({ commitment: "confirmed" });
  } catch (error) {
    console.log("🚀 ~ swapDlmm ~ error:", error);
    return null;
  }
};
