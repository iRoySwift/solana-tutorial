#![allow(clippy::result_large_err)]
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("6rrzJa3cUy2kWMwLKvLbgfXJsaXjrBJrDR1C2LAfSTQY");

#[program]
pub mod pda_anchor {
    use super::*;

    pub fn create_page_visits(ctx: Context<CreatePageVisits>) -> Result<()> {
        instructions::create::create_page_visits(ctx)
    }

    pub fn increment_page_visits(ctx: Context<IncrementPageVisits>) -> Result<()> {
        instructions::increment::increment_page_visits(ctx)
    }
}
