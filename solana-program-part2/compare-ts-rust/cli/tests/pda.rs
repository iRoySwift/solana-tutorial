use std::str::FromStr;

use solana_program::pubkey::Pubkey;

// const PROGRAM_ID: &str = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";
const MINT: &str = "CQ68EPr2bHQ29bLZdHioLx5An35hfav1mqn36hG74ofH";
const WALLET: &str = "6VX7znCYutpN4z4kyRA6B8uXiK6iPN799efjGr8m3rFX";
const TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

// cargo test -p compare-ts-rust --test pda
#[test]
fn get_associated_token_address_sync() {
    let token_mint_address = Pubkey::from_str(MINT).unwrap();
    let wallet_address = Pubkey::from_str(WALLET).unwrap();
    let token_program_id = Pubkey::from_str(TOKEN_PROGRAM_ID).unwrap();
    let associated_token_program_id = Pubkey::from_str(ASSOCIATED_TOKEN_PROGRAM_ID).unwrap();
    let seeds = [
        &wallet_address.to_bytes()[..],
        &token_program_id.to_bytes()[..],
        &token_mint_address.to_bytes()[..],
    ];
    let (ata_addr, _seed) = Pubkey::find_program_address(&seeds[..], &associated_token_program_id);
    assert_eq!(
        ata_addr,
        Pubkey::from_str("4pfQFsxJqaRG1bgWuD8S7cX8Qi1nck7zH5p6ZTdoSbD2").unwrap()
    );
}
