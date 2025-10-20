// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
Minimal LandFi prototype:
- ERC1155 FractionToken contract for fractional property tokens (one tokenId per property)
- LandFi contract to register properties, run EMI plans (monthly installments), mint fractions on payment,
  and a simple marketplace to list & buy fractional tokens.

NOT production-ready. Security, access-control, KYC, oracle integrations, off-chain document anchoring,
and regulatory/legal checks are required for real-world use.

Compile with Solidity 0.8.19 (Remix recommended). Uses OpenZeppelin libs via GitHub imports.
*/

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC1155/ERC1155.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";

/// @title FractionToken - ERC1155 token, mintable by owner (LandFi)
contract FractionToken is ERC1155, Ownable {
    string public name;
    string public symbol;

    // mapping tokenId => total supply (for convenience)
    mapping(uint256 => uint256) public totalSupply;

    constructor(string memory uri_, string memory _name, string memory _symbol) ERC1155(uri_) {
        name = _name;
        symbol = _symbol;
    }

    /// @notice mint tokens; restricted to owner (LandFi contract after ownership transfer)
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
        totalSupply[id] += amount;
    }

    /// @notice burn tokens (owner-only helper)
    function burn(address from, uint256 id, uint256 amount) external onlyOwner {
        _burn(from, id, amount);
        totalSupply[id] -= amount;
    }

    /// @notice set a new URI (owner)
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}

/// @title LandFi - manages properties, EMI payments, fractional token issuance, and a simple marketplace
contract LandFi is Ownable, ReentrancyGuard {
    FractionToken public tokenContract;
    uint256 public nextPropertyId;
    uint256 public nextListingId;

    struct Property {
        uint256 propertyId;
        address seller;           // original property lister / agency
        uint256 tokenId;          // token id representing this property in ERC1155
        uint256 totalTokens;      // total fractional tokens representing whole property
        uint256 priceWei;         // total price (in wei) for full property
        uint256 months;           // EMI months
        bool active;
        string metadataURI;       // off-chain metadata hash / IPFS link (optional)
    }

    // EMI agreement per investor per property
    struct EMI {
        address investor;
        uint256 propertyId;
        uint256 totalPaid;        // total paid so far (wei)
        uint256 installmentWei;   // per installment amount (wei)
        uint256 monthsPaid;       // months completed
        uint256 startTimestamp;
        bool active;
    }

    // marketplace listing for selling fractions
    struct Listing {
        uint256 listingId;
        address seller;
        uint256 tokenId;
        uint256 amount;           // number of tokens (fractions) to sell
        uint256 pricePerTokenWei; // wei per token
        bool active;
    }

    mapping(uint256 => Property) public properties;          // propertyId => Property
    mapping(uint256 => EMI) public emis;                     // propertyId hashed with investor -> EMI id? simplified: propertyId -> EMI (single investor prototyping)
    mapping(uint256 => Listing) public listings;             // listingId => Listing

    // To support multiple investors per property you'd map propertyId+investor to EMI struct; for prototype we allow one EMI per property
    // For demonstration we will map propertyId -> EMI, expecting one investor per property at a time.

    event PropertyRegistered(uint256 indexed propertyId, uint256 tokenId, address indexed seller, uint256 priceWei, uint256 totalTokens, uint256 months);
    event EMIStarted(uint256 indexed propertyId, address indexed investor, uint256 installmentWei, uint256 months);
    event InstallmentPaid(uint256 indexed propertyId, address indexed investor, uint256 amountWei, uint256 monthsPaid);
    event EMICompleted(uint256 indexed propertyId, address indexed investor);
    event ListingCreated(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 amount, uint256 pricePerTokenWei);
    event ListingBought(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPriceWei);

    constructor(address _fractionTokenAddress) {
        require(_fractionTokenAddress != address(0), "Token address 0");
        tokenContract = FractionToken(_fractionTokenAddress);
        nextPropertyId = 1;
        nextListingId = 1;
    }

    /// -----------------------------------------------------------------------
    /// Property registration (by seller / agency)
    /// -----------------------------------------------------------------------
    /// @notice Register a property and create a tokenId reserved for it
    /// @param tokenId token id in ERC1155 which will represent fractions of this property
    /// @param totalTokens total fractional tokens representing the whole property (e.g., 10_000)
    /// @param priceWei total price of the property in wei (e.g., 1e18 for 1 ETH)
    /// @param months number of EMI months
    /// @param metadataURI optional metadata (IPFS hash)
    function registerProperty(
        uint256 tokenId,
        uint256 totalTokens,
        uint256 priceWei,
        uint256 months,
        string calldata metadataURI
    ) external returns (uint256) {
        require(totalTokens > 0, "totalTokens>0");
        require(priceWei > 0, "price>0");
        require(months > 0, "months>0");
        require(properties[nextPropertyId].active == false, "id in use");

        // NOTE: tokenId should be unique per property. Caller decides tokenId (simple prototype).
        uint256 pid = nextPropertyId++;
        properties[pid] = Property({
            propertyId: pid,
            seller: msg.sender,
            tokenId: tokenId,
            totalTokens: totalTokens,
            priceWei: priceWei,
            months: months,
            active: true,
            metadataURI: metadataURI
        });

        // Initially mint all tokens to contract as escrow, to be released to investors per EMI.
        // Owner (LandFi) must have minting rights on FractionToken; in practice transfer ownership of token contract to LandFi before calling registerProperty
        tokenContract.mint(address(this), tokenId, totalTokens, "");

        emit PropertyRegistered(pid, tokenId, msg.sender, priceWei, totalTokens, months);
        return pid;
    }

    /// -----------------------------------------------------------------------
    /// EMI purchase flow
    /// -----------------------------------------------------------------------
    /// @notice Start EMI purchase for a property. Investor must send first installment amount (installmentWei).
    /// For simplicity: one EMI agreement per property in this prototype.
    function startEMI(uint256 propertyId) external payable nonReentrant {
        Property storage p = properties[propertyId];
        require(p.active, "property not active");
        require(emis[propertyId].active == false, "EMI active already");

        // compute installment (integer division). Last installment may be slightly larger to cover remainder.
        uint256 installment = p.priceWei / p.months;
        require(msg.value >= installment, "send at least one installment");

        emis[propertyId] = EMI({
            investor: msg.sender,
            propertyId: propertyId,
            totalPaid: msg.value,
            installmentWei: installment,
            monthsPaid: 1,
            startTimestamp: block.timestamp,
            active: true
        });

        // release proportional tokens for the paid installment(s)
        _releaseTokensOnPayment(propertyId, msg.sender, msg.value);

        emit EMIStarted(propertyId, msg.sender, installment, p.months);

        // keep funds in contract; seller can withdraw later via withdrawSellerFunds
    }

    /// @notice Pay next installment for a property EMI
    function payInstallment(uint256 propertyId) external payable nonReentrant {
        EMI storage e = emis[propertyId];
        Property storage p = properties[propertyId];
        require(e.active, "no active emi");
        require(e.investor == msg.sender, "not investor");
        require(p.active, "property inactive");
        require(e.monthsPaid < p.months, "already fully paid");

        // uint256 installment = e.installmentWei;
        // allow overpay (counts toward tokens proportionally)
        require(msg.value >= 1, "send >0");

        e.totalPaid += msg.value;
        e.monthsPaid += 1;

        _releaseTokensOnPayment(propertyId, msg.sender, msg.value);

        emit InstallmentPaid(propertyId, msg.sender, msg.value, e.monthsPaid);

        if (e.monthsPaid >= p.months) {
            e.active = false;
            emit EMICompleted(propertyId, msg.sender);
        }
    }

    /// @dev internal: proportional token release based on payment amount
    function _releaseTokensOnPayment(uint256 propertyId, address to, uint256 amountWei) internal {
        Property storage p = properties[propertyId];

        // Determine tokens to send: tokenAmount = totalTokens * amountWei / priceWei
        // Do multiplication first to avoid precision loss; be careful with overflow (we're in 0.8.x)
        uint256 tokenAmount = (p.totalTokens * amountWei) / p.priceWei;
        if (tokenAmount == 0) {
            // if amount too small, accumulate funds but don't transfer tokens yet
            return;
        }

        // Transfer tokens from contract escrow to investor
        tokenContract.safeTransferFrom(address(this), to, p.tokenId, tokenAmount, "");
    }

    /// -----------------------------------------------------------------------
    /// Seller withdraw funds (collected EMI payments)
    /// -----------------------------------------------------------------------
    /// @notice Withdraw accumulated funds for a property (only the original seller)
    function withdrawSellerFunds(uint256 propertyId) external nonReentrant {
        Property storage p = properties[propertyId];
        require(p.seller == msg.sender, "not seller");
        // For prototype: we consider the contract balance as seller funds; in production you'd track per-property balances.
        uint256 bal = address(this).balance;
        require(bal > 0, "no funds");
        payable(msg.sender).transfer(bal);
    }

    /// -----------------------------------------------------------------------
    /// Simple marketplace: seller lists fractions (tokens) for sale; buyer can purchase
    /// -----------------------------------------------------------------------

    /// @notice Create a listing to sell fraction tokens (seller must have approved/own tokens)
    function createListing(uint256 tokenId, uint256 amount, uint256 pricePerTokenWei) external returns (uint256) {
        require(amount > 0, "amount>0");
        require(pricePerTokenWei > 0, "price>0");

        uint256 lid = nextListingId++;
        listings[lid] = Listing({
            listingId: lid,
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerTokenWei: pricePerTokenWei,
            active: true
        });

        emit ListingCreated(lid, tokenId, msg.sender, amount, pricePerTokenWei);
        return lid;
    }

    /// @notice Buy from a listing (buyer must send ETH = amount * pricePerTokenWei). Listing amount fully purchased only (prototype).
    function buyListing(uint256 listingId) external payable nonReentrant {
        Listing storage L = listings[listingId];
        require(L.active, "listing inactive");
        require(msg.value >= L.amount * L.pricePerTokenWei, "insufficient payment");

        // Transfer tokens from seller to buyer. Seller must have approved the contract or the contract acts as operator.
        // For simplicity, require seller to have previously approved this contract for token transfers.
        // Transfer tokens:
        tokenContract.safeTransferFrom(L.seller, msg.sender, L.tokenId, L.amount, "");

        // Pay seller
        (bool sent, ) = L.seller.call{value: msg.value}("");
        require(sent, "payment to seller failed");

        L.active = false;
        emit ListingBought(listingId, msg.sender, L.amount, msg.value);
    }

    /// -----------------------------------------------------------------------
    /// Helper / admin functions
    /// -----------------------------------------------------------------------

    /// @notice Admin can pause a property (deactivate)
    function deactivateProperty(uint256 propertyId) external onlyOwner {
        properties[propertyId].active = false;
    }

    /// @notice Admin can rescue ETH mistakenly sent to contract (emergency)
    function rescueETH(address to) external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "no bal");
        payable(to).transfer(bal);
    }

    /// Fallback / receive
    receive() external payable {}
    fallback() external payable {}
}
