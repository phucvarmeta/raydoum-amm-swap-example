import DLMM, {
  deriveCustomizablePermissionlessLbPair,
  LBCLMM_PROGRAM_IDS,
} from "@meteora-ag/dlmm";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { connection } from "./config";
import { seedLiquiditySingleBin } from "./libs/seed_liquidity_utils";
import {
  getAmountInLamports,
  getQuoteMint,
  safeParseKeypairFromFile,
} from "./libs/utils";
import { requestAirdrop } from "./utils";

export const seedBin = async (owner: Keypair, poolKey: PublicKey) => {
  try {
    const config = {
      dryRun: false,
      computeUnitPriceMicroLamports: 100000,
      quoteSymbol: "SOL",
      singleBinSeedLiquidity: {
        price: 0.0000017,
        priceRounding: "up",
        seedAmount: "100000",
        basePositionKeypairFilepath: "./local_accounts/position-owner.json",
        operatorKeypairFilepath: "./local_accounts/operator.json",
        positionOwner: "2vqFyczcehkR7hTeZjEkiN5jvYnFXuFRinovqR2gakSb",
        feeOwner: "2vqFyczcehkR7hTeZjEkiN5jvYnFXuFRinovqR2gakSb",
        lockReleasePoint: 0,
        seedTokenXToPositionOwner: true,
      },
    };

    const dlmmPool = await DLMM.create(connection, poolKey);

    console.log("\n> Initializing with general configuration...");
    console.log(`- Dry run = ${config.dryRun}`);
    console.log(`- Using payer ${owner.publicKey} to execute commands`);

    const DLMM_PROGRAM_ID = new PublicKey(LBCLMM_PROGRAM_IDS["devnet"]);

    const baseMint = dlmmPool.lbPair.tokenXMint;
    const baseMintAccount = await getMint(connection, baseMint);
    const baseDecimals = baseMintAccount.decimals;

    let quoteMint = getQuoteMint(config.quoteSymbol);

    console.log(`- Using base token mint ${baseMint.toString()}`);
    console.log(`- Using quote token mint ${quoteMint.toString()}`);
    console.log(`- Using pool key ${poolKey.toString()}`);

    const seedAmount = getAmountInLamports(
      config.singleBinSeedLiquidity.seedAmount,
      baseDecimals
    );
    const priceRounding = config.singleBinSeedLiquidity.priceRounding;
    if (priceRounding != "up" && priceRounding != "down") {
      throw new Error(
        "Invalid selective rounding value. Must be 'up' or 'down'"
      );
    }
    const baseKeypair = safeParseKeypairFromFile(
      config.singleBinSeedLiquidity.basePositionKeypairFilepath
    );
    const operatorKeypair = safeParseKeypairFromFile(
      config.singleBinSeedLiquidity.operatorKeypairFilepath
    );

    const price = config.singleBinSeedLiquidity.price;
    const positionOwner = new PublicKey(
      config.singleBinSeedLiquidity.positionOwner
    );
    const feeOwner = new PublicKey(config.singleBinSeedLiquidity.feeOwner);
    const lockReleasePoint = new BN(
      config.singleBinSeedLiquidity.lockReleasePoint
    );
    await requestAirdrop(connection, baseKeypair.publicKey);
    await requestAirdrop(connection, operatorKeypair.publicKey);
    await requestAirdrop(connection, feeOwner);
    await requestAirdrop(connection, positionOwner);
    const seedTokenXToPositionOwner =
      config.singleBinSeedLiquidity.seedTokenXToPositionOwner;

    await mintTo(
      connection,
      owner,
      dlmmPool.lbPair.tokenXMint,
      (
        await getOrCreateAssociatedTokenAccount(
          connection,
          operatorKeypair,
          dlmmPool.lbPair.tokenXMint,
          operatorKeypair.publicKey
        )
      ).address,
      owner.publicKey,
      5 * 10 ** 9
    );

    await seedLiquiditySingleBin(
      connection,
      owner,
      baseKeypair,
      operatorKeypair,
      positionOwner,
      feeOwner,
      baseMint,
      quoteMint,
      seedAmount,
      price,
      priceRounding,
      lockReleasePoint,
      seedTokenXToPositionOwner,
      config.dryRun,
      config.computeUnitPriceMicroLamports
    );
  } catch (error) {
    console.log("🚀 ~ seedBin ~ error:", error);
  }
};
