import { describe, it } from "node:test";
import dotenv from "dotenv";
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    clusterApiUrl,
} from "@solana/web3.js";
import fs from "fs";
import os from "os";
import borsh from "borsh";
import { createAndSendV0Tx } from "../utils/sendTransaction.ts";
import assert from "assert";

dotenv.config();

const createKeypairFromFile = (filePath: string): Keypair => {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync(filePath, "utf-8")))
    );
};

const MINT = "Gir7LUMrsXHv5gGctKNp6th2Pj7j9qmYR1LSrsHS6Yaj";

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
    MINT: new PublicKey(MINT),
    wallet: {
        keypair: signer,
        publicKey: signer.publicKey,
    },
};

describe("Test PDA", () => {
    // it("greeting", async () => {
    //     const ixs = [
    //         new TransactionInstruction({
    //             keys: [
    //                 {
    //                     pubkey: pg.wallet.publicKey,
    //                     isSigner: false,
    //                     isWritable: true,
    //                 },
    //             ],
    //             programId: pg.PROGRAM_ID,
    //         }),
    //     ];
    //     await createAndSendV0Tx(signer, connection, ixs);
    // });
    // return;
    // Instruction Variant indexes
    enum InstructionVariant {
        Mint = 0,
        // Increment = 1,
    }

    class Assignable {
        constructor(properties) {
            Object.keys(properties).map(key => {
                return (this[key] = properties[key]);
            });
        }
    }
    class ExtMint extends Assignable {
        toBuffer(): Buffer {
            return Buffer.from(borsh.serialize(PageVisitsSchema, this));
        }
        static fromBuffer(buffer: Buffer) {
            return borsh.deserialize(PageVisitsDeserialize, ExtMint, buffer);
        }
    }
    const PageVisitsDeserialize = new Map([
        [
            ExtMint,
            {
                kind: "struct",
                fields: [
                    ["mint", "string"],
                    ["name", "string"],
                    ["symbol", "string"],
                    ["icon", "string"],
                ],
            },
        ],
    ]);
    const PageVisitsSchema = new Map([
        [
            ExtMint,
            {
                kind: "struct",
                fields: [
                    ["id", "u8"],
                    ["name", "string"],
                    ["symbol", "string"],
                    ["icon", "string"],
                ],
            },
        ],
    ]);

    function derivePageVisitsPda(userPubkey: PublicKey) {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("ext_mint1"),
                pg.PROGRAM_ID.toBuffer(),
                userPubkey.toBuffer(),
            ],
            pg.PROGRAM_ID
        );
    }

    it("Create the page visits tracking PDA", async () => {
        let [pageVisitsPda, _] = derivePageVisitsPda(pg.MINT);

        // prettier-ignore
        const ixs = [
            new TransactionInstruction({
                keys: [
                    {pubkey: pageVisitsPda, isSigner: false, isWritable: true},
                    {pubkey: pg.MINT, isSigner: false, isWritable: false},
                    {pubkey: signer.publicKey, isSigner: true, isWritable: true},
                    {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
                ],
                programId: pg.PROGRAM_ID,
                data: new ExtMint({ id: InstructionVariant.Mint, name: "SOLO", symbol: "SOLO",icon:"http://solo.com",}).toBuffer(),
            }),
        ];
        await createAndSendV0Tx(signer, connection, ixs);
    });
    it("Read page visits", async () => {
        const [pageVisitsPda, _] = derivePageVisitsPda(pg.MINT);
        const accountInfo: any = await connection.getAccountInfo(pageVisitsPda);
        const readPageVisits: any = ExtMint.fromBuffer(accountInfo.data);
        assert.equal(readPageVisits.mint, MINT);
    });
});
