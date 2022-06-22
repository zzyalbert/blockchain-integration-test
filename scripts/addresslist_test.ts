import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { AddressList, CallCode, Greeter } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction, Wallet, BigNumberish, Overrides, Contract } from "ethers";
import { expect } from "chai";
import { createAccounts, sendCube, expectSuccess, runResult, testCaseStart, testCaseEnd } from "./utils"


dotenv.config();

const gasLimit = 1000000;
const addressListAddr = process.env.ADDRESS_LIST_ADDR || "";
const adminAddr = process.env.ADMIN_ADDR || "";

let admin: SignerWithAddress;
let addresslist: AddressList;

enum DIR {
  From = 0,
  To,
  Both,
};

enum CheckType {
  CheckNone = 0,
  CheckFrom,
  CheckTo,
  CheckBothInAny
}

async function main() {
  // init global var
  admin = await ethers.getSigner(adminAddr);
  addresslist = (await ethers.getContractFactory("AddressList", admin)).attach(addressListAddr);

  // run all tests
  testCaseStart("testBlacklist_SendCube");
  await testBlacklist_SendCube();
  testCaseEnd("testBlacklist_SendCube");

  testCaseStart("testBlacklist_Call");
  await testBlacklist_Call();
  testCaseEnd("testBlacklist_Call");

  testCaseStart("testBlacklist_Rule");
  await testBlacklist_Rule();
  testCaseEnd("testBlacklist_Rule");

  testCaseStart("testDevVerify");
  await testDevVerify();
  testCaseEnd("testDevVerify");
}

async function testBlacklist_SendCube() {
  const accounts = await createAccounts(admin, 2);

  // blackFrom to none
  testCaseStart("blackFrom to none", 1);
  await addblack(accounts[0].address, DIR.From);
  expect(await sendCube(accounts[0], accounts[1], "1")).to.equals("address denied");
  testCaseEnd("blackFrom to none", 1);

  // none to blackFrom
  testCaseStart("none to blackFrom", 1);
  expect(await sendCube(accounts[1], accounts[0], "1")).to.equals("success");
  await removeblack(accounts[0].address, DIR.From)
  testCaseEnd("none to blackFrom", 1);

  // blackTo to none
  testCaseStart("blackTo to none", 1);
  await addblack(accounts[0].address, DIR.To);
  expect(await sendCube(accounts[0], accounts[1], "1")).to.equals("success");
  testCaseEnd("blackTo to none", 1);

  // none to blackTo
  testCaseStart("none to blackTo", 1);
  expect(await sendCube(accounts[1], accounts[0], "1")).to.equals("address denied");
  await removeblack(accounts[0].address, DIR.To)
  testCaseEnd("none to blackTo", 1);

  // blackBoth to none
  testCaseStart("blackBoth to none", 1);
  await addblack(accounts[0].address, DIR.Both);
  expect(await sendCube(accounts[0], accounts[1], "1")).to.equals("address denied");
  testCaseEnd("blackBoth to none", 1);

  // none to blackBoth
  testCaseStart("none to blackBoth", 1);
  expect(await sendCube(accounts[1], accounts[0], "1")).to.equals("address denied");
  await removeblack(accounts[0].address, DIR.Both)
  testCaseEnd("none to blackBoth", 1);
}

async function testBlacklist_Call() {
  const account = (await createAccounts(admin, 1))[0];
  const expectedStaticCallResult = "0x000000000000000000000000000000000000071A";

  const receiver = await (await ethers.getContractFactory("GreeterSub", account)).deploy("calls");
  const calls = await (await ethers.getContractFactory("Greeter", account)).deploy();
  const callcode = await (await ethers.getContractFactory("CallCode", account)).deploy();

  const call = async (caller: Greeter, receiver: string): Promise<string> => runResult(() => caller.testCall(receiver, 10));
  const staticCall = async (caller: Greeter, receiver: string): Promise<string> => {
    await sendCube(account, account, "0"); // used for waiting
    return caller.testStaticCall(receiver).catch((error: any) => error.message)
  }
  const delegateCall = async (caller: Greeter, receiver: string): Promise<string> => runResult(() => caller.testDelegateCall(receiver, 11));
  const callCode = async (caller: CallCode, receiver: string): Promise<string> => runResult(() => caller.testCallCode(receiver, 12));

  // blackFrom to none
  testCaseStart("blackFrom to none", 1);
  await addblack(calls.address, DIR.From);
  await addblack(callcode.address, DIR.From);
  testCaseStart("call", 2);
  expect(await call(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("call", 2);
  testCaseStart("staticCall", 2);
  expect(await staticCall(calls, receiver.address)).to.contains("ErrStaticCall");
  testCaseEnd("staticCall", 2);
  testCaseStart("delegateCall", 2);
  expect(await delegateCall(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("delegateCall", 2);
  testCaseStart("callCode", 2);
  expect(await callCode(callcode, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("callCode", 2);
  await removeblack(calls.address, DIR.From);
  await removeblack(callcode.address, DIR.From);
  testCaseEnd("blackFrom to none", 1);

  // none to blackFrom
  testCaseStart("none to blackFrom", 1);
  await addblack(receiver.address, DIR.From);
  testCaseStart("call", 2);
  expect(await call(calls, receiver.address)).to.equals("success");
  testCaseEnd("call", 2);
  testCaseStart("staticCall", 2);
  expect(await staticCall(calls, receiver.address)).to.equals(expectedStaticCallResult);
  testCaseEnd("staticCall", 2);
  testCaseStart("delegateCall", 2);
  expect(await delegateCall(calls, receiver.address)).to.equals("success");
  testCaseEnd("delegateCall", 2);
  testCaseStart("callCode", 2);
  expect(await callCode(callcode, receiver.address)).to.equals("success");
  testCaseEnd("callCode", 2);
  await removeblack(receiver.address, DIR.From);
  testCaseEnd("none to blackFrom", 1);

  // blackTo to none
  testCaseStart("blackTo to none", 1);
  await addblack(calls.address, DIR.To);
  await addblack(callcode.address, DIR.To);
  testCaseStart("call", 2);
  expect(await call(calls, receiver.address)).to.contains("address denied");
  testCaseEnd("call", 2);
  testCaseStart("staticCall", 2);
  expect(await staticCall(calls, receiver.address)).to.equals(expectedStaticCallResult);
  testCaseEnd("staticCall", 2);
  testCaseStart("delegateCall", 2);
  expect(await delegateCall(calls, receiver.address)).to.contains("address denied");
  testCaseEnd("delegateCall", 2);
  testCaseStart("callCode", 2);
  expect(await callCode(callcode, receiver.address)).to.contains("address denied");
  testCaseEnd("callCode", 2);
  await removeblack(calls.address, DIR.To);
  await removeblack(callcode.address, DIR.To);
  testCaseEnd("blackTo to none", 1);

  // none to blackTo
  testCaseStart("none to blackTo", 1);
  await addblack(receiver.address, DIR.To);
  testCaseStart("call", 2);
  expect(await call(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("call", 2);
  testCaseStart("staticCall", 2);
  expect(await staticCall(calls, receiver.address)).to.contains("ErrStaticCall");
  testCaseEnd("staticCall", 2);
  testCaseStart("delegateCall", 2);
  expect(await delegateCall(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("delegateCall", 2);
  testCaseStart("callCode", 2);
  expect(await callCode(callcode, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("callCode", 2);
  await removeblack(receiver.address, DIR.To);
  testCaseEnd("none to blackTo", 1);

  // blackBoth to none
  testCaseStart("blackBoth to none", 1);
  await addblack(calls.address, DIR.Both);
  await addblack(callcode.address, DIR.Both);
  testCaseStart("call", 2);
  expect(await call(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("call", 2);
  testCaseStart("staticCall", 2);
  expect(await staticCall(calls, receiver.address)).to.contains("ErrStaticCall");
  testCaseEnd("staticCall", 2);
  testCaseStart("delegateCall", 2);
  expect(await delegateCall(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("delegateCall", 2);
  testCaseStart("callCode", 2);
  expect(await callCode(callcode, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("callCode", 2);
  await removeblack(calls.address, DIR.Both);
  await removeblack(callcode.address, DIR.Both);
  testCaseEnd("blackBoth to none", 1);

  // none to blackBoth
  testCaseStart("none to blackBoth", 1);
  await addblack(receiver.address, DIR.Both);
  testCaseStart("call", 2);
  expect(await call(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("call", 2);
  testCaseStart("staticCall", 2);
  expect(await staticCall(calls, receiver.address)).to.contains("ErrStaticCall");
  testCaseEnd("staticCall", 2);
  testCaseStart("delegateCall", 2);
  expect(await delegateCall(calls, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("delegateCall", 2);
  testCaseStart("callCode", 2);
  expect(await callCode(callcode, receiver.address)).to.contains("cannot estimate gas");
  testCaseEnd("callCode", 2);
  await removeblack(receiver.address, DIR.Both);
  testCaseEnd("none to blackBoth", 1);
}

async function testBlacklist_Rule() {
  const accounts = await createAccounts(admin, 2);
  const contract = await (await ethers.getContractFactory("Greeter")).deploy();

  // add all rules in case that they were removed before
  const transferSig = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const sentSig = "0x06b541ddaa720db2b10a4d0cdac39b8d360425fc073085fac19bc82614677987";
  const transferSingleSig = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
  const transferBatchSig = "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

  await addRule(transferSig, 1, CheckType.CheckFrom);
  await addRule(sentSig, 2, CheckType.CheckFrom);
  await addRule(transferSingleSig, 2, CheckType.CheckFrom);
  await addRule(transferBatchSig, 2, CheckType.CheckFrom);

  // define tx sender to run diffrenent contract functions
  const send = async (transferFn: (
    receiver: string,
    numTokens: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ) => Promise<ContractTransaction>, to: string): Promise<string> => {
    try {
      await (await transferFn(to, 1)).wait();
      return "success";
    } catch (error: any) {
      return error.message;
    }
  };

  // define 5 types of transfer
  const transfer = async (from: Wallet, to: Wallet): Promise<String> => send(contract.connect(from).testERC20Transfer, to.address);
  const TransferFrom = async (from: Wallet, to: Wallet): Promise<String> => send(contract.connect(to).testERC20TransferFrom, from.address);
  const sent = async (from: Wallet, to: Wallet): Promise<String> => send(contract.connect(from).testERC777Sent, to.address);
  const transferSingle = async (from: Wallet, to: Wallet): Promise<String> => send(contract.connect(from).testERC1155TransferSingle, to.address);
  const transferBatch = async (from: Wallet, to: Wallet): Promise<String> => send(contract.connect(from).testERC1155TransferBatch, to.address);


  // blackFrom to none
  testCaseStart("blackFrom to none", 1);
  await addblack(accounts[0].address, DIR.From);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("transferBatch", 2);
  testCaseEnd("blackFrom to none", 1);

  // none to blackFrom
  testCaseStart("none to blackFrom", 1);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[1], accounts[0])).to.equals("address denied");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transferBatch", 2);
  await removeblack(accounts[0].address, DIR.From)
  testCaseEnd("none to blackFrom", 1);

  // blackTo to none
  testCaseStart("blackTo to none", 1);
  await addblack(accounts[0].address, DIR.To);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[0], accounts[1])).to.equals("success");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[0], accounts[1])).to.equals("success");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[0], accounts[1])).to.equals("success");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[0], accounts[1])).to.equals("success");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[0], accounts[1])).to.equals("success");
  testCaseEnd("transferBatch", 2);
  testCaseEnd("blackTo to none", 1);

  // none to blackTo
  testCaseStart("none to blackTo", 1);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transferBatch", 2);
  await removeblack(accounts[0].address, DIR.To)
  testCaseEnd("none to blackTo", 1);

  // blackBoth to none
  testCaseStart("blackBoth to none", 1);
  await addblack(accounts[0].address, DIR.Both);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[0], accounts[1])).to.contains("cannot estimate gas");
  testCaseEnd("transferBatch", 2);
  testCaseEnd("blackBoth to none", 1);

  // none to blackBoth
  testCaseStart("none to blackBoth", 1);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[1], accounts[0])).to.equals("address denied");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[1], accounts[0])).to.equals("success");
  testCaseEnd("transferBatch", 2);
  await removeblack(accounts[0].address, DIR.Both)
  testCaseEnd("none to blackBoth", 1);

  // remove all rules and re-run blackFrom to none
  testCaseStart("blackFrom to non without all rules", 1);
  await removeRule(transferSig, 1)
  await removeRule(sentSig, 2)
  await removeRule(transferSingleSig, 2)
  await removeRule(transferBatchSig, 2)

  await addblack(accounts[0].address, DIR.From);
  testCaseStart("transfer", 2);
  expect(await transfer(accounts[0], accounts[1])).to.equals("address denied");
  testCaseEnd("transfer", 2);
  testCaseStart("TransferFrom", 2);
  expect(await TransferFrom(accounts[0], accounts[1])).to.equals("success");
  testCaseEnd("TransferFrom", 2);
  testCaseStart("sent", 2);
  expect(await sent(accounts[0], accounts[1])).to.equals("address denied");
  testCaseEnd("sent", 2);
  testCaseStart("transferSingle", 2);
  expect(await transferSingle(accounts[0], accounts[1])).to.equals("address denied");
  testCaseEnd("transferSingle", 2);
  testCaseStart("transferBatch", 2);
  expect(await transferBatch(accounts[0], accounts[1])).to.equals("address denied");
  testCaseEnd("transferBatch", 2);

  // restore env
  await removeblack(accounts[0].address, DIR.From)

  await addRule(transferSig, 1, CheckType.CheckFrom);
  await addRule(sentSig, 2, CheckType.CheckFrom);
  await addRule(transferSingleSig, 2, CheckType.CheckFrom);
  await addRule(transferBatchSig, 2, CheckType.CheckFrom);
  testCaseEnd("blackFrom to non without all rules", 1);
}


async function testDevVerify() {
  const account = (await createAccounts(admin, 1))[0]

  await disableDevVerify();
  await disableCheckInnerCreation();

  const contractFactory = await ethers.getContractFactory("Greeter", account);
  const preDeployed = await (await contractFactory.deploy()).deployed();

  const deployByEOA = async (signer: Wallet): Promise<string> => {
    try {
      let contract = await contractFactory.connect(signer).deploy();
      contract = await contract.deployed();
      return "success";
    } catch (error: any) {
      return error.message;
    }
  };

  const deployByContract = async (signer: Wallet): Promise<string> => {
    try {
      const contract = contractFactory.connect(signer).attach(preDeployed.address);
      await (await contract.testCreateSubContract("subcontract")).wait();
      return "success";
    } catch (error: any) {
      return error.message;
    }
  };

  // enable DevVerify, EOA deploys contract without being verified"
  testCaseStart("enable DevVerify without verified EOA", 1);
  await enableDevVerify();
  expect(await deployByEOA(account)).to.contains("cannot estimate gas");
  testCaseEnd("enable DevVerify without verified EOA", 1);

  // enable DevVerify, EOA deploys contract with being verified"
  testCaseStart("enable DevVerify with verified EOA", 1);
  await addDev(account.address);
  expect(await deployByEOA(account)).to.equal("success");
  testCaseEnd("enable DevVerify with verified EOA", 1);

  // enable DevVerify & addblack from, EOA deploys contract with being verified"
  testCaseStart("enable DevVerify & blackFrom with verified EOA", 1);
  await addblack(account.address, DIR.From);
  expect(await deployByEOA(account)).to.equal("address denied");
  await removeblack(account.address, DIR.From)
  testCaseEnd("enable DevVerify & blackFrom with verified EOA", 1);

  // enable DevVerify & addblack To, EOA deploys contract with being verified"
  testCaseStart("enable DevVerify & blackTo with verified EOA", 1);
  await addblack(account.address, DIR.To);
  expect(await deployByEOA(account)).to.equal("success");
  await removeblack(account.address, DIR.To)
  testCaseEnd("enable DevVerify & blackTo with verified EOA", 1);

  // enable DevVerify & addblack Both, EOA deploys contract with being verified"
  testCaseStart("enable DevVerify & blackBoth with verified EOA", 1);
  await addblack(account.address, DIR.Both);
  expect(await deployByEOA(account)).to.equal("address denied");
  await removeblack(account.address, DIR.Both)
  testCaseEnd("enable DevVerify & blackBoth with verified EOA", 1);

  // enable DevVerify & enable CheckInnerCreation, Contract deploys contract without being verified
  testCaseStart("enable DevVerify & enable CheckInnerCreation without verified contract", 1);
  await enableCheckInnerCreation();
  expect(await deployByContract(account)).to.contains("cannot estimate gas");
  testCaseEnd("enable DevVerify & enable CheckInnerCreation without verified contract", 1);

  // enable DevVerify & enable CheckInnerCreation, Contract deploys contract with being verified
  testCaseStart("enable DevVerify & enable CheckInnerCreation with verified contract", 1);
  await addDev(preDeployed.address);
  expect(await deployByContract(account)).to.equal("success");
  testCaseEnd("enable DevVerify & enable CheckInnerCreation with verified contract", 1);

  // enable DevVerify & disable CheckInnerCreation, Contract deploys contract with being verified
  testCaseStart("enable DevVerify & disable CheckInnerCreation with verified contract", 1);
  await disableCheckInnerCreation();
  expect(await deployByContract(account)).to.equal("success");
  testCaseEnd("enable DevVerify & disable CheckInnerCreation with verified contract", 1);

  // enable DevVerify & disable CheckInnerCreation, Contract deploys contract without being verified
  testCaseStart("enable DevVerify & disable CheckInnerCreation without verified contract", 1);
  await removeDev(preDeployed.address);
  expect(await deployByContract(account)).to.equal("success");
  testCaseEnd("enable DevVerify & disable CheckInnerCreation without verified contract", 1);

  // disable DevVerify, EOA deploys contract with being verified"
  testCaseStart("disable DevVerify with verified EOA", 1);
  await disableDevVerify();
  expect(await deployByEOA(account)).to.equal("success");
  testCaseEnd("disable DevVerify with verified EOA", 1);

  // disable DevVerify, EOA deploys contract without being verified"
  testCaseStart("disable DevVerify without verified EOA", 1);
  await removeDev(account.address);
  expect(await deployByEOA(account)).to.equal("success");
  testCaseEnd("disable DevVerify without verified EOA", 1);
}

//
// the following are all contracts assistent functions
//
const addblack = async (black: string, direct: number) => {
  await expectSuccess(() => addresslist.addBlacklist(black, direct, { gasLimit }));
};

const removeblack = async (black: string, direct: number) => {
  await expectSuccess(() => addresslist.removeBlacklist(black, direct, { gasLimit }));
};

const enableDevVerify = async () => {
  await expectSuccess(() => addresslist.enableDevVerify());
};

const disableDevVerify = async () => {
  try {
    await (await addresslist.disableDevVerify()).wait();
  } catch (error) {
  }
};

const enableCheckInnerCreation = async () => {
  await expectSuccess(() => addresslist.enableCheckInnerCreation());
};

const disableCheckInnerCreation = async () => {
  try {
    await (await addresslist.disableCheckInnerCreation()).wait();
  } catch (error) {
  }
};

const addDev = async (addr: string) => {
  await expectSuccess(() => addresslist.addDeveloper(addr));
};

const removeDev = async (addr: string) => {
  await expectSuccess(() => addresslist.removeDeveloper(addr));
};

const addRule = async (eventSig: string, checkIndex: number, checkType: CheckType) => {
  await expectSuccess(() => addresslist.addOrUpdateRule(eventSig, checkIndex, checkType, { gasLimit }));
}

const removeRule = async (eventSig: string, checkIndex: number) => {
  await expectSuccess(() => addresslist.removeRule(eventSig, checkIndex, { gasLimit }));
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
