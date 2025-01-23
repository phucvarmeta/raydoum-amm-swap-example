import { PublicKey, Keypair, AccountMeta, Connection } from "@solana/web3.js";
import BN from "bn.js";
import DLMM from "@meteora-ag/dlmm";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { CLUSTER, DLMM_PROGRAM_IDS } from "../constants";

export const getDlmmSwapArgs = async (
  connection: Connection,
  user: Keypair,
  poolId: string,
  swapXtoY: boolean,
  amountIn: number,
  slippage: number = 100
) => {
  // const POOL_ADDRESS = new PublicKey(
  //   "766eFWjVCuDgL3NrA2wsXCuLG1GPvauVu1g8RBNdcCS7"
  // ); // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all
  const POOL_ADDRESS = new PublicKey(poolId); // You can get your desired pool address from the API https://dlmm-api.meteora.ag/pair/all
  const DLMM_PROGRAM_ID = new PublicKey(DLMM_PROGRAM_IDS[CLUSTER]);
  const dlmmPool = await DLMM.create(connection, POOL_ADDRESS);

  const swapAmount = new BN(amountIn);
  // Swap quote
  const binArrays = await dlmmPool.getBinArrayForSwap(swapXtoY);
  const swapQuote = dlmmPool.swapQuote(
    swapAmount,
    swapXtoY,
    new BN(slippage),
    binArrays
  );

  swapQuote.outAmount;

  const seed = Buffer.from("__event_authority");

  const [eventAuthority] = PublicKey.findProgramAddressSync(
    [seed],
    DLMM_PROGRAM_ID
  );

  try {
    const binArrays: AccountMeta[] = swapQuote.binArraysPubkey.map((pubkey) => {
      return {
        isSigner: false,
        isWritable: true,
        pubkey,
      };
    });

    return {
      data: {},
      accounts: {
        binArrayBitmapExtension: null,
        eventAuthority: eventAuthority,
        reserveY: dlmmPool.lbPair.reserveY,
        tokenYMint: dlmmPool.lbPair.tokenYMint,
        tokenXMint: dlmmPool.lbPair.tokenXMint,
        reserveX: dlmmPool.lbPair.reserveX,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        user: user.publicKey,
        oracle: dlmmPool.lbPair.oracle,
        dlmmProgram: DLMM_PROGRAM_ID,
        lbPair: dlmmPool.pubkey,
        hostFeeIn: null,
      },
      remainingAccounts: binArrays,
    };
  } catch (error) {
    console.log("🚀 ~ swapDlmm ~ error:", error);
    return null;
  }
};
