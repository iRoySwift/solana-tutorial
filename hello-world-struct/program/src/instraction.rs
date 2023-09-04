//! Program instruction

use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum GreatingAccountInstruction {
    Greeting {
        // greeted account
        counter: u32,
    },
}
