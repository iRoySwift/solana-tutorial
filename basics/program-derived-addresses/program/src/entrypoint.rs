use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg,
    program_error::PrintProgramError, pubkey::Pubkey,
};

use crate::{error::PageVisitsError, processor::Processor};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello World program-derived-addresses program entrypoint ");
    if let Err(err) = Processor::process_instruction(program_id, accounts, instruction_data) {
        err.print::<PageVisitsError>();
        return Err(err);
    }
    Ok(())
}
