use anchor_lang::prelude::*;
use anchor_spl::token::*;

use crate::states::ExtMint;
// use std::fmt::Debug;

pub fn mint_info(ctx: Context<MintAccount>, info: ExtMint) -> Result<()> {
    msg!("ctx:{:?}", info);
    // ExtMint.set
    ctx.accounts.mint_pda.set_inner(ExtMint {
        mint: ctx.accounts.mint.key().to_string(),
        ..info
    });
    Ok(())
}

#[derive(Accounts)]
pub struct MintAccount<'info> {
    #[account(
        init,
        payer = payer,
        space = ExtMint::ACCOUNT_SPACE,
        seeds = [
            ExtMint::SEED_PREFIX.as_bytes(),
            token_program.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump
    )]
    mint_pda: Account<'info, ExtMint>,
    mint: SystemAccount<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}
