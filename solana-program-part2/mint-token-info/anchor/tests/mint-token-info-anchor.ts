import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MintTokenInfoAnchor } from "../target/types/mint_token_info_anchor";
import * as splToken from "@coral-xyz/spl-token";
import { assert } from "chai";

const MINT = "Gir7LUMrsXHv5gGctKNp6th2Pj7j9qmYR1LSrsHS6Yaj";

describe("mint-token-info-anchor", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const payer = provider.wallet as anchor.Wallet;

    const program = anchor.workspace
        .MintTokenInfoAnchor as Program<MintTokenInfoAnchor>;

    let testUser = anchor.web3.Keypair.generate();

    it("Create a test user", async () => {
        let ix = anchor.web3.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            lamports:
                await provider.connection.getMinimumBalanceForRentExemption(0),
            newAccountPubkey: testUser.publicKey,
            programId: anchor.web3.SystemProgram.programId,
            space: 0,
        });
        await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            new anchor.web3.Transaction().add(ix),
            [payer.payer, testUser]
        );
        console.log(`Local Wallet: ${payer.publicKey}`);
        console.log(`Created User: ${testUser.publicKey}`);
    });

    function derivePageVisitsPda(userPubkey: anchor.web3.PublicKey) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("mint_token_info"),
                splToken.SPL_TOKEN_PROGRAM_ID.toBuffer(),
                userPubkey.toBuffer(),
            ],
            program.programId
        );
    }

    it("create test user PDA!", async () => {
        const [mintPda, _] = derivePageVisitsPda(testUser.publicKey);

        // Add your test here.
        const tx = await program.methods
            .mintInfo({
                mint: "",
                name: "test",
                symbol: "te",
                icon: "http://localhost/icon",
            })
            .accounts({
                mintPda,
                // mint: new anchor.web3.PublicKey(MINT),
                mint: testUser.publicKey,
                payer: payer.publicKey,
                tokenProgram: splToken.SPL_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([payer.payer])
            .rpc();
        console.log("Your transaction signature", tx);
    });
    it("get mint token info", async () => {
        const [mintPda, _] = derivePageVisitsPda(testUser.publicKey);
        const extMint = program.account.extMint.fetch(mintPda);
        assert.equal((await extMint).name, "test");
    });
});
