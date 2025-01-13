// import { createMint } from "@solana/spl-token";
// import { Keypair } from "@solana/web3.js";
// import path from "path";
// import { readFile } from "fs/promises";
// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { AmmBasein } from "../target/types/amm_basein";

// export const getCurrentWallet = async (filepath?: string) => {
//   if (!filepath) {
//     // Default value from Solana CLI
//     filepath = "~/.config/solana/id.json";
//   }
//   if (filepath[0] === "~") {
//     const home = process.env.HOME || null;
//     if (home) {
//       filepath = path.join(home, filepath.slice(1));
//     }
//   }

//   const fileContents = (await readFile(filepath)).toString();
//   return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fileContents)));
// };

// const createPool = async (
//   provider: anchor.AnchorProvider,
//   program: Program<AmmBasein>
// ) => {
//   const currentWallet = await getCurrentWallet();

//   let tokenAMint = await createMint(
//     provider.connection,
//     currentWallet,
//     currentWallet.publicKey,
//     currentWallet.publicKey,
//     9
//   );
//   let tokenBMint = await createMint(
//     provider.connection,
//     currentWallet,
//     currentWallet.publicKey,
//     currentWallet.publicKey,
//     9
//   );

//   // nonce: u8,
//   //   open_time: u64,
//   //   init_pc_amount: u64,
//   //   init_coin_amount: u64,
//   const tx = program.methods
//     .proxyInitialize()
//     .accounts({
//       amm: "",
//       ammAuthority: "",
//       ammCoinMint: "",
//       ammCoinVault: "",
//       ammConfig: "",
//       ammLpMint: "",
//       ammOpenOrders: "",
//       ammPcMint: "",
//       ammPcVault: "",
//       ammProgram: "",
//       ammTargetOrders: "",
//       userTokenCoin: "",
//       userTokenLp: "",
//       userTokenPc: "",
//       userWallet: "",
//       createFeeDestination: "",
//       market: "",
//     })
//     .transaction();
// };
