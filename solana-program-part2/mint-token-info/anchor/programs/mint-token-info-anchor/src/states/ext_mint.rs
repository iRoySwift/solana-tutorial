use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct ExtMint {
    /// number of greetings
    pub mint: String,
    pub name: String,
    pub symbol: String,
    pub icon: String,
}

impl ExtMint {
    pub const ACCOUNT_SPACE: usize = 4 + 160;

    pub const SEED_PREFIX: &'static str = "mint_token_info";

    pub fn new(mint: String, name: String, symbol: String, icon: String) -> ExtMint {
        ExtMint {
            mint,
            name,
            symbol,
            icon,
        }
    }
}
