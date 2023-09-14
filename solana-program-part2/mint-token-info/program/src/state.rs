use borsh::{BorshDeserialize, BorshSerialize};
// use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ExtMint {
    /// number of greetings
    pub mint: String,
    pub name: String,
    pub symbol: String,
    pub icon: String,
}

impl ExtMint {
    pub const SEED_PREFIX: &str = "ext_mint3";

    pub fn new(mint: String, name: String, symbol: String, icon: String) -> ExtMint {
        ExtMint {
            mint,
            name,
            symbol,
            icon,
        }
    }
}
