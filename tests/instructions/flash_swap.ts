import { init } from "../config";
import { confirmTransaction } from "../utils/utils";
import { getDlmmSwapArgs } from "../utils/getDlmmSwapArgs";
import { getRaydiumSwapArgs } from "../utils/getRaydiumAmmSwapArgs";

export async function flashSwap() {
  const { provider, raydium, owner, program } = await init();

  const { accounts: raydiumAccounts, data: raydiumDatas } =
    await getRaydiumSwapArgs(
      provider.connection,
      raydium,
      owner,
      "RAYDIUM_POOL_ID",
      100, // Amount in
      0 // Slippage
    );

  const { accounts: dlmmAccounts, remainingAccounts } = await getDlmmSwapArgs(
    provider.connection,
    owner,
    "DLMM_POOL_ID",
    true,
    Number(raydiumDatas.amountOut.toString()), // Amount in
    0 // Slippage
  );

  const signature = await program.methods
    .flashSwap(raydiumDatas.amountIn, raydiumDatas.minAmountOut)
    .accounts({
      ...raydiumAccounts,
      ...dlmmAccounts,
    })
    .remainingAccounts(remainingAccounts)
    .signers([owner])
    .rpc();

  await confirmTransaction(provider.connection, signature);
}
