use anchor_lang::prelude::*;
use instructions::*;

pub mod errors;
pub mod instructions;
pub mod utils;

declare_id!("En4ePE1rLRxZHFe7c49ChZE3wwJAfdELNjWW9yydxfFA");

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
        amount_in: u64,
        minimum_amount_out: u64,
        // proxy_swap_base_in_index: u8,
        // token_a_amount_begin: u64,
        // raydium_amount_in: u64,
    ) -> Result<()> {
        instructions::handle_dlmm_swap(
            ctx,
            amount_in,
            minimum_amount_out,
            // proxy_swap_base_in_index,
            // token_a_amount_begin,
            // raydium_amount_in,
        )
    }
}
