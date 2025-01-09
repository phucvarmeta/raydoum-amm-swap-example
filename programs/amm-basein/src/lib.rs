use anchor_lang::prelude::*;
use instructions::*;

pub mod instructions;

declare_id!("5RThBYsqEfSmA39fH6RPrCPY2CmUnVNZZqG91qzybbTx");

#[program]
pub mod amm_basein {
    use super::*;

    /// swap_base_in instruction
    pub fn proxy_swap_base_in(
        ctx: Context<ProxySwapBaseIn>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::swap_base_in(ctx, amount_in, minimum_amount_out)
    }
}
