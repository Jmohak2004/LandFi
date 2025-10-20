// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LandFi {
    IERC20 public fractionToken;

    struct Property {
        string name;
        uint256 price;
        address owner;
        bool isRegistered;
    }

    struct EMI {
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 emiPerMonth;
        uint256 monthsLeft;
        bool isActive;
    }

    mapping(uint256 => Property) public properties;
    mapping(address => mapping(uint256 => EMI)) public userEMIs;
    uint256 public propertyCount;

    event PropertyRegistered(uint256 propertyId, string name, uint256 price, address owner);
    event EMIStarted(address user, uint256 propertyId, uint256 totalAmount, uint256 months);

    constructor(address _fractionToken) {
        require(_fractionToken != address(0), "Token address cannot be zero");
        fractionToken = IERC20(_fractionToken);
    }

    function registerProperty(string memory _name, uint256 _price) external {
        propertyCount++;
        properties[propertyCount] = Property({
            name: _name,
            price: _price,
            owner: msg.sender,
            isRegistered: true
        });
        emit PropertyRegistered(propertyCount, _name, _price, msg.sender);
    }

    function startEMI(uint256 _propertyId, uint256 _months) external {
        Property memory prop = properties[_propertyId];
        require(prop.isRegistered, "Property not registered");
        require(_months > 0, "Months should be > 0");
        require(!userEMIs[msg.sender][_propertyId].isActive, "EMI already active");

        uint256 emiPerMonth = prop.price / _months;

        userEMIs[msg.sender][_propertyId] = EMI({
            totalAmount: prop.price,
            paidAmount: 0,
            emiPerMonth: emiPerMonth,
            monthsLeft: _months,
            isActive: true
        });

        emit EMIStarted(msg.sender, _propertyId, prop.price, _months);
    }

    function payEMI(uint256 _propertyId) external {
        EMI storage emi = userEMIs[msg.sender][_propertyId];
        require(emi.isActive, "No active EMI");
        require(emi.monthsLeft > 0, "EMI already completed");

        require(fractionToken.transferFrom(msg.sender, address(this), emi.emiPerMonth), "Token transfer failed");

        emi.paidAmount += emi.emiPerMonth;
        emi.monthsLeft--;

        if (emi.monthsLeft == 0) {
            emi.isActive = false;
        }
    }

    function getProperty(uint256 _propertyId) external view returns (Property memory) {
        return properties[_propertyId];
    }

    function getEMI(address _user, uint256 _propertyId) external view returns (EMI memory) {
        return userEMIs[_user][_propertyId];
    }
}
