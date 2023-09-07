use std::str::FromStr;

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_instruction,
};
use solana_rpc_client::rpc_client::RpcClient;
use solana_sdk::{signature::Keypair, signer::Signer, transaction::Transaction};

const PROGRAM_ID: &str = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";
const DEV_NET: &str = "https://qn-devnet.solana.fm";
const PRIVATE_KEY: [u8; 64] = [
    37, 37, 60, 131, 98, 125, 34, 130, 135, 2, 57, 248, 169, 60, 174, 216, 219, 70, 59, 155, 64, 7,
    77, 104, 33, 204, 94, 10, 112, 105, 150, 19, 81, 152, 193, 57, 135, 12, 148, 233, 95, 219, 65,
    201, 180, 32, 3, 250, 82, 142, 28, 180, 128, 106, 126, 102, 144, 196, 181, 26, 146, 135, 251,
    94,
];

#[derive(BorshSerialize, BorshDeserialize)]
struct GreetingAccount {
    counter: u32,
}

pub fn invoke_program() {
    // data
    let greeting_account = GreetingAccount { counter: 0 };
    let mut buffer: Vec<u8> = Vec::new();
    greeting_account.serialize(&mut buffer).unwrap();
    let greeting_size = buffer.len();

    // Step 1 连接到Solana网络 devnet
    let client = RpcClient::new(DEV_NET);

    // Step 2 创建者账号信息（private key）
    let hello_program_id = Pubkey::from_str(PROGRAM_ID).unwrap();
    let signer = Keypair::from_bytes(&PRIVATE_KEY).unwrap();
    let greeting_account_kp = Keypair::new();

    // Step 3 instruction
    let lamports = client
        .get_minimum_balance_for_rent_exemption(greeting_size)
        .unwrap();
    let create_greeting_ix = system_instruction::create_account(
        &signer.pubkey(),
        &greeting_account_kp.pubkey(),
        lamports,
        greeting_size as u64,
        &hello_program_id,
    );

    let instraction = Instruction::new_with_borsh(
        hello_program_id,
        &greeting_account,
        vec![AccountMeta::new(greeting_account_kp.pubkey(), true)],
    );
    let ixs = vec![create_greeting_ix, instraction];

    // Latest hash
    let recent_blockhash = client.get_latest_blockhash().unwrap();
    let tx = Transaction::new_signed_with_payer(
        &ixs,
        Some(&signer.pubkey()),
        &[&signer, &greeting_account_kp],
        recent_blockhash,
    );

    // send transaction
    let sig = client.send_and_confirm_transaction(&tx).unwrap();
    println!("Use 'solana confirm -v {sig}' to see the logs");
}
