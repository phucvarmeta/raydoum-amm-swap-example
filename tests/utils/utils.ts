import {
  Keypair,
  PublicKey,
  Transaction,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  AMM_V4,
  AMM_STABLE,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import { readFile } from "fs/promises";
import path from "path";

const VALID_PROGRAM_ID = new Set([
  AMM_V4.toBase58(),
  AMM_STABLE.toBase58(),
  DEVNET_PROGRAM_ID.AmmV4.toBase58(),
  DEVNET_PROGRAM_ID.AmmStable.toBase58(),
]);

export const isValidAmm = (id: string) => VALID_PROGRAM_ID.has(id);

export const getCurrentWallet = async (filepath?: string) => {
  if (!filepath) {
    // Default value from Solana CLI
    filepath = "~/.config/solana/id.json";
  }
  if (filepath[0] === "~") {
    const home = process.env.HOME || null;
    if (home) {
      filepath = path.join(home, filepath.slice(1));
    }
  }

  const fileContents = (await readFile(filepath)).toString();
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fileContents)));
};

export const requestAirdrop = async (
  connection: Connection,
  address: PublicKey,
  lamports: number = LAMPORTS_PER_SOL
) => {
  let latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    signature: await connection.requestAirdrop(address, lamports),
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  });
};

export const confirmTransaction = async (connection, txSignature: string) => {
  let latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  });
};
