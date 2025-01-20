import {
  RAYMint,
  USDCMint,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import { createMint } from "@solana/spl-token";
import { connection, init, txVersion } from "./config";

export const createMarket = async () => {
  const { raydium, customProvider, owner } = await init();

  // check mint info here: https://api-v3.raydium.io/mint/list
  // or get mint info by api: await raydium.token.getTokenInfo('mint address')

  const mintA = await createMint(
    connection,
    owner,
    owner.publicKey,
    owner.publicKey,
    9
  );

  const mintB = await createMint(
    connection,
    owner,
    owner.publicKey,
    owner.publicKey,
    9
  );
  console.log("🚀 ~ createMarket ~ mintB:", mintB);

  const { execute, extInfo, transactions } = await raydium.marketV2.create({
    baseInfo: {
      mint: mintA,
      decimals: 6,
    },
    quoteInfo: {
      mint: mintB,
      decimals: 9,
    },
    lotSize: 1,
    tickSize: 0.01,
    // dexProgramId: OPEN_BOOK_PROGRAM,
    dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet
    txVersion,
    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 100000000,
    // },
  });

  console.log(
    `create market total ${transactions.length} txs, market info: `,
    Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
      }),
      {}
    )
  );

  const txIds = await execute({
    sendAndConfirm: true,
    // set sequentially to true means tx will be sent when previous one confirmed
    sequentially: true,
    // recentBlockHash: latestBlockHash.blockhash,
  });
  console.log("create market txIds:", txIds);
};

/** uncomment code below to execute */
// createMarket()
