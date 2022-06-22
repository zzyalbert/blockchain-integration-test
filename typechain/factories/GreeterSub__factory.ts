/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GreeterSub, GreeterSubInterface } from "../GreeterSub";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "age",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_age",
        type: "uint256",
      },
    ],
    name: "setAge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161070a38038061070a8339818101604052810190610032919061019d565b8060009080519060200190610048929190610092565b5061071a600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050610339565b82805461009e90610267565b90600052602060002090601f0160209004810192826100c05760008555610107565b82601f106100d957805160ff1916838001178555610107565b82800160010185558215610107579182015b828111156101065782518255916020019190600101906100eb565b5b5090506101149190610118565b5090565b5b80821115610131576000816000905550600101610119565b5090565b600061014861014384610203565b6101de565b90508281526020810184848401111561016057600080fd5b61016b848285610234565b509392505050565b600082601f83011261018457600080fd5b8151610194848260208601610135565b91505092915050565b6000602082840312156101af57600080fd5b600082015167ffffffffffffffff8111156101c957600080fd5b6101d584828501610173565b91505092915050565b60006101e86101f9565b90506101f48282610299565b919050565b6000604051905090565b600067ffffffffffffffff82111561021e5761021d6102f9565b5b61022782610328565b9050602081019050919050565b60005b83811015610252578082015181840152602081019050610237565b83811115610261576000848401525b50505050565b6000600282049050600182168061027f57607f821691505b60208210811415610293576102926102ca565b5b50919050565b6102a282610328565b810181811067ffffffffffffffff821117156102c1576102c06102f9565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b6103c2806103486000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806306fdde0314610051578063262a9dff1461006f578063d5dcf1271461008d578063f851a440146100a9575b600080fd5b6100596100c7565b604051610066919061023b565b60405180910390f35b610077610155565b604051610084919061025d565b60405180910390f35b6100a760048036038101906100a291906101a0565b61015b565b005b6100b1610165565b6040516100be9190610220565b60405180910390f35b600080546100d490610303565b80601f016020809104026020016040519081016040528092919081815260200182805461010090610303565b801561014d5780601f106101225761010080835404028352916020019161014d565b820191906000526020600020905b81548152906001019060200180831161013057829003601f168201915b505050505081565b60015481565b8060018190555050565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008135905061019a81610375565b92915050565b6000602082840312156101b257600080fd5b60006101c08482850161018b565b91505092915050565b6101d281610294565b82525050565b60006101e382610278565b6101ed8185610283565b93506101fd8185602086016102d0565b61020681610364565b840191505092915050565b61021a816102c6565b82525050565b600060208201905061023560008301846101c9565b92915050565b6000602082019050818103600083015261025581846101d8565b905092915050565b60006020820190506102726000830184610211565b92915050565b600081519050919050565b600082825260208201905092915050565b600061029f826102a6565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b60005b838110156102ee5780820151818401526020810190506102d3565b838111156102fd576000848401525b50505050565b6000600282049050600182168061031b57607f821691505b6020821081141561032f5761032e610335565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000601f19601f8301169050919050565b61037e816102c6565b811461038957600080fd5b5056fea2646970667358221220127bee8716ad61428ed050437928dcd717e77f3f780840cc449f28c7352cfe4364736f6c63430008040033";

export class GreeterSub__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    _name: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<GreeterSub> {
    return super.deploy(_name, overrides || {}) as Promise<GreeterSub>;
  }
  getDeployTransaction(
    _name: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_name, overrides || {});
  }
  attach(address: string): GreeterSub {
    return super.attach(address) as GreeterSub;
  }
  connect(signer: Signer): GreeterSub__factory {
    return super.connect(signer) as GreeterSub__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GreeterSubInterface {
    return new utils.Interface(_abi) as GreeterSubInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GreeterSub {
    return new Contract(address, _abi, signerOrProvider) as GreeterSub;
  }
}