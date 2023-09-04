use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

use crate::{
    error::GreetingAccountError, instraction::GreatingAccountInstruction, state::GreetingAccount,
};

pub struct Processor {}

impl Processor {
    pub fn process_greeting(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        counter: u32,
    ) -> ProgramResult {
        // Iterating accounts is safer than indexing
        let accounts_iter = &mut accounts.iter();

        // Get the account to say hello to
        let account = next_account_info(accounts_iter)?;

        // The account must be owned by the program in order to modify its data
        if account.owner != program_id {
            msg!("Greeted account does not have the correct program id");
            return Err(GreetingAccountError::NotOwnedByGreetingAccount.into());
        }

        msg!("account:{:?},account_data={:?}", &account, &account.data,);

        // Increment and store the number of times the account has been greeted
        let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
        msg!("Greeted {:?} !", counter);
        greeting_account.counter += counter;
        greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

        msg!("Greeted {} time(s)!", greeting_account.counter);
        Ok(())
    }
    // program entrypoint's implementation
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("instraction data: {:?}", instruction_data);
        let instruction = GreatingAccountInstruction::try_from_slice(instruction_data)?;

        msg!("instraction:{:?}", instruction);

        match instruction {
            GreatingAccountInstruction::Greeting { counter } => {
                Self::process_greeting(program_id, accounts, counter)?;
            }
        }

        Ok(())
    }
}
