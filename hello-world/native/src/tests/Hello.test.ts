// No imports needed: web3, borsh, pg and more are globally available

import {
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

const PROGRAM_ID = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";

// keypair
const secretKeyArray = JSON.parse(process.env.PRIVATE_KEY || "[]") as number[];

// Step 1 连接到Solana网络 devnet
const devnet = clusterApiUrl("devnet");
const connection = new Connection(process.env.DEVNET || devnet, "confirmed");

// Step 2 创建者账号信息（private key）
const signer = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

const pg = {
    connection,
    PROGRAM_ID: new PublicKey(PROGRAM_ID),
    wallet: {
        keypair: signer,
        publicKey: signer.publicKey,
    },
};

describe("Test", () => {
    it("greet", async () => {
        // Create greetings account instruction

        // Create greet instruction
        const greetIx = new TransactionInstruction({
            keys: [
                {
                    pubkey: pg.wallet.publicKey,
                    isSigner: false,
                    isWritable: true,
                },
            ],
            programId: pg.PROGRAM_ID,
        });

        // Create transaction and add the instructions
        const tx = new Transaction();
        tx.add(greetIx);

        // Send and confirm the transaction
        const txHash = await sendAndConfirmTransaction(pg.connection, tx, [
            pg.wallet.keypair,
        ]);
        console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

        // Fetch the greetings account
        const greetingAccount = await pg.connection.getAccountInfo(
            pg.wallet.publicKey
        );

        if (!greetingAccount) {
            console.error("Don't get greeting information");
            return;
        }
    }, 20000);
});
