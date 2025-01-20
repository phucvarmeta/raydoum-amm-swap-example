import {
  MARKET_STATE_LAYOUT_V3,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import { connection, init, txVersion } from "./config";
import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

export const createAmmPool = async () => {
  try {
    const { raydium, owner } = await init();
    const marketId = new PublicKey(
      `95WubCfUGMu7fS4JLgxrZdKYQ2zYjPLcTerze837mMka`
    );

    // if you are confirmed your market info, don't have to get market info from rpc below
    const marketBufferInfo = await raydium.connection.getAccountInfo(marketId);

    const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(
      marketBufferInfo!.data
    );

    const tokenAccountA = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      baseMint,
      owner.publicKey
    );
    const tokenAccountB = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      quoteMint,
      owner.publicKey
    );

    // check mint info here: https://api-v3.raydium.io/mint/list
    // or get mint info by api: await raydium.token.getTokenInfo('mint address')

    const baseMintInfo = await raydium.token.getTokenInfo(baseMint);
    const quoteMintInfo = await raydium.token.getTokenInfo(quoteMint);

    await mintTo(
      connection,
      owner,
      baseMint,
      tokenAccountA.address,
      owner.publicKey,
      5 * 10 ** 9
    );
    await mintTo(
      connection,
      owner,
      quoteMint,
      tokenAccountB.address,
      owner.publicKey,
      5 * 10 ** 9
    );

    const { execute, extInfo } = await raydium.liquidity.createPoolV4({
      // programId: AMM_V4,
      programId: DEVNET_PROGRAM_ID.AmmV4, // devnet
      marketInfo: {
        marketId,
        // programId: OPEN_BOOK_PROGRAM,
        programId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devent
      },
      baseMintInfo: {
        mint: baseMint,
        decimals: baseMintInfo.decimals, // if you know mint decimals here, can pass number directly
      },
      quoteMintInfo: {
        mint: quoteMint,
        decimals: quoteMintInfo.decimals, // if you know mint decimals here, can pass number directly
      },
      // baseAmount: new BN(1000),
      // quoteAmount: new BN(1000),

      // sol devnet faucet: https://faucet.solana.com/
      baseAmount: new BN(4 * 10 ** 9), // if devent pool with sol/wsol, better use amount >= 4*10**9
      quoteAmount: new BN(4 * 10 ** 9), // if devent pool with sol/wsol, better use amount >= 4*10**9

      startTime: new BN(0), // unit in seconds
      ownerInfo: {
        useSOLBalance: true,
      },
      associatedOnly: false,
      txVersion,
      // feeDestinationId: FEE_DESTINATION_ID,
      feeDestinationId: DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
      // optional: set up priority fee here
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 10000000,
      // },
    });

    console.log(
      `create market total 1 txs, market info: `,
      Object.keys(extInfo.address).reduce(
        (acc, cur) => ({
          ...acc,
          [cur]:
            extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
        }),
        {}
      )
    );

    let latestBlockHash = await connection.getLatestBlockhash();

    console.log(
      "poolKeys:",
      Object.keys(extInfo.address).reduce(
        (acc, cur) => ({
          ...acc,
          [cur]:
            extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
        }),
        {}
      )
    );
    const { txId } = await execute({
      sendAndConfirm: true,
      recentBlockHash: latestBlockHash.blockhash,
    });
    console.log("🚀 ~ createAmmPool ~ txId:", txId);
  } catch (error) {
    console.log("🚀 ~ createAmmPool ~ error:", error);
  }
};

/** uncomment code below to execute */
// createAmmPool();
