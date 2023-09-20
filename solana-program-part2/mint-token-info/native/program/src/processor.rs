use crate::{instruction::ExtMintInstruction, state::ExtMint};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

pub struct Processor {}

impl Processor {
    pub fn process_mint(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        name: String,
        symbol: String,
        icon: String,
    ) -> ProgramResult {
        let account_iter = &mut accounts.iter();
        let page_visits_pda = next_account_info(account_iter)?;
        let mint = next_account_info(account_iter)?;
        let signer = next_account_info(account_iter)?;
        let system_program = next_account_info(account_iter)?;

        let ext_mint = ExtMint::new(mint.key.to_string(), name, symbol, icon);

        let space = ext_mint.try_to_vec()?.len() as usize;
        let lamports = Rent::get()?.minimum_balance(space);

        let (gen_ext_mint_key, bump) = Pubkey::find_program_address(
            &[
                ExtMint::SEED_PREFIX.as_bytes(),
                program_id.as_ref(),
                mint.key.as_ref(),
            ],
            program_id,
        );

        msg!("gen_ext_mint_key: {:?}", gen_ext_mint_key);

        if gen_ext_mint_key != *page_visits_pda.key {
            msg!("Error: gen_ext_mint_key don't match seed derivation");
            return Err(ProgramError::InvalidSeeds);
        }

        let instruction = &system_instruction::create_account(
            signer.key,
            page_visits_pda.key,
            lamports,
            space as u64,
            program_id,
        );
        let account_infos = &[
            signer.clone(),
            system_program.clone(),
            page_visits_pda.clone(),
            mint.clone(),
        ];
        let signers_seeds: &[&[_]] = &[&[
            ExtMint::SEED_PREFIX.as_bytes(),
            program_id.as_ref(),
            mint.key.as_ref(),
            &[bump],
        ]];

        invoke_signed(instruction, account_infos, signers_seeds)?;
        msg!("ext_mint: {:?}", ext_mint);
        ext_mint.serialize(&mut *page_visits_pda.data.borrow_mut())?;
        Ok(())
    }
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = ExtMintInstruction::try_from_slice(instruction_data)?;
        msg!("Processing instruction:{:?}", instruction);
        match instruction {
            ExtMintInstruction::Mint { name, symbol, icon } => {
                Self::process_mint(program_id, accounts, name, symbol, icon)?;
            }
        }
        Ok(())
    }
}
