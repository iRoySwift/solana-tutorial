use anchor_lang::prelude::*;

declare_id!("Dwwno9cpgrbXFFEdJhMt9FB9TJKnJ5en31y433M11oPQ");

#[program]
pub mod helloworld {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
