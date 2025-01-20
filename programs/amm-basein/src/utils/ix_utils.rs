use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{get_stack_height, Instruction, TRANSACTION_LEVEL_STACK_HEIGHT},
        sysvar::instructions::{load_current_index_checked, load_instruction_at_checked},
    },
};

pub type SystemResult<T> = std::result::Result<T, ProgramError>;

pub trait InstructionLoader {
    fn load_instruction_at(&self, index: usize) -> SystemResult<Instruction>;

    fn load_current_index(&self) -> SystemResult<u16>;

    fn is_flash_forbidden_cpi_call(&self) -> SystemResult<bool> {
        let current_index = self.load_current_index()? as usize;
        let current_ixn = self.load_instruction_at(current_index)?;

        if crate::ID != current_ixn.program_id {
            return Ok(true);
        }

        if get_stack_height() > TRANSACTION_LEVEL_STACK_HEIGHT {
            return Ok(true);
        }
        Ok(false)
    }

    fn is_forbidden_cpi_call(&self) -> SystemResult<bool> {
        let current_index = self.load_current_index()? as usize;
        let current_ixn = self.load_instruction_at(current_index)?;

        if crate::ID != current_ixn.program_id {
            Ok(false)
        } else if get_stack_height() > TRANSACTION_LEVEL_STACK_HEIGHT {
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

pub struct BpfInstructionLoader<'a, 'info> {
    pub instruction_sysvar_account_info: &'a AccountInfo<'info>,
}

impl<'a, 'info> InstructionLoader for BpfInstructionLoader<'a, 'info> {
    fn load_instruction_at(&self, index: usize) -> SystemResult<Instruction> {
        load_instruction_at_checked(index, self.instruction_sysvar_account_info)
    }

    fn load_current_index(&self) -> SystemResult<u16> {
        load_current_index_checked(self.instruction_sysvar_account_info)
    }
}

pub struct IxIterator<'a, IxLoader: InstructionLoader> {
    current_ix_index: usize,
    instruction_loader: &'a IxLoader,
}

impl<'a, IxLoader> IxIterator<'a, IxLoader> where IxLoader: InstructionLoader,
{
    pub fn new_at(start_ix_index: usize, instruction_loader: &'a IxLoader) -> Self {
        Self {
            current_ix_index: start_ix_index,
            instruction_loader,
        }
    }
}

impl<IxLoader> Iterator for IxIterator<'_, IxLoader> where IxLoader: InstructionLoader,
{
    type Item = std::result::Result<Instruction, ProgramError>;

    fn next(&mut self) -> Option<Self::Item> {
        match self
            .instruction_loader
            .load_instruction_at(self.current_ix_index)
        {
            Ok(ix) => {
                self.current_ix_index = self.current_ix_index.checked_add(1).unwrap();
                Some(Ok(ix))
            }
            Err(ProgramError::InvalidArgument) => None,
            Err(e) => Some(Err(e)),
        }
    }
}
