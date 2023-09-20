use anchor_lang::prelude::*;

pub mod instrustions;
pub mod states;

use instrustions::*;
use states::*;

declare_id!("2xLs4UB4c5McNeKGiS5BPzL6MbedeQMfhu3YgFGtnn9T");

#[program]
pub mod mint_token_info_anchor {
    use crate::states::ExtMint;

    use super::*;

    pub fn mint_info(ctx: Context<MintAccount>, info: ExtMint) -> Result<()> {
        instrustions::mint_info::mint_info(ctx, info)
    }
}
