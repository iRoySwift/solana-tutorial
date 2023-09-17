use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::{error::PageVisitsError, instruction::PageVisitsInstruction, state::PageVisits};

pub struct Processor {}

impl Processor {
    pub fn process_create(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        page_visits: PageVisits,
    ) -> ProgramResult {
        let account_iter = &mut accounts.iter();
        let page_visible_pda = next_account_info(account_iter).unwrap();
        let user = next_account_info(account_iter)?;
        let payer = next_account_info(account_iter).unwrap();
        let system_program = next_account_info(account_iter).unwrap();

        if page_visible_pda.owner != program_id {
            msg!("pad account does not have the correct program id");
            return Err(PageVisitsError::NotOwnedByAccount.into());
        }

        let space = page_visits.try_to_vec()?.len() as usize;
        let lamports = Rent::get()?.minimum_balance(space);

        let instruction = system_instruction::create_account(
            payer.key,
            page_visible_pda.key,
            lamports,
            space as u64,
            program_id,
        );
        let account_infos = [
            payer.clone(),
            system_program.clone(),
            page_visible_pda.clone(),
            // user.clone(),
        ];
        let signers_seeds: &[&[&[u8]]] = &[&[
            PageVisits::SEED_PREFIX.as_bytes(),
            user.key.as_ref(),
            &[page_visits.bump],
        ]];
        invoke_signed(&instruction, &account_infos, signers_seeds)?;
        Ok(())
    }
    pub fn process_increment(accounts: &[AccountInfo]) -> ProgramResult {
        let accounts_iter = &mut accounts.iter();
        let page_visits_account = next_account_info(accounts_iter)?;

        let page_visits = &mut PageVisits::try_from_slice(&page_visits_account.data.borrow())?;
        page_visits.increment();
        msg!("page_visits: {:?}", page_visits);
        page_visits.serialize(&mut &mut page_visits_account.data.borrow_mut()[..])?;
        Ok(())
    }
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("instruction_data:{:?}", instruction_data);

        let instruction = PageVisitsInstruction::try_from_slice(instruction_data)?;

        msg!("instruction:{:?}", instruction);

        match instruction {
            PageVisitsInstruction::Create(page_visits) => {
                Self::process_create(program_id, accounts, page_visits)?;
            }
            PageVisitsInstruction::Increment => Self::process_increment(accounts)?,
        }
        Ok(())
    }
}
