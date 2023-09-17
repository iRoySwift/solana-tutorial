use anchor_lang::prelude::*;

declare_id!("Dwwno9cpgrbXFFEdJhMt9FB9TJKnJ5en31y433M11oPQ");

#[program]
pub mod helloworld {
    use super::*;

    pub fn say_hello(ctx: Context<Hello>) -> Result<()> {
        let payer = &mut ctx.accounts.payer.to_account_infos();
        let _system_program = ctx.accounts.system_program.to_account_info();
        msg!("Hello World!");
        msg!("Out program's Program ID: {}", &id());
        msg!("Hello World Rust program entrypoint from {:?}", payer);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Hello<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}
