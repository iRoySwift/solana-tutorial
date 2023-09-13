use borsh::{BorshDeserialize, BorshSerialize};

#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub enum ExtMintInstruction {
    Mint {
        name: String,
        symbol: String,
        icon: String,
    },
}
