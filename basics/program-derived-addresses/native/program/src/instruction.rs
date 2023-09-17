use borsh::{BorshDeserialize, BorshSerialize};

use crate::state::PageVisits;

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub enum PageVisitsInstruction {
    Create(PageVisits),
    Increment,
}
