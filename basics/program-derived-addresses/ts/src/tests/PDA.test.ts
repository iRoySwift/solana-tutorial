import { describe, it } from "node:test";
import dotenv from "dotenv";
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    clusterApiUrl,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";
import os from "os";
import borsh from "borsh";
import { createAndSendV0Tx } from "./../utils/sendTransaction.ts";
import assert from "assert";

dotenv.config();

const createKeypairFromFile = (filePath: string): Keypair => {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync(filePath, "utf-8")))
    );
};

const PDA_PROGRAM_ID = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";

// keypair
// const secretKeyArray = JSON.parse(process.env.PRIVATE_KEY || "[]") as number[];

// Step 1 连接到Solana网络 devnet
const devnet = clusterApiUrl("devnet");
const connection = new Connection(process.env.DEVNET || devnet, "confirmed");

// Step 2 创建者账号信息（private key）
// const signer = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
const signer = createKeypairFromFile(os.homedir() + "/.config/solana/id.json");

const pg = {
    connection,
    PROGRAM_ID: new PublicKey(PDA_PROGRAM_ID),
    wallet: {
        keypair: signer,
        publicKey: signer.publicKey,
    },
};

describe("Test PDA", () => {
    // Instruction Variant indexes
    enum InstructionVariant {
        Create = 0,
        Increment = 1,
    }

    class Assignable {
        constructor(properties) {
            Object.keys(properties).map(key => {
                return (this[key] = properties[key]);
            });
        }
    }
    class PageVisits extends Assignable {
        toBuffer(): Buffer {
            return Buffer.from(borsh.serialize(PageVisitsSchema, this));
        }
        static fromBuffer(buffer: Buffer) {
            return borsh.deserialize(PageVisitsDeserialize, PageVisits, buffer);
        }
    }
    const PageVisitsDeserialize = new Map([
        [
            PageVisits,
            {
                kind: "struct",
                fields: [
                    ["page_visits", "u32"],
                    ["bump", "u8"],
                ],
            },
        ],
    ]);
    const PageVisitsSchema = new Map([
        [
            PageVisits,
            {
                kind: "struct",
                fields: [
                    ["id", "u8"],
                    ["page_visits", "u32"],
                    ["bump", "u8"],
                ],
            },
        ],
    ]);
    class IncrementInstruction extends Assignable {
        toBuffer(): Buffer {
            return Buffer.from(borsh.serialize(IncrementSchema, this));
        }
    }
    const IncrementSchema = new Map([
        [
            IncrementInstruction,
            {
                kind: "struct",
                fields: [["id", "u8"]],
            },
        ],
    ]);
    const testUser = Keypair.generate();
    it("create a test user", async () => {
        // Create greetings account instruction
        const lamports =
            await pg.connection.getMinimumBalanceForRentExemption(0);

        let ix = SystemProgram.createAccount({
            fromPubkey: signer.publicKey,
            newAccountPubkey: testUser.publicKey,
            lamports,
            space: 0,
            programId: SystemProgram.programId,
        });

        let sig = await sendAndConfirmTransaction(
            connection,
            new Transaction().add(ix),
            [signer, testUser]
        );
        console.log(`🎉 Use 'solana confirm -v ${sig}' to see the logs`);
        console.log(`Local Wallet: ${signer.publicKey}`);
        console.log(`Created User: ${testUser.publicKey}`);
    });

    function derivePageVisitsPda(userPubkey: PublicKey) {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("page_visits"), userPubkey.toBuffer()],
            pg.PROGRAM_ID
        );
    }

    it("Create the page visits tracking PDA", async () => {
        let [pageVisitsPda, pageVisitsBump] = derivePageVisitsPda(
            testUser.publicKey
        );

        // prettier-ignore
        const ixs = [
            new TransactionInstruction({
                keys: [
                    {pubkey: pageVisitsPda, isSigner: false, isWritable: true},
                    {pubkey: testUser.publicKey, isSigner: false, isWritable: false},
                    {pubkey: signer.publicKey, isSigner: true, isWritable: true},
                    {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
                ],
                programId: pg.PROGRAM_ID,
                data: new PageVisits({ id: InstructionVariant.Create, page_visits: 0, bump: pageVisitsBump,}).toBuffer(),
            }),
        ];
        await createAndSendV0Tx(signer, connection, ixs);
    });
    it("Visit the page!", async () => {
        let [pageVisitsPda, _] = derivePageVisitsPda(testUser.publicKey);
        // prettier-ignore
        const ixs = [
            new TransactionInstruction({
                keys: [
                    { pubkey: pageVisitsPda,isSigner: false,isWritable: true,},
                    { pubkey: signer.publicKey,isSigner: true,isWritable: true,},
                ],
                programId: pg.PROGRAM_ID,
                data: new IncrementInstruction({
                    id: InstructionVariant.Increment,
                }).toBuffer(),
            }),
        ];
        await createAndSendV0Tx(signer, connection, ixs);
    });
    it("Read page visits", async () => {
        const [pageVisitsPda, _] = derivePageVisitsPda(testUser.publicKey);
        const accountInfo: any = await connection.getAccountInfo(pageVisitsPda);
        const readPageVisits: any = PageVisits.fromBuffer(accountInfo.data);
        console.log(`Number of page visits: ${readPageVisits.page_visits}`);
        assert.equal(readPageVisits.page_visits, 1);
    });
});
