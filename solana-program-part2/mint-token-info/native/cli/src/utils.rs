use solana_program::instruction::Instruction;
use solana_rpc_client::rpc_client::RpcClient;
use solana_sdk::{signature::Signature, signer::Signer, transaction};

/// create a transaction and send
///
/// # Example
/// ```
///   # 构建instructions
///    let ix = ExtMintInstruction::Mint {
///        name: String::from("SOLO"),
///        symbol: String::from("SOLO"),
///        icon: String::from("https://solo.com"),
///    };
///
///     # Generate instruction
///    let ixs = instruction::Instruction::new_with_bytes(
///        program_id,
///        &ix.try_to_vec().unwrap(),
///        vec![
///            AccountMeta::new(page_visits_pda, false),
///            AccountMeta::new(mint, false),
///            AccountMeta::new(signer.pubkey(), true),
///            AccountMeta::new_readonly(system_program::ID, false),
///        ],
///    );
///
///    let sig = utils::create_and_send_tx(&signer, &client, ixs).await;
///```
///
#[warn(dead_code)]
pub async fn create_and_send_tx(
    signer: &dyn Signer,
    client: &RpcClient,
    ixs: Instruction,
) -> Signature {
    // * Step 1 - Fetch Latest Blockhash
    let recent_blockhash = client.get_latest_blockhash().unwrap();
    println!(
        "   ✅ - 1. Fetched latest blockhash. Last valid height: {:?}",
        recent_blockhash
    );

    // * Step 2 - Generate Transaction
    let txs = transaction::Transaction::new_signed_with_payer(
        &[ixs],
        Some(&signer.pubkey()),
        &[signer],
        recent_blockhash,
    );
    println!("   ✅ - 2. Transaction Signed:{:?}", txs);

    // * Step 3 - Send our v0 transaction to the cluster
    let sig = client.send_and_confirm_transaction(&txs).unwrap();
    println!("   ✅ - 3. Transaction sent to network:{:?}", sig);
    sig
}
