import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { OnChainDao } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { createAccounts, emptyAddr, expectSuccess, testCaseEnd, testCaseStart } from "./utils"

dotenv.config();

const onChainDaoAddr = process.env.ON_CHAIN_DAO_ADDR || "";
const adminAddr = process.env.ADMIN_ADDR || "";

let admin: SignerWithAddress;
let onchaindao: OnChainDao;

type Proposal = {
  action: number,
  from?: string,
  to?: string,
  value?: number,
  data?: string
}

async function main() {
  // init global var
  admin = await ethers.getSigner(adminAddr);
  onchaindao = (await ethers.getContractFactory("OnChainDao", admin)).attach(onChainDaoAddr);

  testCaseStart("testProposalAction0");
  await testProposalAction0();
  testCaseEnd("testProposalAction0");

  testCaseStart("testProposalAction1");
  await testProposalAction1();
  testCaseEnd("testProposalAction1");
}

async function testProposalAction0() {
  const accounts = await createAccounts(admin, 2);

  // Test Send Cube with proposal
  testCaseStart("TestSendCube", 1);
  const value = 2000000;
  let balanceBefore = await accounts[1].getBalance();
  
  await commitProposal({
    action: 0,
    from: accounts[0].address,
    to: accounts[1].address,
    value
  });
  expect(await accounts[1].getBalance()).to.equal(balanceBefore.add(value));
  testCaseEnd("TestSendCube", 1);

  // Test call contract with proposal
  testCaseStart("TestCallContract", 1);
  let contract = await (await ethers.getContractFactory("Greeter", accounts[0])).deploy();
  await (await contract.setMessage("before proposal")).wait();
  expect(await contract.message()).to.equal("before proposal");
  
  const data = contract.interface.encodeFunctionData('setMessage', ["after proposal"]);
  await commitProposal({
    action: 0,
    from: accounts[1].address,
    to: contract.address,
    data
  });
  expect(await contract.message()).to.equal("after proposal");
  testCaseEnd("TestCallContract", 1);
}

async function testProposalAction1() {
  const contractFactory = await ethers.getContractFactory("Greeter")
  let contract = await contractFactory.connect(admin).deploy()
  contract = await contract.deployed()

  const emptyCodeLength = 2
  let code = await admin.provider?.getCode(contract.address)
  expect(code?.length).to.greaterThan(emptyCodeLength)

  testCaseStart("TestClearCode", 1);
  await commitProposal({
    action: 1,
    to: contract.address,
  });

  code = await admin.provider?.getCode(contract.address)
  expect(code?.length).to.equal(emptyCodeLength)
  testCaseEnd("TestClearCode", 1);
}

const commitProposal = async (prop: Proposal) => {
  await expectSuccess(() => onchaindao.commitProposal(prop.action, prop.from || emptyAddr,
    prop.to || emptyAddr, prop.value || 0, prop.data || '0x'));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
