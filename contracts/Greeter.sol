//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract GreeterSub {
    string public name;    
    uint256 public age;
    address public admin;

    constructor(string memory _name) {
        name = _name;
        admin = address(1818);
    }

    function setAge(uint256 _age) public {
        age = _age;
    }
}

contract Greeter {
    string public message;
    GreeterSub[] public greeterSubAddresses;
    // ERC20
    event Transfer(address indexed from, address indexed to, uint tokens);
    // ERC777
    event Sent(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    //ERC1155
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    // Sets the function signature for delegatecall
    bytes4 constant setAgeSignature = bytes4(keccak256("setAge(uint256)"));

    function testERC20Transfer(address receiver, uint numTokens) public {
        emit Transfer(msg.sender, receiver, numTokens);
    }

    function testERC20TransferFrom(address from, uint numTokens) public {
        emit Transfer(from, msg.sender, numTokens);
    }

    function testERC777Sent(address receiver, uint numTokens) public {
        emit Sent(msg.sender, msg.sender, receiver, numTokens, "", "");
    }

    function testERC1155TransferSingle(address receiver, uint numTokens) public {
        emit TransferSingle(msg.sender, msg.sender, receiver, 0, numTokens);
    }

    function testERC1155TransferBatch(address receiver, uint numTokens) public {
        uint256[] memory a;
        numTokens;
        emit TransferBatch(msg.sender, msg.sender, receiver, a, a);
    }

    function testCall(address payable receiver, uint256 _age) public payable {
        (bool success,) = receiver.call(abi.encodePacked(setAgeSignature, _age));
        require(success, "ErrCall");
    }

    // https://github.com/OpenZeppelin/ethernaut/blob/4f80f8afa47793d9133f03b6c247d8b6b0adc673/contracts/contracts/levels/Preservation.sol
    function testDelegateCall(address receiver, uint256 _age) public {
        (bool success,) = receiver.delegatecall(abi.encodePacked(setAgeSignature, _age));
        require(success, "ErrDelegateCall");
    }

    function testStaticCall(address receiver) public view returns (address){
        // We need to manually run the static call since the getter cannot be flagged as view
        // bytes4(keccak256("admin()")) == 0xf851a440
        (bool success, bytes memory returndata) = receiver.staticcall(hex"f851a440");
        require(success, "ErrStaticCall");
        return abi.decode(returndata, (address));
    }

    function testCreateSubContract(string memory _subName) public {
        GreeterSub sub = new GreeterSub(_subName);
        greeterSubAddresses.push(sub);
    }

    function setMessage(string memory _message) public {
        message = _message;
    }
}
