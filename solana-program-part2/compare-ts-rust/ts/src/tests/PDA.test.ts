import { describe, it } from "node:test";
import dotenv from "dotenv";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "../utils/PDA.js";
import assert from "assert";

dotenv.config();

const PROGRAM_ID = "9eMNGtayMEuNkzfdUYSw8k9msaPhFJG9Bi75wGQDvddR";
const mint = "CQ68EPr2bHQ29bLZdHioLx5An35hfav1mqn36hG74ofH";

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

describe("Test PDA", () => {
    it("findProgramAddress", () => {
        let ata = getAssociatedTokenAddressSync(
            new PublicKey(mint),
            pg.wallet.publicKey
        );
        assert.equal(ata, "4pfQFsxJqaRG1bgWuD8S7cX8Qi1nck7zH5p6ZTdoSbD2");
    });
});
