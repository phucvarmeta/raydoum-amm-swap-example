use anchor_lang::prelude::*;

#[error_code]
pub enum SwapError {
    #[msg("Swap Error!")]
    Error,
}
