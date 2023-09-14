import { describe, it } from "node:test";
import dotenv from "dotenv";
import {
    AddressLookupTableProgram,
    Connection,
    Keypair,
    SystemProgram,
    clusterApiUrl,
} from "@solana/web3.js";
import fs from "fs";
import os from "os";
import { createAndSendV0Tx } from "../utils/sendTransaction.ts";
import {
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createInitializeMint2Instruction,
    getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";

dotenv.config();

const createKeypairFromFile = (filePath: string): Keypair => {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync(filePath, "utf-8")))
    );
};

// const MINT = "Gir7LUMrsXHv5gGctKNp6th2Pj7j9qmYR1LSrsHS6Yaj";

// const PDA_PROGRAM_ID = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";

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
    // PROGRAM_ID: new PublicKey(PDA_PROGRAM_ID),
    wallet: {
        keypair: signer,
        publicKey: signer.publicKey,
    },
};

describe("Test alts", () => {
    // 以 ALT 的方式，来组合实现 Mint Token 的创建
    it("mint token by alts", async () => {
        const mintKeypair = Keypair.generate();
        // * Step 1 创建 ALT 的 Table 账户
        const recentSlot = await connection.getSlot();
        const [lookupTableIx, lookupTableAddress] =
            AddressLookupTableProgram.createLookupTable({
                authority: pg.wallet.publicKey,
                payer: pg.wallet.publicKey,
                recentSlot,
            });

        // * Step 2 将用到的账号存入ALT
        const extendIx = await AddressLookupTableProgram.extendLookupTable({
            lookupTable: lookupTableAddress,
            authority: pg.wallet.publicKey,
            payer: pg.wallet.publicKey,
            addresses: [
                pg.wallet.publicKey,
                mintKeypair.publicKey,
                TOKEN_PROGRAM_ID,
                SystemProgram.programId,
            ],
        });

        // 创建ixs

        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const ixs = [
            lookupTableIx,
            extendIx,
            SystemProgram.createAccount({
                fromPubkey: pg.wallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                lamports,
                space: MINT_SIZE,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMint2Instruction(
                mintKeypair.publicKey,
                9,
                pg.wallet.publicKey,
                null
            ),
        ];

        await createAndSendV0Tx(signer, connection, ixs, [signer, mintKeypair]);
    });
});
