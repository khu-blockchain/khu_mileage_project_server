// SPDX-License-Identifier: UNLICENSED
// Need to npm i @klaytn/contracts to import sol file
pragma solidity ^0.8.4;

import "@klaytn/contracts/KIP/token/KIP7/KIP7.sol";
import "@klaytn/contracts/KIP/token/KIP7/extensions/KIP7Burnable.sol";
import "@klaytn/contracts/security/Pausable.sol";
import "@klaytn/contracts/access/Ownable.sol";

contract SwMileage is KIP7, KIP7Burnable, Pausable, Ownable {
    constructor(string memory name_, string memory symbol_) KIP7(name_, symbol_) {}

    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(KIP7, KIP7Burnable)
    returns (bool)
    {
        return
            super.supportsInterface(interfaceId);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
    internal onlyOwner
    whenNotPaused
    override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
