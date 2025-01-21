import {
  Raydium,
  TxVersion,
  parseTokenAccountResp,
} from "@raydium-io/raydium-sdk-v2";
import { Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getCurrentWallet } from "./utils";
import * as anchor from "@coral-xyz/anchor";
import { AmmBasein } from "../target/types/amm_basein";
import { Program, Idl } from "@coral-xyz/anchor";
import idl from "../target/idl/amm_basein.json";

export const txVersion = TxVersion.V0; // or TxVersion.LEGACY
const cluster = "devnet"; // 'mainnet' | 'devnet'

let raydium: Raydium | undefined;
export const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

export const init = async (params?: { loadToken?: boolean }) => {
  const owner = await getCurrentWallet();
  const customWallet = new anchor.Wallet(owner);
  const customProvider = new anchor.AnchorProvider(connection, customWallet, {
    preflightCommitment: "confirmed",
  });
  const program = new Program(
    idl as Idl,
    "97Ld8XGfiBPSqDxu7cttEQSS24m9qGMU1efwkT7Y8mvu",
    customProvider
  );
  anchor.setProvider(customProvider);

  if (raydium) return { raydium, customProvider, program };

  console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`);
  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: "finalized",
  });
  return { raydium, customProvider, program, owner };
};

export const fetchTokenAccountData = async () => {
  const owner = await getCurrentWallet();

  const solAccountResp = await connection.getAccountInfo(owner.publicKey);
  const tokenAccountResp = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );
  const token2022Req = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID }
  );
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  });
  return tokenAccountData;
};

export const grpcUrl = "<YOUR_GRPC_URL>";
export const grpcToken = "<YOUR_GRPC_TOKEN>";
