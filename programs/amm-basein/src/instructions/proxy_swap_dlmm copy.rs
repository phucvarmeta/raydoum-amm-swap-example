use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::token::TokenAccount;
use dlmm::instruction::{self as SwapInstruction, Swap as SwapArgs};
use solana_program::instruction::Instruction;

#[derive(Accounts)]
pub struct DlmmSwap<'info> {
    #[account(mut)]
    /// CHECK: The pool account
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK: Bin array extension account of the pool
    pub bin_array_bitmap_extension: Option<UncheckedAccount<'info>>,

    #[account(mut)]
    /// CHECK: Reserve account of token X
    pub reserve_x: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Reserve account of token Y
    pub reserve_y: UncheckedAccount<'info>,

    /// CHECK: User who's executing the swap
    pub user: Signer<'info>,

    // #[account(address = dlmm::ID)]
    /// CHECK: DLMM program
    pub dlmm_program: UncheckedAccount<'info>,

    /// CHECK: DLMM program event authority for event CPI
    pub event_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: User token account to sell token
    pub user_token_in: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: User token account to buy token
    pub user_token_out: UncheckedAccount<'info>,

    /// CHECK: Mint account of token X
    pub token_x_mint: UncheckedAccount<'info>,
    /// CHECK: Mint account of token Y
    pub token_y_mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Oracle account of the pool
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Referral fee account
    pub host_fee_in: Option<UncheckedAccount<'info>>,

    /// CHECK: Token program of mint X
    pub token_x_program: UncheckedAccount<'info>,
    /// CHECK: Token program of mint Y
    pub token_y_program: UncheckedAccount<'info>,
    // Bin arrays need to be passed using remaining accounts
    pub user_token_out_ata: Box<Account<'info, TokenAccount>>,
    // /// CHECK:  Sysvar info
    // #[account(address = sysvar::instructions::ID)]
    // pub sysvar_info: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

fn to_account_info<'info>(account: Option<&UncheckedAccount<'info>>) -> Option<AccountInfo<'info>> {
    account.map(|acc| acc.to_account_info())
}

/// Executes a DLMM swap
///
/// # Arguments
///
/// * `ctx` - The context containing accounts and programs.
/// * `amount_in` - The amount of input tokens to be swapped.
/// * `min_amount_out` - The minimum amount of output tokens expected a.k.a slippage
///
/// # Returns
///
/// Returns a `Result` indicating success or failure.
pub fn handle_dlmm_swap<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, DlmmSwap<'info>>,
    amount_in: u64,
    min_amount_out: u64,
    // proxy_swap_base_in_index: u8,
    // token_a_amount_begin: u64,
    // amm_amount_in: u64,
) -> Result<()> {
    // Define the accounts to pass to the CPI
    // let mut account_metas = vec![
    //     AccountMeta::new(ctx.accounts.lb_pair.key(), false),
    //     AccountMeta::new_readonly(
    //         ctx.accounts
    //             .bin_array_bitmap_extension
    //             .as_ref()
    //             .map_or(Pubkey::default(), |acc| acc.key()),
    //         ctx.accounts.bin_array_bitmap_extension.is_some(),
    //     ),
    //     AccountMeta::new(ctx.accounts.reserve_x.key(), false),
    //     AccountMeta::new(ctx.accounts.reserve_y.key(), false),
    //     AccountMeta::new(ctx.accounts.user_token_in.key(), false),
    //     AccountMeta::new(ctx.accounts.user_token_out.key(), false),
    //     AccountMeta::new_readonly(ctx.accounts.token_x_mint.key(), false),
    //     AccountMeta::new_readonly(ctx.accounts.token_y_mint.key(), false),
    //     AccountMeta::new(ctx.accounts.oracle.key(), false),
    //     AccountMeta::new_readonly(
    //         ctx.accounts
    //             .host_fee_in
    //             .as_ref()
    //             .map_or(Pubkey::default(), |acc| acc.key()),
    //         ctx.accounts.host_fee_in.is_some(),
    //     ),
    //     AccountMeta::new_readonly(ctx.accounts.user.key(), true),
    //     AccountMeta::new_readonly(ctx.accounts.token_x_program.key(), false),
    //     AccountMeta::new_readonly(ctx.accounts.token_y_program.key(), false),
    //     AccountMeta::new_readonly(ctx.accounts.event_authority.key(), false),
    //     AccountMeta::new_readonly(ctx.accounts.dlmm_program.key(), false),
    // ];

    // account_metas.extend(
    //     ctx.remaining_accounts
    //         .iter()
    //         .map(|acc| AccountMeta::new(acc.key(), false)),
    // );

    // // let amount_in: u64 = 10;
    // // let min_amount_out = amm_amount_in.checked_add(1);

    // // Define the instruction data (amountIn and minAmountOut)
    // let ix_data = SwapArgs {
    //     amount_in,
    //     min_amount_out,
    // };

    // // Construct the CPI call
    // // let ix = Instruction {
    // //     program_id: ctx.accounts.dlmm_program.key(),
    // //     accounts: account_metas.clone(),
    // //     data: ix_data.clone(),
    // // };
    // let ix = Instruction::new_with_borsh(
    //     *ctx.accounts.dlmm_program.key,
    //     &ix_data,
    //     account_metas.clone(),
    // );

    // let mut accounts = vec![
    //     ctx.accounts.lb_pair.to_account_info(),
    //     to_account_info(ctx.accounts.bin_array_bitmap_extension.as_ref())
    //         .unwrap_or(ctx.accounts.dlmm_program.to_account_info()),
    //     ctx.accounts.reserve_x.to_account_info(),
    //     ctx.accounts.reserve_y.to_account_info(),
    //     ctx.accounts.user_token_in.to_account_info(),
    //     ctx.accounts.user_token_out.to_account_info(),
    //     ctx.accounts.token_x_mint.to_account_info(),
    //     ctx.accounts.token_y_mint.to_account_info(),
    //     ctx.accounts.oracle.to_account_info(),
    //     to_account_info(ctx.accounts.host_fee_in.as_ref())
    //         .unwrap_or(ctx.accounts.dlmm_program.to_account_info()),
    //     ctx.accounts.user.to_account_info(),
    //     ctx.accounts.token_x_program.to_account_info(),
    //     ctx.accounts.token_y_program.to_account_info(),
    //     ctx.accounts.event_authority.clone().to_account_info(),
    //     ctx.accounts.dlmm_program.clone().to_account_info(),
    // ];

    // accounts.extend(ctx.remaining_accounts.iter().cloned());

    // msg!("8573489573894 - Starting instruction processing");

    // // Log program_id
    // msg!(
    //     "8573489573894 - Program ID: {:?}",
    //     ctx.accounts.dlmm_program
    // );

    // // Log number of accounts
    // msg!("8573489573894 - Number of accounts: {}", accounts.len());

    // // Log number of accounts
    // msg!(
    //     "8573489573894 - Number of accounts metas: {}",
    //     account_metas.clone().len()
    // );

    // // Log instruction data
    // msg!("8573489573894 - Instruction data: {:?}", ix_data.amount_in);
    // msg!(
    //     "8573489573894 - Instruction data: {:?}",
    //     ix_data.min_amount_out
    // );

    // dlmm::cpi::swap(ctx, amount_in, min_amount_out);

    // // Add more logs before and after critical operations
    // msg!("8573489573894 - Preparing to call invoke function");

    // // // Perform the CPI call
    // invoke(&ix, &accounts)?;

    let accounts = dlmm::cpi::accounts::Swap {
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        bin_array_bitmap_extension: ctx
            .accounts
            .bin_array_bitmap_extension
            .as_ref()
            .map(|account| account.to_account_info()),
        reserve_x: ctx.accounts.reserve_x.to_account_info(),
        reserve_y: ctx.accounts.reserve_y.to_account_info(),
        user_token_in: ctx.accounts.user_token_in.to_account_info(),
        user_token_out: ctx.accounts.user_token_out.to_account_info(),
        token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
        token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
        oracle: ctx.accounts.oracle.to_account_info(),
        host_fee_in: ctx
            .accounts
            .host_fee_in
            .as_ref()
            .map(|account| account.to_account_info()),
        user: ctx.accounts.user.to_account_info(),
        token_x_program: ctx.accounts.token_x_program.to_account_info(),
        token_y_program: ctx.accounts.token_y_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };

    let cpi_context = CpiContext::new(ctx.accounts.dlmm_program.to_account_info(), accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());

    dlmm::cpi::swap(cpi_context, amount_in, min_amount_out)?;

    Ok(())
}
