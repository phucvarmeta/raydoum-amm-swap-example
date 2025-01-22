use anchor_lang::{err, prelude::*, Discriminator, Key, Result};

use super::ix_utils::{self, InstructionLoader};
use crate::{
    errors::SwapError,
    instruction::{ProxySwapBaseIn as ProxySwapBaseInArgs, ProxySwapDlmm as ProxySwapDlmmArgs},
    instructions::{proxy_swap_base_in::ProxySwapBaseIn, proxy_swap_dlmm::DlmmSwap},
};

pub fn proxy_swap_dlmm_check(
    ctx: &Context<DlmmSwap>,
    proxy_swap_base_in_index: u8,
    amount_out: u64,
) -> Result<()> {
    let instruction_loader = ix_utils::BpfInstructionLoader {
        instruction_sysvar_account_info: &ctx.accounts.sysvar_info,
    };
    let current_index: usize = instruction_loader.load_current_index()?.into();
    if instruction_loader.is_flash_forbidden_cpi_call()? {
        return err!(SwapError::Error);
    }

    if (proxy_swap_base_in_index as usize) > current_index {
        return err!(SwapError::Error);
    }

    let proxy_swap_base_in_instruction =
        instruction_loader.load_instruction_at(proxy_swap_base_in_index as usize)?;
    if proxy_swap_base_in_instruction.program_id != *ctx.program_id {
        return err!(SwapError::Error);
    }

    let discriminator = ProxySwapDlmmArgs::DISCRIMINATOR;
    let swap_base_in_ix_data =
        ProxySwapBaseInArgs::try_from_slice(&proxy_swap_base_in_instruction.data[8..])?;

    // ! Caution: Be aware when changing accounts's order cause it can affect these validations
    if proxy_swap_base_in_instruction.data[..8] != discriminator {
        return err!(SwapError::Error);
    }
    if proxy_swap_base_in_instruction.accounts[16].pubkey != ctx.accounts.user.key() {
        return err!(SwapError::Error);
    }
    if amount_out < swap_base_in_ix_data.amount_in {
        return err!(SwapError::Error);
    }

    Ok(())
}

pub fn proxy_swap_raydium_check(ctx: &Context<ProxySwapBaseIn>) -> Result<()> {
    let instruction_loader = ix_utils::BpfInstructionLoader {
        instruction_sysvar_account_info: &ctx.accounts.sysvar_info,
    };

    let current_index: usize = instruction_loader.load_current_index()?.into();
    if instruction_loader.is_flash_forbidden_cpi_call()? {
        return err!(SwapError::Error);
    }

    let ix_iterator = ix_utils::IxIterator::new_at(current_index + 1, &instruction_loader);
    let mut found_create_pool_ix = false;

    let proxy_swap_dlmm_discriminator = ProxySwapDlmmArgs::DISCRIMINATOR;
    let proxy_swap_base_in_discriminator = ProxySwapBaseInArgs::DISCRIMINATOR;

    for ixn in ix_iterator {
        let ixn = ixn?;
        if ixn.program_id != crate::ID {
            continue;
        }

        if ixn.data[..8] == proxy_swap_base_in_discriminator {
            return err!(SwapError::Error);
        }

        if ixn.data[..8] == proxy_swap_dlmm_discriminator {
            if found_create_pool_ix {
                return err!(SwapError::Error);
            }
            // distribute_check_matching_create_pool(&ixn, current_index)?;

            found_create_pool_ix = true;
        }
    }

    if !found_create_pool_ix {
        return err!(SwapError::Error);
    }

    Ok(())
}

// fn distribute_check_matching_create_pool(
//     create_pool_ix: &Instruction,
//     distribute_index: usize,
// ) -> Result<()> {
//     let create_pool_ix_data = ProxySwapDlmmArgs::try_from_slice(&create_pool_ix.data[8..])?;

//     let distribute_instruction_index = create_pool_ix_data.proxy_swap_base_in_index;

//     if (usize::from(distribute_instruction_index)) != distribute_index {
//         return err!(MarketError::InvalidDistributeAdditionalPairAmount);
//     }

//     Ok(())
// }
