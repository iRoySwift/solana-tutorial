import {
    Connection,
    TransactionInstruction,
    AddressLookupTableAccount,
    VersionedTransaction,
    TransactionMessage,
    type Signer,
    type TransactionSignature,
} from "@solana/web3.js";

/**
 * 创建并发送版本化交易
 * @param signer                 Payer of the transaction and initialization fees
 * @param connection             Connection to use
 * @param ixs         Transaction Instruction Array
 * @param lookupTableAccount     Address Lookup Table Account
 * @returns                      Promise Transaction signature as base-58 encoded string
 */
async function createAndSendV0Tx(
    signer: Signer,
    connection: Connection,
    ixs: TransactionInstruction[],
    signers?: Signer[],
    lookupTableAccount?: AddressLookupTableAccount
): Promise<TransactionSignature> {
    // * Step 1 - Fetch Latest Blockhash
    // let latestBlockhash = await connection.getLatestBlockhash("finalized");
    const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();
    console.log(
        "   ✅ - 1. Fetched latest blockhash. Last valid height:",
        lastValidBlockHeight
    );

    // * Step 2 - Generate Transaction Message
    let messageV0;
    if (lookupTableAccount) {
        messageV0 = new TransactionMessage({
            payerKey: signer.publicKey,
            recentBlockhash: blockhash,
            instructions: ixs,
        }).compileToV0Message([lookupTableAccount]);
    } else {
        messageV0 = new TransactionMessage({
            payerKey: signer.publicKey,
            recentBlockhash: blockhash,
            instructions: ixs,
        }).compileToV0Message();
    }
    console.log("   ✅ - 2. Compiled transaction message");

    // * Step 3 - Sign your transaction with the required `Signers`
    const transaction = new VersionedTransaction(messageV0);
    signers && transaction.sign(signers);
    console.log("   ✅ - 3. Transaction Signed");

    // * Step 4 - Send our v0 transaction to the cluster
    const sig = await connection.sendTransaction(transaction, {
        maxRetries: 5,
        minContextSlot,
    });
    console.log("   ✅ - 4. Transaction sent to network");

    // * Step 5 - Confirm Transaction
    const confirmation = await connection.confirmTransaction({
        signature: sig,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
    });
    if (confirmation.value.err) {
        throw new Error("   ❌ - 5. Transaction not confirmed.");
    }

    console.log(
        "   🎉 - 5. Transaction succesfully confirmed!",
        `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
    return sig;
}

export { createAndSendV0Tx };
