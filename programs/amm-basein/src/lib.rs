use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use instructions::*;

pub mod errors;
pub mod instructions;
pub mod utils;

declare_id!("Aaz9GePyuVMTozYh2sXuYLaSHhubE8nYuwBqxSbGHo89");

#[program]
pub mod amm_basein {
    use super::*;

    #[error_code]
    pub enum MyError {
        #[msg("not profit")]
        NotProfit,
    }

    /// swap_base_in instruction
    pub fn proxy_swap_base_in(
        ctx: Context<ProxySwapBaseIn>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        let clone_account = ctx.accounts.user_token_source.clone();
        let mut account_data = clone_account.try_borrow_mut_data()?;
        let mut token_account = TokenAccount::try_deserialize(&mut account_data.as_ref())
            .expect("Error Deserializing Data");
        let before_balance = token_account.amount;
        msg!("balance before: {}", before_balance);
        // Release the borrow before moving ctx
        drop(account_data);

        instructions::swap_base_in(ctx, amount_in, minimum_amount_out)?;

        account_data = clone_account.try_borrow_mut_data()?;
        token_account = TokenAccount::try_deserialize(&mut account_data.as_ref())
            .expect("Error Deserializing Data");
        let after_balance = token_account.amount;
        msg!("balance after: {}", after_balance);

        require!(after_balance > before_balance, MyError::NotProfit);

        Ok(())
    }
    /// swap_base_in instruction
    pub fn proxy_swap_dlmm<'info>(
        ctx: Context<'_, '_, '_, 'info, DlmmSwap<'info>>,
        proxy_swap_base_in_index: u8,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::handle_dlmm_swap(ctx, proxy_swap_base_in_index, amount_in, minimum_amount_out)
    }
}
