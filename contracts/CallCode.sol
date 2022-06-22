//SPDX-License-Identifier: Unlicense
pragma solidity ^0.4.26;

contract CallCode {
    uint256 public age;

    // Sets the function signature for delegatecall
    bytes4 constant setAgeSignature = bytes4(keccak256("setAge(uint256)"));

    // https://blog.csdn.net/TurkeyCock/article/details/83826531
    function testCallCode(address receiver, uint256 _age) public {
        bool success = receiver.callcode(abi.encodePacked(setAgeSignature, _age));
        require(success, "ErrCallCode");
    }
}