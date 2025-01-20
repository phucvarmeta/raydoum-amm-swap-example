import {
  Cluster,
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";

import { BN } from "bn.js";
import DLMM, { deriveCustomizablePermissionlessLbPair } from "@meteora-ag/dlmm";
import { getMint } from "@solana/spl-token";
import { ActivationTypeConfig, PriceRoundingConfig } from "./config";
import {
  getDlmmActivationType,
  getDynamicAmmActivationType,
  getQuoteDecimals,
  isPriceRoundingUp,
  modifyComputeUnitPriceIx,
  runSimulateTransaction,
} from "./utils";
import { DLMM_PROGRAM_IDS } from "./constants";

export async function createPermissionlessDlmmPool(
  connection: Connection,
  owner: Keypair,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  opts?: {
    cluster?: Cluster | "localhost";
    programId?: PublicKey;
  }
) {
  console.log("\n> Initializing Permissionless DLMM pool...");
  const config = {
    dryRun: false,
    computeUnitPriceMicroLamports: 100000,
    quoteSymbol: "SOL",
    dlmm: {
      binStep: 400,
      feeBps: 200,
      initialPrice: 0.0000017,
      activationType: ActivationTypeConfig.Slot,
      activationPoint: null,
      priceRounding: PriceRoundingConfig.Up,
      hasAlphaVault: false,
    },
    createBaseToken: undefined,
    dynamicAmm: undefined,
    alphaVault: undefined,
    lockLiquidity: undefined,
    lfgSeedLiquidity: undefined,
    singleBinSeedLiquidity: undefined,
  };

  const binStep = config.dlmm.binStep;
  const feeBps = config.dlmm.feeBps;
  const hasAlphaVault = config.dlmm.hasAlphaVault;
  const activationPoint = config.dlmm.activationPoint
    ? new BN(config.dlmm.activationPoint)
    : null;

  const activationType = getDlmmActivationType(config.dlmm.activationType);

  console.log(`- Using binStep = ${binStep}`);
  console.log(`- Using feeBps = ${feeBps}`);
  console.log(`- Using initialPrice = ${config.dlmm.initialPrice}`);
  console.log(`- Using activationType = ${config.dlmm.activationType}`);
  console.log(`- Using activationPoint = ${activationPoint}`);
  console.log(`- Using hasAlphaVault = ${hasAlphaVault}`);

  const quoteDecimals = getQuoteDecimals(config.quoteSymbol);
  const baseMintAccount = await getMint(connection, baseMint);
  const baseDecimals = baseMintAccount.decimals;

  const initPrice = DLMM.getPricePerLamport(
    baseDecimals,
    quoteDecimals,
    config.dlmm.initialPrice
  );

  const activateBinId = DLMM.getBinIdFromPrice(
    initPrice,
    binStep,
    !isPriceRoundingUp(config.dlmm.priceRounding)
  );
  console.log("🚀 ~ activateBinId:", activateBinId);

  const cluster = opts?.cluster || "localhost";
  const dlmmProgramId =
    opts?.programId ?? new PublicKey(DLMM_PROGRAM_IDS[cluster]);

  const initPoolTx = await DLMM.createCustomizablePermissionlessLbPair(
    connection,
    new BN(binStep),
    baseMint,
    quoteMint,
    new BN(activateBinId.toString()),
    new BN(feeBps),
    activationType,
    hasAlphaVault,
    owner.publicKey,
    activationPoint,
    {
      cluster,
      programId: dlmmProgramId,
    }
  );
  modifyComputeUnitPriceIx(initPoolTx, config.computeUnitPriceMicroLamports);

  let poolKey: PublicKey;
  [poolKey] = deriveCustomizablePermissionlessLbPair(
    baseMint,
    quoteMint,
    dlmmProgramId
  );

  console.log(`\n> Pool address: ${poolKey}`);

  if (config.dryRun) {
    console.log(`\n> Simulating init pool tx...`);
    await runSimulateTransaction(connection, [owner], owner.publicKey, [
      initPoolTx,
    ]);
  } else {
    console.log(`>> Sending init pool transaction...`);
    let initPoolTxHash = await sendAndConfirmTransaction(
      connection,
      initPoolTx,
      [owner]
    ).catch((e) => {
      console.error(e);
      throw e;
    });
    console.log(
      `>>> Pool initialized successfully with tx hash: ${initPoolTxHash}`
    );
    return { poolKey };
  }
}
