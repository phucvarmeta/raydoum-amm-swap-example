use anchor_lang::{
    prelude::*,
    solana_program::sysvar,
    solana_program::{instruction::Instruction, program::invoke},
};
use anchor_spl::token::TokenAccount;
use borsh::BorshSerialize;

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

    // /// CHECK: DLMM program event authority for event CPI
    // pub event_authority: UncheckedAccount<'info>,
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
    /// CHECK:  Sysvar info
    #[account(address = sysvar::instructions::ID)]
    pub sysvar_info: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

fn to_account_info<'info>(account: Option<&UncheckedAccount<'info>>) -> Option<AccountInfo<'info>> {
    account.map(|acc| acc.to_account_info())
}

#[derive(Debug, Clone, BorshSerialize)]
struct SwapInstructionData {
    amount_in: u64,
    min_amount_out: u64,
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
    let account_metas = vec![
        AccountMeta::new(ctx.accounts.lb_pair.key(), false),
        AccountMeta::new_readonly(
            ctx.accounts
                .bin_array_bitmap_extension
                .as_ref()
                .map_or(Pubkey::default(), |acc| acc.key()),
            ctx.accounts.bin_array_bitmap_extension.is_some(),
        ),
        AccountMeta::new(ctx.accounts.reserve_x.key(), false),
        AccountMeta::new(ctx.accounts.reserve_y.key(), false),
        AccountMeta::new(ctx.accounts.user_token_in.key(), false),
        AccountMeta::new(ctx.accounts.user_token_out.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_x_mint.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_y_mint.key(), false),
        AccountMeta::new(ctx.accounts.oracle.key(), false),
        AccountMeta::new_readonly(
            ctx.accounts
                .host_fee_in
                .as_ref()
                .map_or(Pubkey::default(), |acc| acc.key()),
            ctx.accounts.host_fee_in.is_some(),
        ),
        AccountMeta::new_readonly(ctx.accounts.user.key(), true),
        AccountMeta::new_readonly(ctx.accounts.token_x_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_y_program.key(), false),
        // AccountMeta::new_readonly(ctx.accounts.event_authority.key(), false),
        // AccountMeta::new_readonly(ctx.accounts.dlmm_program.key(), false),
    ];

    // let amount_in: u64 = 10;
    // let min_amount_out = amm_amount_in.checked_add(1);

    // Define the instruction data (amountIn and minAmountOut)
    let ix_data = SwapInstructionData {
        amount_in,
        min_amount_out,
    }
    .try_to_vec()
    .map_err(|_| error!(ErrorCode::InstructionDidNotSerialize))?;

    // Construct the CPI call
    let ix = Instruction {
        program_id: ctx.accounts.dlmm_program.key(),
        accounts: account_metas,
        data: ix_data,
    };

    let mut accounts = vec![
        ctx.accounts.lb_pair.to_account_info(),
        to_account_info(ctx.accounts.bin_array_bitmap_extension.as_ref())
            .unwrap_or(ctx.accounts.dlmm_program.to_account_info()),
        ctx.accounts.reserve_x.to_account_info(),
        ctx.accounts.reserve_y.to_account_info(),
        ctx.accounts.user_token_in.to_account_info(),
        ctx.accounts.user_token_out.to_account_info(),
        ctx.accounts.token_x_mint.to_account_info(),
        ctx.accounts.token_y_mint.to_account_info(),
        ctx.accounts.oracle.to_account_info(),
        to_account_info(ctx.accounts.host_fee_in.as_ref())
            .unwrap_or(ctx.accounts.dlmm_program.to_account_info()),
        ctx.accounts.user.to_account_info(),
        ctx.accounts.token_x_program.to_account_info(),
        ctx.accounts.token_y_program.to_account_info(),
        // ctx.accounts.event_authority.clone().to_account_info(),
        // ctx.accounts.dlmm_program.clone().to_account_info(),
    ];

    accounts.extend(ctx.remaining_accounts.iter().cloned());

    // // Perform the CPI call
    invoke(&ix, &accounts)?;

    Ok(())
}
