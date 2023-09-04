// No imports needed: web3, borsh, pg and more are globally available

import assert from "assert";
import * as borsh from "borsh";
import {
    clusterApiUrl,
    SystemProgram,
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
/**
 * The state of a greeting account managed by the hello world program
 */
class GreetingAccount {
    counter = 0;
    constructor(fields: { counter: number } | undefined = undefined) {
        if (fields) {
            this.counter = fields.counter;
        }
    }
}

/**
 * Borsh schema definition for greeting accounts
 */
const GreetingSchema = new Map([
    [GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
]);

/**
 * The expected size of each greeting account.
 */
const GREETING_SIZE = borsh.serialize(
    GreetingSchema as unknown as borsh.Schema,
    new GreetingAccount()
).length;

describe("Test", () => {
    it("greet", async () => {
        // Instruction Variant indexes
        enum InstructionVariant {
            Greeting = 0,
        }

        class Assignable {
            constructor(propertities) {
                Object.keys(propertities).map(
                    key => (this[key] = propertities[key])
                );
            }
        }

        // Our instruction payload vocabulary
        class GreetingAccountInstruction extends Assignable {}

        // Borsh needs a schema describing the payload
        const GreetingAccountInstructionSchema = new Map([
            [
                GreetingAccountInstruction,
                {
                    kind: "struct",
                    fields: [
                        ["id", "u8"],
                        ["counter", "u32"],
                    ],
                },
            ],
        ]);
        // 发送的数据
        const helloTx = new GreetingAccountInstruction({
            id: InstructionVariant.Greeting,
            counter: 2,
        });

        //serialize the payload
        const helloSerBuffer = Buffer.from(
            borsh.serialize(GreetingAccountInstructionSchema, helloTx)
        );
        // Create greetings account instruction
        const greetingAccountKp = new Keypair();
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
            data: helloSerBuffer,
        });

        // Create transaction and add the instructions
        const tx = new Transaction();
        tx.add(createGreetingAccountIx, greetIx);

        // Send and confirm the transaction
        const txHash = await sendAndConfirmTransaction(pg.connection, tx, [
            pg.wallet.keypair,
            greetingAccountKp,
        ]);
        console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

        // Fetch the greetings account
        const greetingAccount = await pg.connection.getAccountInfo(
            greetingAccountKp.publicKey
        );

        if (!greetingAccount) {
            console.error("Don't get greeting information");
            return;
        }

        // Deserialize the account data
        const deserializedAccountData: any = borsh.deserialize(
            GreetingSchema,
            GreetingAccount,
            greetingAccount.data
        );

        // Assertions
        assert.equal(greetingAccount?.lamports, lamports);

        assert(greetingAccount?.owner.equals(pg.PROGRAM_ID));

        assert.deepEqual(greetingAccount?.data, Buffer.from([2, 0, 0, 0]));

        assert.equal(deserializedAccountData?.counter, 2);
    });
});
