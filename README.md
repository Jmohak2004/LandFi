# LandFi — Virtual Land Protocol

A production-oriented 3D metaverse for tokenized virtual land: explore a cyberpunk city, acquire parcels, mint on-chain deeds, stake for yield, fractionalize ownership, govern the protocol via DAO, and trade on the marketplace.

## Core Features

### World & Exploration
- **3D open world** — Third-person movement (WASD + Shift), animated city life, coastline
- **64 land parcels** across 5 zones (Neon District, Cyber Bay, Sky Tower, Meta Mall, Arcade Block)
- **Multiplayer** — Real-time avatars via WebSocket
- **VR (WebXR)** — Meta Quest and compatible headsets

### Web3 Economy
- **Land acquisition** — Buy/sell parcels with META (off-chain economy, on-chain ready)
- **Land deeds (ERC-1155)** — Mint tokenized deeds when wallet is connected
- **Yield staking** — Stake META on owned parcels for up to 2.5x passive income multiplier
- **Fractional liquidity** — List and buy fractional shares after deed minting
- **Leasing** — Owners list parcels; tenants rent for venue access
- **Venue development** — Galleries, commerce hubs, clubs, offices, arenas with hourly yield
- **Events** — Host gatherings on owned land for revenue

### Protocol Layer
- **DAO governance** — Vote on protocol proposals with governance power tied to holdings + stake
- **Protocol dashboard** — Portfolio analytics, zone economics, floor prices, occupancy
- **Activity ledger** — Full transaction history (buys, stakes, deeds, votes, leases)
- **Reputation tiers** — Explorer → Citizen → Investor → Developer → Architect
- **MetaMask identity** — Wallet address as persistent user ID

## Quick Start

```bash
# Terminal 1 — API server
cd server
npm install
npm start

# Terminal 2 — 3D client
cd client
npm install
npm run dev
```

Open **http://localhost:5175**

Optional: copy `client/.env.example` to `client/.env` and set contract addresses after deploying `smartcontract/LandFi.sol` and `FractionToken.sol`.

## Controls

| Key | Action |
|-----|--------|
| W A S D | Move |
| Shift | Run |
| E | Interact with nearest plot |
| Click | Select land parcel |
| R | Toggle ambient audio |

## HUD Panels

| Panel | Description |
|-------|-------------|
| **Dashboard** | Portfolio, zone metrics, on-chain contract status |
| **DAO** | Governance proposals and voting |
| **Activity** | Protocol transaction ledger |
| **Market** | Browse, filter, and acquire parcels |
| **Events** | Live venue calendar |

## Smart Contracts

- `LandFi.sol` — Property registration and EMI-based acquisition
- `FractionToken.sol` — ERC-1155 fractional shares

Wire deployed addresses via `VITE_LANDFI_CONTRACT` and `VITE_FRACTION_TOKEN` in the client `.env`.

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/world` | Parcels, events, governance, zone metrics |
| `GET /api/analytics` | Market overview and occupancy |
| `GET /api/transactions` | Activity ledger |
| `GET /api/governance` | DAO proposals |
| `POST /api/governance/:id/vote` | Cast vote (for/against) |
| `POST /api/parcels/:id/buy` | Acquire land |
| `POST /api/parcels/:id/mint-deed` | Mint ERC-1155 land deed (wallet required) |
| `POST /api/parcels/:id/stake` | Stake META for yield boost |
| `POST /api/parcels/:id/unstake` | Withdraw stake |
| `POST /api/parcels/:id/fractionalize` | List fractional shares |
| `POST /api/parcels/:id/buy-shares` | Buy fractional shares |
| `POST /api/parcels/:id/lease` | List parcel for rent |
| `POST /api/parcels/:id/rent` | Rent a listed parcel |
| `POST /api/parcels/:id/build` | Construct venue |
| `POST /api/parcels/:id/collect` | Collect passive yield |
| `POST /api/events` | Host metaverse event |

## Stack

- **Client:** React, Vite, React Three Fiber, Drei, XR, Zustand, Ethers
- **Server:** Express + WebSocket multiplayer (port 3001), JSON persistence
- **Contracts:** Solidity (OpenZeppelin ERC-1155)
