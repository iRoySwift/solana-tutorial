//! Program error
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

/// Greetings Error Enum
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum ExtMintError {
    /// Not owner by GreetingAccount program
    #[error("Not owner by GreetingAccount program")]
    NotOwnedByAccount,
}

/// type of GreetingAccount
pub type GreetingAccountResult = Result<(), ExtMintError>;

impl From<ExtMintError> for ProgramError {
    fn from(e: ExtMintError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for ExtMintError {
    fn type_of() -> &'static str {
        "HelloWorldError"
    }
}

impl PrintProgramError for ExtMintError {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        match self {
            Self::NotOwnedByAccount => {
                msg!("Error: Greeted account does not have correct program id")
            }
        }
    }
}
