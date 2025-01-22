import { PublicKey, Keypair, AccountMeta, Connection } from "@solana/web3.js";
import BN from "bn.js";
import DLMM, { StrategyParameters } from "@meteora-ag/dlmm";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Idl, Program } from "@coral-xyz/anchor";
import { DLMM_PROGRAM_IDS } from "../libs/constants";

export const createDlmmSwapInstruction = async (
  connection: Connection,
  raydium: Raydium,
  program: Program<Idl>,
  user: Keypair,
  poolId: string,
  amountIn: number,
  slippage: number = 1
) => {
  // const POOL_ADDRESS = new PublicKey(
  //   "766eFWjVCuDgL3NrA2wsXCuLG1GPvauVu1g8RBNdcCS7"
  // ); // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all
  const POOL_ADDRESS = new PublicKey(poolId); // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all
  const dlmmPool = await DLMM.create(connection, POOL_ADDRESS);

  const swapAmount = new BN(100000000);
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
    user,
    dlmmPool.lbPair.tokenXMint,
    user.publicKey
  );
  const userTokenY = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    dlmmPool.lbPair.tokenYMint,
    user.publicKey
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
        user: user.publicKey,
        userTokenIn: userTokenY.address,
        userTokenOut: userTokenX.address,
        userTokenOutAta: userTokenX.address,
        oracle: dlmmPool.lbPair.oracle,
        dlmmProgram: DLMM_PROGRAM_IDS["devnet"],
        lbPair: dlmmPool.pubkey,
        hostFeeIn: null,
      })
      .remainingAccounts(binArrays)
      .instruction();

    return signature;
  } catch (error) {
    console.log("🚀 ~ swapDlmm ~ error:", error);
    return null;
  }
};
