use anchor_lang::prelude::*;
use instructions::*;

pub mod instructions;

declare_id!("A6VexJygb6obTvB6UX7S6GjjewDBfU7igR4TRfAWxvXT");

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
    /// swap_base_in instruction
    pub fn proxy_swap_dlmm<'info>(
        ctx: Context<'_, '_, '_, 'info, DlmmSwap<'info>>,
        minimum_amount_out_percent: u64,
    ) -> Result<()> {
        instructions::handle_dlmm_swap(ctx, minimum_amount_out_percent)
    }
}
