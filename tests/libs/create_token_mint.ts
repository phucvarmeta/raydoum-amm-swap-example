import { Wallet } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionSignature,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  getMint,
} from "@solana/spl-token";
import { getAmountInLamports } from "./utils";
import { DEFAULT_COMMITMENT_LEVEL } from "./constants";

export interface CreateTokenMintOptions {
  dryRun: boolean;
  mintTokenAmount: string | number;
  decimals: number;
  computeUnitPriceMicroLamports: number;
}

export async function createTokenMint(
  connection: Connection,
  wallet: Keypair,
  options: CreateTokenMintOptions
): Promise<PublicKey> {
  if (options.dryRun) {
    throw new Error("cannot create token mint when in dry run mode");
  }

  const mintAmount = getAmountInLamports(
    options.mintTokenAmount,
    options.decimals
  ).toNumber();

  const mint: PublicKey = await createAndMintToken(
    connection,
    wallet,
    options.decimals,
    mintAmount,
    options.computeUnitPriceMicroLamports
  );

  const mintInfo = await getMint(connection, mint);
  console.log("🚀 ~ mintInfo:", mintInfo);

  console.log(
    `>> Mint token mint ${mint} to payer wallet. Amount ${options.mintTokenAmount} in lamport ${mintAmount}`
  );

  return mint;
}

async function createAndMintToken(
  connection: Connection,
  wallet: Keypair,
  mintDecimals: number,
  mintAmountLamport: number,
  computeUnitPriceMicroLamports: number
): Promise<PublicKey> {
  const mint = await createMintWithPriorityFee(
    connection,
    wallet,
    wallet.publicKey,
    null,
    mintDecimals,
    computeUnitPriceMicroLamports
  );

  const walletTokenATA = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey,
    true
  );
  await mintToWithPriorityFee(
    connection,
    wallet,
    mint,
    walletTokenATA.address,
    wallet.publicKey,
    mintAmountLamport,
    [],
    computeUnitPriceMicroLamports,
    {
      commitment: DEFAULT_COMMITMENT_LEVEL,
    }
  );

  return mint;
}

async function createMintWithPriorityFee(
  connection: Connection,
  payer: Signer,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number,
  computeUnitPriceMicroLamports: number,
  keypair = Keypair.generate(),
  confirmOptions?: ConfirmOptions,
  programId = TOKEN_PROGRAM_ID
): Promise<PublicKey> {
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const addPriorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: computeUnitPriceMicroLamports,
  });

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: keypair.publicKey,
    space: MINT_SIZE,
    lamports,
    programId,
  });

  const createInitializeMint2Tx = createInitializeMint2Instruction(
    keypair.publicKey,
    decimals,
    mintAuthority,
    freezeAuthority,
    programId
  );

  const transaction = new Transaction().add(
    addPriorityFeeIx,
    createAccountIx,
    createInitializeMint2Tx
  );

  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, keypair],
    confirmOptions
  );

  return keypair.publicKey;
}

async function mintToWithPriorityFee(
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  destination: PublicKey,
  authority: Signer | PublicKey,
  amount: number | bigint,
  multiSigners: Signer[] = [],
  computeUnitPriceMicroLamports: number,
  confirmOptions?: ConfirmOptions,
  programId = TOKEN_PROGRAM_ID
): Promise<TransactionSignature> {
  const [authorityPublicKey, signers] = getSigners(authority, multiSigners);

  const addPriorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: computeUnitPriceMicroLamports,
  });

  const transaction = new Transaction().add(
    addPriorityFeeIx,
    createMintToInstruction(
      mint,
      destination,
      authorityPublicKey,
      amount,
      multiSigners,
      programId
    )
  );

  return await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, ...signers],
    confirmOptions
  );
}

function getSigners(
  signerOrMultisig: Signer | PublicKey,
  multiSigners: Signer[]
): [PublicKey, Signer[]] {
  return signerOrMultisig instanceof PublicKey
    ? [signerOrMultisig, multiSigners]
    : [signerOrMultisig.publicKey, [signerOrMultisig]];
}
