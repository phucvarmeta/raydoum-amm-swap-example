use anchor_lang::prelude::*;

declare_id!("5RThBYsqEfSmA39fH6RPrCPY2CmUnVNZZqG91qzybbTx");

#[program]
pub mod amm_basein {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
