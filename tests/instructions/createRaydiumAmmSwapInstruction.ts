import { Idl, Program } from "@coral-xyz/anchor";
import {
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
  fetchMultipleInfo,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import BN from "bn.js";
import { GLOBAL_INFO, init } from "../config";

export const createRaydiumAmmSwapInstruction = async (
  connection: Connection,
  raydium: Raydium,
  program: Program<Idl>,
  user: Keypair,
  poolId: string,
  amountIn: number,
  slippage: number = 1
) => {
  // const amountIn = 100;
  // const poolId = "3t9XjW4UpU4CxsiUKTXarFAtsdERZqSZTFzZD8CyK8mq";

  let poolInfo: ApiV3PoolInfoStandardItem | undefined;
  let poolKeys: AmmV4Keys | undefined;
  let rpcData: AmmRpcData;

  const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId });
  poolInfo = data.poolInfo;
  poolKeys = data.poolKeys;
  rpcData = data.poolRpcData;
  const res = await fetchMultipleInfo({
    connection: raydium.connection,
    poolKeysList: [poolKeys],
    config: undefined,
  });
  const pool = res[0];
  await raydium.liquidity.initLayout();
  const out = raydium.liquidity.computeAmountOut({
    poolInfo: {
      ...poolInfo,
      baseReserve: pool.baseReserve,
      quoteReserve: pool.quoteReserve,
      status: pool.status.toNumber(),
      version: 4,
    },
    amountIn: new BN(amountIn),
    mintIn: poolInfo.mintA.address, // swap mintB -> mintA, use: poolInfo.mintB.address
    mintOut: poolInfo.mintB.address, // swap mintB -> mintA, use: poolInfo.mintA.address
    slippage, // range: 1 ~ 0.0001, means 100% ~ 0.01%
  });
  let userCoinTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    new PublicKey(poolKeys.mintA.address),
    user.publicKey
  );
  const userPcCoinTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    new PublicKey(poolKeys.mintB.address),
    user.publicKey
  );
  const [marketVaultSigner] = await PublicKey.findProgramAddressSync(
    [new PublicKey(poolKeys.marketId).toBuffer()], // Seed: market public key
    GLOBAL_INFO.marketProgram // The market program ID
  );
  try {
    const tx = await program.methods
      .proxySwapBaseIn(
        new BN(amountIn), // amountIn
        out.minAmountOut // amountOut
      )
      .accounts({
        ammProgram: GLOBAL_INFO.ammProgram,
        amm: poolId,
        ammAuthority: poolKeys.authority,
        ammOpenOrders: poolKeys.openOrders,
        ammCoinVault: rpcData.baseVault,
        ammPcVault: rpcData.quoteVault,
        marketProgram: GLOBAL_INFO.marketProgram,
        market: poolKeys.marketId,
        marketBids: poolKeys.marketBids,
        marketAsks: poolKeys.marketAsks,
        marketEventQueue: poolKeys.marketEventQueue,
        marketCoinVault: poolKeys.marketBaseVault,
        marketPcVault: poolKeys.marketQuoteVault,
        marketVaultSigner: marketVaultSigner,
        userTokenSource: userCoinTokenAccount.address,
        userTokenDestination: userPcCoinTokenAccount.address,
        userSourceOwner: user.publicKey,
      })
      .instruction();

    return tx;
  } catch (error) {
    console.log("🚀 ~ swap ~ error:", error);
    return null;
  }
};
