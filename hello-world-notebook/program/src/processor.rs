use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::{
    error::GreetingAccountError, instraction::GreatingAccountInstruction, state::GreetingAccount,
};

pub struct Processor {}

impl Processor {
    // Created
    pub fn process_create(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        msg: String,
    ) -> ProgramResult {
        msg!("Created !");
        // Iterating accounts is safer than indexing
        let accounts_iter = &mut accounts.iter();

        // Get the account to say hello to
        let account = next_account_info(accounts_iter)?;

        // The account must be owned by the program in order to modify its data
        if account.owner != program_id {
            msg!("Greeted account does not have the correct program id");
            return Err(GreetingAccountError::NotOwnedByGreetingAccount.into());
        }

        msg!("account{:?}", &account,);
        msg!("account_data={:?}", &account.data,);

        // Increment and store the number of times the account has been greeted
        let mut greeting_account = GreetingAccount {
            message: "".to_string(),
        };

        greeting_account.message = msg;
        greeting_account.serialize(&mut *account.data.borrow_mut())?;

        msg!("Created: {:?}!", greeting_account.message);
        Ok(())
    }

    // Updated
    pub fn process_modify(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        msg: String,
    ) -> ProgramResult {
        msg!("Modify !");
        // Iterating accounts is safer than indexing
        let accounts_iter = &mut accounts.iter();

        // Get the account to say hello to
        let account = next_account_info(accounts_iter)?;

        // The account must be owned by the program in order to modify its data
        if account.owner != program_id {
            msg!("Greeted account does not have the correct program id");
            return Err(GreetingAccountError::NotOwnedByGreetingAccount.into());
        }

        msg!("account: {:?}", &account,);
        msg!("account_data: {:?}", &account.data,);

        // Increment and store the number of times the account has been greeted
        let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
        msg!("fetch create greeting_account value:{:?}", greeting_account);

        // let mut greeting_account = GreetingAccount {
        //     message: "".to_string(),
        // };
        greeting_account.message = msg;
        greeting_account.serialize(&mut *account.data.borrow_mut())?;

        msg!("Modify {:?}!", greeting_account.message);
        Ok(())
    }
    // Deleted
    pub fn process_delete(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        // Iterating accounts is safer than indexing
        let accounts_iter = &mut accounts.iter();

        // Get the account to say hello to
        let greeting_account = next_account_info(accounts_iter)?;
        let account = next_account_info(accounts_iter)?;

        // The account must be owned by the program in order to modify its data
        if greeting_account.owner != program_id {
            msg!("Greeted account does not have the correct program id");
            return Err(GreetingAccountError::NotOwnedByGreetingAccount.into());
        }

        **account.try_borrow_mut_lamports()? += greeting_account.lamports();
        **greeting_account.try_borrow_mut_lamports()? = 0;
        Ok(())
    }
    // program entrypoint's implementation
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("instraction data: {:?}", instruction_data);
        let instruction = GreatingAccountInstruction::try_from_slice(instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        msg!("instraction:{:?}", instruction);

        match instruction {
            GreatingAccountInstruction::Create(msg) => {
                Self::process_create(program_id, accounts, msg)?;
            }
            GreatingAccountInstruction::Modify(msg) => {
                Processor::process_modify(program_id, accounts, msg)?;
            }
            GreatingAccountInstruction::Delete => {
                Self::process_delete(program_id, accounts)?;
            }
        }

        Ok(())
    }
}
