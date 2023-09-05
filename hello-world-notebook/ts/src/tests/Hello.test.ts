// No imports needed: web3, borsh, pg and more are globally available

import assert from "assert";
import * as borsh from "borsh";
import { Buffer } from "buffer";

import {
    clusterApiUrl,
    SystemProgram,
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    TransactionMessage,
    VersionedTransaction,
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
/**
 * The state of a greeting account managed by the hello world program
 */
class GreetingAccount {
    message = "1234567890123456789";
    constructor(fields: { message: string } | undefined = undefined) {
        if (fields) {
            this.message = fields.message;
        }
    }
}

/**
 * Borsh schema definition for greeting accounts
 */
const GreetingSchema = new Map([
    [GreetingAccount, { kind: "struct", fields: [["message", "string"]] }],
]);

/**
 * The expected size of each greeting account.
 */
const GREETING_SIZE = borsh.serialize(
    GreetingSchema as unknown as borsh.Schema,
    new GreetingAccount()
).length;

// Instruction Variant indexes
enum InstructionVariant {
    Create = 0,
    Modify = 1,
    Delete = 2,
}

class Assignable {
    constructor(propertities) {
        Object.keys(propertities).map(key => (this[key] = propertities[key]));
    }
}

// Our instruction payload vocabulary
class CreateInstruction extends Assignable {}
class ModifyInstruction extends Assignable {}
class DeleteInstruction extends Assignable {}

// Borsh needs a schema describing the payload
const GreetingAccountInstructionSchema = new Map([
    [
        CreateInstruction,
        {
            kind: "struct",
            fields: [
                ["id", "u8"],
                ["msg", "string"],
            ],
        },
    ],
    [
        ModifyInstruction,
        {
            kind: "struct",
            fields: [
                ["id", "u8"],
                ["msg", "string"],
            ],
        },
    ],
    [
        DeleteInstruction,
        {
            kind: "struct",
            fields: [["id", "u8"]],
        },
    ],
]);
describe("Test", () => {
    const greetingAccountKp = new Keypair();
    it("Create", async () => {
        console.log("🚀 ------------Create Start------------");
        // 发送的数据
        const createdIx = new CreateInstruction({
            id: InstructionVariant.Create,
            msg: "abc",
        });

        //serialize the payload
        const createSerBuf = Buffer.from(
            borsh.serialize(GreetingAccountInstructionSchema, createdIx)
        );
        console.log("buffer:", createSerBuf);
        // Create greetings account instruction
        const lamports =
            await pg.connection.getMinimumBalanceForRentExemption(
                GREETING_SIZE
            );

        const createGreetingAccountIx = SystemProgram.createAccount({
            fromPubkey: pg.wallet.publicKey,
            lamports,
            newAccountPubkey: greetingAccountKp.publicKey,
            programId: pg.PROGRAM_ID,
            space: GREETING_SIZE,
        });

        // Create greet instruction
        const greetIx = new TransactionInstruction({
            // 1. The public keys of all the accounts the instruction will read/write
            keys: [
                {
                    pubkey: greetingAccountKp.publicKey,
                    isSigner: false,
                    isWritable: true,
                },
            ],

            // 2. The ID of the program this instruction will be sent to
            programId: pg.PROGRAM_ID,

            // 3. Data - in this case, there's none!
            data: createSerBuf,
        });

        // Create transaction and add the instructions
        const tx = new Transaction();
        tx.add(createGreetingAccountIx, greetIx);

        // Send and confirm the transaction
        const txHash = await sendAndConfirmTransaction(pg.connection, tx, [
            pg.wallet.keypair,
            greetingAccountKp,
        ]);
        console.log(`🎉 Use 'solana confirm -v ${txHash}' to see the logs`);

        // Fetch the greetings account
        const greetingAccount = await pg.connection.getAccountInfo(
            greetingAccountKp.publicKey
        );

        if (!greetingAccount) {
            console.error("Don't get greeting information");
            return;
        }

        console.log("data:", greetingAccount.data);

        // Deserialize the account data
        const deserializedAccountData: any = borsh.deserialize(
            GreetingSchema,
            GreetingAccount,
            greetingAccount.data.slice(0, 7)
        );

        // Assertions
        expect(greetingAccount?.lamports).toEqual(lamports);
        assert.equal(greetingAccount?.lamports, lamports);
        assert(greetingAccount?.owner.equals(pg.PROGRAM_ID));
        assert.deepEqual(
            greetingAccount.data.slice(0, 7),
            Buffer.from([3, 0, 0, 0, 97, 98, 99])
        );
        expect(greetingAccount.data.slice(0, 7)).toEqual(
            Buffer.from([3, 0, 0, 0, 97, 98, 99])
        );
        assert.equal(deserializedAccountData?.message, "abc");
        console.log("🚀 ------------Create End------------");
    }, 200000);
    it("Modify", async () => {
        console.log("🚀 ------------Modify Start------------");
        // 发送的数据
        const modifyIx = new ModifyInstruction({
            id: InstructionVariant.Modify,
            msg: "hello world!",
        });

        //serialize the payload
        const modifySerBuf = Buffer.from(
            borsh.serialize(GreetingAccountInstructionSchema, modifyIx)
        );
        console.log("buffer:", modifySerBuf);

        // Create greet instruction
        const greetIx = new TransactionInstruction({
            // 1. The public keys of all the accounts the instruction will read/write
            keys: [
                {
                    pubkey: greetingAccountKp.publicKey,
                    isSigner: false,
                    isWritable: true,
                },
            ],

            // 2. The ID of the program this instruction will be sent to
            programId: pg.PROGRAM_ID,

            // 3. Data - in this case, there's none!
            data: modifySerBuf,
        });

        // Create transaction and add the instructions
        const tx = new Transaction();
        tx.add(greetIx);

        // Send and confirm the transaction
        const txHash = await sendAndConfirmTransaction(pg.connection, tx, [
            pg.wallet.keypair,
        ]);
        console.log(`🎉 Use 'solana confirm -v ${txHash}' to see the logs`);

        // Fetch the greetings account
        const greetingAccount = await pg.connection.getAccountInfo(
            greetingAccountKp.publicKey
        );

        if (!greetingAccount) {
            console.error("Don't get greeting information");
            return;
        }

        console.log("data:", greetingAccount.data);

        // Deserialize the account data
        const deserializedAccountData: any = borsh.deserialize(
            GreetingSchema,
            GreetingAccount,
            greetingAccount.data.slice(0, 16)
        );

        // Assertions
        // assert.equal(greetingAccount?.lamports, lamports);
        assert(greetingAccount?.owner.equals(pg.PROGRAM_ID));
        assert.deepEqual(
            greetingAccount.data.slice(0, 16),
            Buffer.from([
                12, 0, 0, 0, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108,
                100, 33,
            ])
        );
        assert.equal(deserializedAccountData?.message, "hello world!");
        console.log("🚀 ------------Modify End------------");
    }, 200000);
    it("Delete", async () => {
        console.log("🚀 ------------Delete Start------------");
        const deleteIx = new DeleteInstruction({
            id: InstructionVariant.Delete,
        });
        //serialize the payload
        const deleteSerBuf = Buffer.from(
            borsh.serialize(GreetingAccountInstructionSchema, deleteIx)
        );
        console.log("buffer: " + deleteSerBuf);
        let txInstructions: TransactionInstruction[] = [];
        txInstructions.push(
            new TransactionInstruction({
                keys: [
                    {
                        pubkey: pg.wallet.keypair.publicKey,
                        isSigner: true,
                        isWritable: true,
                    },
                    {
                        pubkey: greetingAccountKp.publicKey,
                        isSigner: true,
                        isWritable: true,
                    },
                ],
                programId: pg.PROGRAM_ID,
                data: deleteSerBuf,
            })
        );
        // * Step 1 - Fetch Latest Blockhash
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight },
        } = await connection.getLatestBlockhashAndContext();
        console.log(
            "   ✅ - 1. Fetched latest blockhash. Last valid height:",
            lastValidBlockHeight
        );
        const messageV0 = new TransactionMessage({
            payerKey: signer.publicKey,
            recentBlockhash: blockhash,
            instructions: txInstructions,
        }).compileToV0Message();
        console.log("   ✅ - 2. Compiled transaction message");
        const transaction = new VersionedTransaction(messageV0);

        // * Step 3 - Sign your transaction with the required `Signers`
        transaction.sign([pg.wallet.keypair, greetingAccountKp]);
        console.log("   ✅ - 3. Transaction Signed");

        // * Step 4 - Send our v0 transaction to the cluster
        const txid = await connection.sendTransaction(transaction, {
            maxRetries: 5,
            minContextSlot,
        });
        console.log("   ✅ - 4. Transaction sent to network");

        // * Step 5 - Confirm Transaction
        const confirmation = await connection.confirmTransaction({
            signature: txid,
            blockhash: blockhash,
            lastValidBlockHeight,
        });
        if (confirmation.value.err) {
            throw new Error("   ❌ - 5. Transaction not confirmed.");
        }

        console.log(`🎉 Use 'solana confirm -v ${txid}' to see the logs`);

        // Fetch the greetings account
        const greetingAccount = await pg.connection.getAccountInfo(
            greetingAccountKp.publicKey
        );

        // Assertions
        expect(greetingAccount).toBeNull();
        console.log("🚀 ------------Delete End------------");
    });
});
