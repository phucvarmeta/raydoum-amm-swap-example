import { PublicKey } from "@solana/web3.js";
import {
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
  fetchMultipleInfo,
} from "@raydium-io/raydium-sdk-v2";
import { connection, init } from "./config";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import BN from "bn.js";

const globalInfo = {
  marketProgram: new PublicKey("EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj"),
  ammProgram: new PublicKey("HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8"),
  ammCreateFeeDestination: new PublicKey(
    "3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"
  ),
};

export const swap = async () => {
  const { raydium, program, owner } = await init();
  const amountIn = 100;
  const poolId = "3t9XjW4UpU4CxsiUKTXarFAtsdERZqSZTFzZD8CyK8mq";

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
    slippage: 0.01, // range: 1 ~ 0.0001, means 100% ~ 0.01%
  });
  out.amountOut;
  let userCoinTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    new PublicKey(poolKeys.mintA.address),
    owner.publicKey
  );
  const amountABefore = userCoinTokenAccount.amount;
  console.log("Amount A before", amountABefore);
  const userPcCoinTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    new PublicKey(poolKeys.mintB.address),
    owner.publicKey
  );
  const [marketVaultSigner] = await PublicKey.findProgramAddressSync(
    [new PublicKey(poolKeys.marketId).toBuffer()], // Seed: market public key
    globalInfo.marketProgram // The market program ID
  );
  try {
    const tx = await program.methods
      .proxySwapBaseIn(
        new BN(amountIn), // amountIn
        out.minAmountOut // amountOut
      )
      .accounts({
        ammProgram: globalInfo.ammProgram,
        amm: poolId,
        ammAuthority: poolKeys.authority,
        ammOpenOrders: poolKeys.openOrders,
        ammCoinVault: rpcData.baseVault,
        ammPcVault: rpcData.quoteVault,
        marketProgram: globalInfo.marketProgram,
        market: poolKeys.marketId,
        marketBids: poolKeys.marketBids,
        marketAsks: poolKeys.marketAsks,
        marketEventQueue: poolKeys.marketEventQueue,
        marketCoinVault: poolKeys.marketBaseVault,
        marketPcVault: poolKeys.marketQuoteVault,
        marketVaultSigner: marketVaultSigner,
        userTokenSource: userCoinTokenAccount.address,
        userTokenDestination: userPcCoinTokenAccount.address,
        userSourceOwner: owner.publicKey,
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    userCoinTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      new PublicKey(poolKeys.mintA.address),
      owner.publicKey
    );
    const amountAAfter = userCoinTokenAccount.amount;

    return tx;
  } catch (error) {
    console.log("🚀 ~ swap ~ error:", error);
    return null;
  }
};
