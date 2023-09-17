import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Helloworld } from "../target/types/helloworld";

describe("helloworld", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Helloworld as Program<Helloworld>;

    let payer = provider.wallet as anchor.Wallet;
    it("Say hello!", async () => {
        // Add your test here.
        const tx = await program.methods
            .sayHello()
            .accounts({
                payer: payer.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([payer.payer])
            .rpc();
        console.log("Your transaction signature", tx);
    });
});
