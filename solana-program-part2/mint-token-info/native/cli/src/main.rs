use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{self, AccountMeta},
    pubkey::Pubkey,
    system_program,
};
use solana_rpc_client::rpc_client::RpcClient;
use solana_sdk::{signature::Keypair, signer::Signer};
use std::str::FromStr;
mod utils;

const PROGRAM_ID: &str = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";
const MINT: &str = "Gir7LUMrsXHv5gGctKNp6th2Pj7j9qmYR1LSrsHS6Yaj";
const DEV_NET: &str = "https://qn-devnet.solana.fm";
const PRIVATE_KEY: [u8; 64] = [
    37, 37, 60, 131, 98, 125, 34, 130, 135, 2, 57, 248, 169, 60, 174, 216, 219, 70, 59, 155, 64, 7,
    77, 104, 33, 204, 94, 10, 112, 105, 150, 19, 81, 152, 193, 57, 135, 12, 148, 233, 95, 219, 65,
    201, 180, 32, 3, 250, 82, 142, 28, 180, 128, 106, 126, 102, 144, 196, 181, 26, 146, 135, 251,
    94,
];

#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub enum ExtMintInstruction {
    Mint {
        name: String,
        symbol: String,
        icon: String,
    },
}

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

#[tokio::main]
async fn main() {
    println!("start");
    // Step 1 连接到Solana网络 devnet
    let client = RpcClient::new(DEV_NET);

    // Step 2 创建者账号信息（private key）
    let program_id = Pubkey::from_str(PROGRAM_ID).unwrap();
    let mint = Pubkey::from_str(MINT).unwrap();
    let signer = Keypair::from_bytes(&PRIVATE_KEY).unwrap();

    let (page_visits_pda, _bump) = Pubkey::find_program_address(
        &[
            ExtMint::SEED_PREFIX.as_bytes(),
            program_id.as_ref(),
            mint.as_ref(),
        ],
        &program_id,
    );

    // 构建instructions
    let ix = ExtMintInstruction::Mint {
        name: String::from("SOLO"),
        symbol: String::from("SOLO"),
        icon: String::from("https://solo.com"),
    };

    // *  Generate instruction
    let ixs = instruction::Instruction::new_with_bytes(
        program_id,
        &ix.try_to_vec().unwrap(),
        vec![
            AccountMeta::new(page_visits_pda, false),
            AccountMeta::new(mint, false),
            AccountMeta::new(signer.pubkey(), true),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
    );

    let sig = utils::create_and_send_tx(&signer, &client, ixs).await;
    // // * Step 1 - Fetch Latest Blockhash
    // let recent_blockhash = client.get_latest_blockhash().unwrap();

    // // * Step 2 - Generate Transaction
    // let txs = transaction::Transaction::new_signed_with_payer(
    //     &[ixs],
    //     Some(&signer.pubkey()),
    //     &[&signer],
    //     recent_blockhash,
    // );

    // // * Step 4 - Send our v0 transaction to the cluster
    // let sig = client.send_and_confirm_transaction(&txs).unwrap();

    println!("sig: {:#?}", sig);

    let state = client.get_account(&page_visits_pda).unwrap();
    println!("state: {:?}", state);
    let extmint_info = ExtMint::try_from_slice(&state.data).unwrap();
    println!("extmint_info:{:#?}", extmint_info);
}
