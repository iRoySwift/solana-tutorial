//! Program instruction

use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};

#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq, BorshSchema)]
pub enum GreatingAccountInstruction {
    Create(String),
    Modify(String),
    Delete,
}
