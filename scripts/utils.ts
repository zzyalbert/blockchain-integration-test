import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";

export const emptyAddr = "0x0000000000000000000000000000000000000000";

// create test accounts
export const createAccounts = async (from: SignerWithAddress, n: number): Promise<Wallet[]> => {
    let accounts: Wallet[] = [];
    let waits = [];
    let nonce = await from.getTransactionCount();
    const provider = from.provider || ethers.getDefaultProvider();
    for (let i = 0; i < n; i++) {
        const eoa = ethers.Wallet.createRandom();
        waits.push(from.sendTransaction({ nonce: nonce++, to: eoa.address, value: parseEther("10") }));
        accounts.push(eoa.connect(provider));
    }
    for (let i in waits) {
        await (await waits[i]).wait();
    }
    return accounts;
};

export const sendCube = async (from: Wallet, to: Wallet, value: string): Promise<string> => {
    try {
        await (await from.sendTransaction({ to: to.address, value: parseEther(value) })).wait();
        return "success";
    } catch (error: any) {
        return error.message;
    }
};

export const runResult = async (run: () => Promise<ContractTransaction>): Promise<string> => {
    try {
        await (await run()).wait();
        return "success"
    } catch (error: any) {
        return error.message;
    }
};

export const expectSuccess = async (run: () => Promise<ContractTransaction>) => {
    expect(await runResult(run)).to.equal("success");
}

const titleTag = "==========================";
const subTag = "--------";

const makeLeftTag = (level: number): string => {
    let left = "";
    for (let i = 0; i < level; i++) {
        left += subTag;
    }
    return left
}

export const testCaseStart = (name: string, level?: number) => {
    let n = level || 0;
    if (n == 0) {
        console.log("\n", titleTag, "start", "[", name, "]", titleTag);
    } else {
        console.log("\n", makeLeftTag(n), "start", "[", name, "]");
    }
};

export const testCaseEnd = (name: string, level?: number) => {
    let n = level || 0;
    if (n == 0) {
        console.log("\n", titleTag, "[", name, "]", "OK", titleTag);
    } else {
        console.log("", makeLeftTag(n), "[", name, "]", "OK");
    }
};