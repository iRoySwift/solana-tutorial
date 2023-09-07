use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke,
    pubkey::Pubkey,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    _program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;
    let helloworld_program_id = next_account_info(accounts_iter)?;

    msg!("invoke helloworld program entrypoint from {}", account.key);

    let instruction = Instruction::new_with_bytes(
        *helloworld_program_id.key,
        "hello".as_bytes(),
        vec![AccountMeta::new(*account.key, true)],
    );

    let account_infos = [account.clone()];
    invoke(&instruction, &account_infos)
}
