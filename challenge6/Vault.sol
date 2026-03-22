// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vault {
    mapping(address => uint256) public balances;

    // SecureVault v1.0
    // We guarantee your funds are safe.

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // 🔥 Vulnerability: External call before state update
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");

        // State update happens after
        unchecked {
            balances[msg.sender] -= amount;
        }
    }
}
