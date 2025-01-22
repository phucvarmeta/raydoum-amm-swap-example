import {
  Raydium,
  TxVersion,
  parseTokenAccountResp,
} from "@raydium-io/raydium-sdk-v2";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getCurrentWallet } from "./utils";
import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import idl from "../target/idl/amm_basein.json";

export const txVersion = TxVersion.V0; // or TxVersion.LEGACY
const cluster = "devnet"; // 'mainnet' | 'devnet'

let raydium: Raydium | undefined;
export const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

export const PROGRAM_ID = "97Ld8XGfiBPSqDxu7cttEQSS24m9qGMU1efwkT7Y8mvu";

export interface TestProvider {
  raydium: Raydium;
  provider: anchor.AnchorProvider;
  program: anchor.Program<anchor.Idl>;
  owner: anchor.web3.Keypair;
}

export const GLOBAL_INFO = {
  marketProgram: new PublicKey("EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj"),
  ammProgram: new PublicKey("HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8"),
  ammCreateFeeDestination: new PublicKey(
    "3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"
  ),
};

export const init = async (params?: {
  loadToken?: boolean;
}): Promise<TestProvider> => {
  const owner = await getCurrentWallet();
  const customWallet = new anchor.Wallet(owner);
  const customProvider = new anchor.AnchorProvider(connection, customWallet, {
    preflightCommitment: "confirmed",
  });
  const program = new Program(idl as Idl, PROGRAM_ID, customProvider);
  anchor.setProvider(customProvider);

  if (raydium) return { raydium, provider: customProvider, program, owner };

  console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`);
  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: "finalized",
  });
  return { raydium, provider: customProvider, program, owner };
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
