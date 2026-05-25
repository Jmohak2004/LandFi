const http = require('http');
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { createMultiplayerServer } = require('./multiplayer');
const {
  loadWorld,
  saveWorld,
  recalcStats,
  buildingIncome,
  calcStakeMultiplier,
  getReputation,
  BUILDING_TYPES,
  ZONES,
} = require('./metaverseData');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let world = loadWorld();
recalcStats(world);

const users = new Map();

function getUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      displayName: userId.startsWith('0x')
        ? `${userId.slice(0, 6)}...${userId.slice(-4)}`
        : `Explorer_${userId.slice(0, 6)}`,
      balance: 25000,
      ownedParcels: [],
      totalEarned: 0,
      totalStaked: 0,
      governancePower: 1,
      walletAddress: userId.startsWith('0x') ? userId : null,
      votes: {},
    });
  }
  const user = users.get(userId);
  if (!user.votes) user.votes = {};
  if (user.totalStaked === undefined) user.totalStaked = 0;
  return user;
}

function userPayload(user) {
  const owned = world.parcels.filter(p => p.owner === user.id);
  const reputation = getReputation({ ...user, ownedParcels: owned.map(p => p.id) });
  return {
    ...user,
    ownedParcels: owned,
    portfolioValue: owned.reduce((s, p) => s + p.price, 0),
    reputation,
    governancePower: Math.max(1, owned.length + Math.floor((user.totalStaked || 0) / 2000)),
  };
}

function findParcel(id) {
  return world.parcels.find(p => p.id === id);
}

function logTransaction(type, userId, parcelId, amount, meta = {}) {
  const tx = {
    id: randomUUID(),
    type,
    userId,
    parcelId,
    amount,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  world.transactions.unshift(tx);
  if (world.transactions.length > 200) world.transactions.pop();
  recalcStats(world);
  saveWorld(world);
  return tx;
}

app.get('/api/health', (_, res) => res.json({ ok: true, name: 'Landi Metaverse API', multiplayer: true }));

app.get('/api/world', (_, res) => {
  res.json({
    parcels: world.parcels,
    events: world.events,
    marketStats: world.marketStats,
    buildingTypes: BUILDING_TYPES,
    governance: world.governance,
    zoneMetrics: world.zoneMetrics,
    zones: ZONES,
  });
});

app.get('/api/analytics', (_, res) => {
  recalcStats(world);
  const floorPrices = world.parcels.map(p => (p.listed && p.listPrice ? p.listPrice : p.price));
  res.json({
    zoneMetrics: world.zoneMetrics,
    marketStats: world.marketStats,
    floorPrice: floorPrices.length ? Math.min(...floorPrices) : 0,
    avgParcelPrice: floorPrices.length
      ? Math.round(floorPrices.reduce((a, b) => a + b, 0) / floorPrices.length)
      : 0,
    occupancyRate: Math.round(
      (world.parcels.filter(p => p.owner).length / world.parcels.length) * 100
    ),
    totalParcels: world.parcels.length,
  });
});

app.get('/api/parcels', (_, res) => res.json(world.parcels));

app.get('/api/parcels/:id', (req, res) => {
  const parcel = findParcel(req.params.id);
  if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
  res.json(parcel);
});

app.get('/api/user/:userId', (req, res) => {
  res.json(userPayload(getUser(req.params.userId)));
});

app.post('/api/user/:userId/register', (req, res) => {
  const user = getUser(req.params.userId);
  if (req.body.displayName) user.displayName = req.body.displayName;
  if (req.body.walletAddress) {
    user.walletAddress = req.body.walletAddress;
    user.displayName = `${req.body.walletAddress.slice(0, 6)}...${req.body.walletAddress.slice(-4)}`;
  }
  res.json(user);
});

app.post('/api/user/:userId/link-wallet', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const user = getUser(req.params.userId);
  user.walletAddress = walletAddress.toLowerCase();
  user.displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  res.json(user);
});

app.post('/api/parcels/:id/buy', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
  if (parcel.owner === userId) return res.status(400).json({ error: 'You already own this parcel' });
  if (parcel.owner && !parcel.listed) return res.status(400).json({ error: 'Parcel not for sale' });

  const price = parcel.listed && parcel.listPrice ? parcel.listPrice : parcel.price;
  if (user.balance < price) return res.status(400).json({ error: 'Insufficient META balance' });

  const previousOwner = parcel.owner;
  user.balance -= price;
  parcel.owner = userId;
  parcel.listed = false;
  parcel.listPrice = null;
  parcel.incomePerHour = Math.floor(
    buildingIncome(parcel.building) * (parcel.stakeMultiplier || 1)
  );
  if (!parcel.sharesHeld) parcel.sharesHeld = {};
  parcel.sharesHeld[userId] = parcel.totalShares || 10000;

  if (previousOwner) {
    const seller = getUser(previousOwner);
    seller.balance += Math.floor(price * 0.95);
  }

  if (!user.ownedParcels.includes(parcel.id)) user.ownedParcels.push(parcel.id);
  logTransaction('buy', userId, parcel.id, price, { from: previousOwner, wallet: user.walletAddress });
  saveWorld(world);
  res.json({ parcel, user, transaction: world.transactions[0] });
});

app.post('/api/parcels/:id/list', (req, res) => {
  const { userId, listPrice } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
  if (parcel.owner !== userId) return res.status(403).json({ error: 'Not your parcel' });
  if (!listPrice || listPrice < 100) return res.status(400).json({ error: 'Invalid list price' });

  parcel.listed = true;
  parcel.listPrice = listPrice;
  recalcStats(world);
  saveWorld(world);
  res.json({ parcel });
});

app.post('/api/parcels/:id/unlist', (req, res) => {
  const { userId } = req.body;
  const parcel = findParcel(req.params.id);
  if (!parcel || parcel.owner !== userId) return res.status(403).json({ error: 'Forbidden' });
  parcel.listed = false;
  parcel.listPrice = null;
  recalcStats(world);
  saveWorld(world);
  res.json({ parcel });
});

app.post('/api/parcels/:id/build', (req, res) => {
  const { userId, building } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
  if (parcel.owner !== userId) return res.status(403).json({ error: 'Not your parcel' });
  if (!BUILDING_TYPES.includes(building)) return res.status(400).json({ error: 'Invalid building type' });

  const costs = { none: 0, gallery: 800, club: 1500, shop: 1200, office: 2000, arena: 3500 };
  const cost = costs[building] || 0;
  if (user.balance < cost) return res.status(400).json({ error: 'Insufficient balance for build' });

  user.balance -= cost;
  parcel.building = building;
  parcel.incomePerHour = Math.floor(buildingIncome(building) * (parcel.stakeMultiplier || 1));
  saveWorld(world);
  res.json({ parcel, user });
});

app.post('/api/parcels/:id/collect', (req, res) => {
  const { userId, hours = 1 } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel || parcel.owner !== userId) return res.status(403).json({ error: 'Forbidden' });
  const earned = Math.floor(parcel.incomePerHour * Math.min(hours, 24));
  user.balance += earned;
  user.totalEarned += earned;
  logTransaction('income', userId, parcel.id, earned);
  res.json({ earned, user, parcel });
});

app.post('/api/events', (req, res) => {
  const { userId, title, zone, parcelId } = req.body;
  const user = getUser(userId);
  const parcel = parcelId ? findParcel(parcelId) : null;

  if (parcel && parcel.owner !== userId) {
    return res.status(403).json({ error: 'You must own the parcel to host events' });
  }

  const cost = 500;
  if (user.balance < cost) return res.status(400).json({ error: 'Need 500 META to host an event' });

  user.balance -= cost;
  const event = {
    id: `EVT-${randomUUID().slice(0, 8)}`,
    title: title || 'Metaverse Gathering',
    zone: zone || parcel?.zone || 'neon-district',
    date: new Date().toISOString().split('T')[0],
    attendees: Math.floor(Math.random() * 500) + 50,
    revenue: Math.floor(Math.random() * 3000) + 500,
    host: userId,
    parcelId: parcelId || null,
  };

  world.events.unshift(event);
  user.balance += event.revenue;
  user.totalEarned += event.revenue;
  saveWorld(world);
  res.json({ event, user });
});

app.get('/api/events', (_, res) => res.json(world.events));

app.get('/api/transactions', (_, res) => {
  res.json(world.transactions.slice(0, 50));
});

app.get('/api/governance', (_, res) => {
  res.json(world.governance || []);
});

app.post('/api/governance/:proposalId/vote', (req, res) => {
  const { userId, support } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (typeof support !== 'boolean') return res.status(400).json({ error: 'support must be boolean' });

  const proposal = (world.governance || []).find(p => p.id === req.params.proposalId);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  if (proposal.status !== 'active') return res.status(400).json({ error: 'Proposal not active' });

  const user = getUser(userId);
  if (user.votes[proposal.id]) return res.status(400).json({ error: 'Already voted on this proposal' });

  const power = userPayload(user).governancePower;
  user.votes[proposal.id] = support;
  if (support) proposal.votesFor += power;
  else proposal.votesAgainst += power;

  logTransaction('governance_vote', userId, null, 0, { proposalId: proposal.id, support, power });
  saveWorld(world);
  res.json({ proposal, user: userPayload(user) });
});

app.post('/api/parcels/:id/mint-deed', (req, res) => {
  const { userId } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
  if (parcel.owner !== userId) return res.status(403).json({ error: 'Only owner can mint deed' });
  if (!user.walletAddress) {
    return res.status(400).json({ error: 'Connect wallet to mint on-chain land deed' });
  }
  if (parcel.deedMinted) return res.status(400).json({ error: 'Deed already minted' });

  const mintCost = 250;
  if (user.balance < mintCost) return res.status(400).json({ error: 'Need 250 META for deed minting fee' });

  user.balance -= mintCost;
  parcel.deedMinted = true;
  parcel.deedTokenId = `LAND-${parcel.id}-${user.walletAddress.slice(2, 10).toUpperCase()}`;

  logTransaction('mint_deed', userId, parcel.id, mintCost, { tokenId: parcel.deedTokenId });
  recalcStats(world);
  saveWorld(world);
  res.json({ parcel, user: userPayload(user), deed: { tokenId: parcel.deedTokenId, standard: 'ERC-1155' } });
});

app.post('/api/parcels/:id/stake', (req, res) => {
  const { userId, amount } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel || parcel.owner !== userId) return res.status(403).json({ error: 'Forbidden' });
  if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum stake is 100 META' });
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient META' });

  user.balance -= amount;
  user.totalStaked = (user.totalStaked || 0) + amount;
  parcel.stakedAmount = (parcel.stakedAmount || 0) + amount;
  parcel.stakeMultiplier = calcStakeMultiplier(parcel.stakedAmount);
  parcel.incomePerHour = Math.floor(buildingIncome(parcel.building) * parcel.stakeMultiplier);

  logTransaction('stake', userId, parcel.id, amount);
  saveWorld(world);
  res.json({ parcel, user: userPayload(user) });
});

app.post('/api/parcels/:id/unstake', (req, res) => {
  const { userId, amount } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel || parcel.owner !== userId) return res.status(403).json({ error: 'Forbidden' });
  const unstake = amount || parcel.stakedAmount;
  if (!unstake || unstake > parcel.stakedAmount) return res.status(400).json({ error: 'Invalid unstake amount' });

  parcel.stakedAmount -= unstake;
  user.totalStaked = Math.max(0, (user.totalStaked || 0) - unstake);
  user.balance += unstake;
  parcel.stakeMultiplier = calcStakeMultiplier(parcel.stakedAmount);
  parcel.incomePerHour = Math.floor(buildingIncome(parcel.building) * parcel.stakeMultiplier);

  logTransaction('unstake', userId, parcel.id, unstake);
  saveWorld(world);
  res.json({ parcel, user: userPayload(user) });
});

app.post('/api/parcels/:id/fractionalize', (req, res) => {
  const { userId, shares, pricePerShare } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel || parcel.owner !== userId) return res.status(403).json({ error: 'Forbidden' });
  if (!parcel.deedMinted) return res.status(400).json({ error: 'Mint land deed before fractionalizing' });
  if (!shares || shares < 100 || shares > 9000) {
    return res.status(400).json({ error: 'List between 100 and 9000 shares' });
  }
  if (!pricePerShare || pricePerShare < 1) return res.status(400).json({ error: 'Invalid price per share' });

  const ownerShares = parcel.sharesHeld?.[userId] ?? parcel.totalShares;
  if (ownerShares < shares) return res.status(400).json({ error: 'Insufficient shares' });

  parcel.sharesHeld[userId] = ownerShares - shares;
  parcel.fractionListing = {
    seller: userId,
    shares,
    pricePerShare,
    totalPrice: shares * pricePerShare,
  };

  logTransaction('fractional_list', userId, parcel.id, shares * pricePerShare, { shares });
  saveWorld(world);
  res.json({ parcel });
});

app.post('/api/parcels/:id/buy-shares', (req, res) => {
  const { userId } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);
  const listing = parcel?.fractionListing;

  if (!parcel || !listing) return res.status(400).json({ error: 'No fractional listing' });
  if (listing.seller === userId) return res.status(400).json({ error: 'Cannot buy your own shares' });
  if (user.balance < listing.totalPrice) return res.status(400).json({ error: 'Insufficient META' });

  user.balance -= listing.totalPrice;
  const seller = getUser(listing.seller);
  seller.balance += Math.floor(listing.totalPrice * 0.97);

  parcel.sharesHeld[userId] = (parcel.sharesHeld[userId] || 0) + listing.shares;
  delete parcel.fractionListing;

  logTransaction('fractional_buy', userId, parcel.id, listing.totalPrice, { shares: listing.shares });
  saveWorld(world);
  res.json({ parcel, user: userPayload(user) });
});

app.post('/api/parcels/:id/lease', (req, res) => {
  const { userId, rentPerDay, days } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel || parcel.owner !== userId) return res.status(403).json({ error: 'Forbidden' });
  if (!rentPerDay || rentPerDay < 10) return res.status(400).json({ error: 'Invalid rent' });
  if (!days || days < 1 || days > 30) return res.status(400).json({ error: 'Lease 1-30 days' });

  parcel.lease = {
    owner: userId,
    rentPerDay,
    days,
    listed: true,
    tenant: null,
  };

  logTransaction('lease_list', userId, parcel.id, rentPerDay);
  saveWorld(world);
  res.json({ parcel });
});

app.post('/api/parcels/:id/rent', (req, res) => {
  const { userId, days } = req.body;
  const parcel = findParcel(req.params.id);
  const user = getUser(userId);

  if (!parcel?.lease?.listed) return res.status(400).json({ error: 'Parcel not available for rent' });
  if (parcel.owner === userId) return res.status(400).json({ error: 'Cannot rent your own parcel' });

  const rentDays = days || parcel.lease.days;
  const cost = parcel.lease.rentPerDay * rentDays;
  if (user.balance < cost) return res.status(400).json({ error: 'Insufficient META' });

  user.balance -= cost;
  const owner = getUser(parcel.owner);
  owner.balance += Math.floor(cost * 0.95);

  parcel.lease.tenant = userId;
  parcel.lease.listed = false;
  parcel.lease.expiresAt = new Date(Date.now() + rentDays * 86400000).toISOString();

  logTransaction('lease_rent', userId, parcel.id, cost, { days: rentDays });
  saveWorld(world);
  res.json({ parcel, user: userPayload(user) });
});

app.post('/api/world/reset', (_, res) => {
  const { defaultWorld: resetWorld } = require('./metaverseData');
  world = resetWorld();
  users.clear();
  recalcStats(world);
  saveWorld(world);
  res.json({ message: 'World reset', parcels: world.parcels.length });
});

const server = http.createServer(app);
createMultiplayerServer(server);

server.listen(port, () => {
  console.log(`Landi Metaverse API → http://localhost:${port}`);
  console.log(`Multiplayer WebSocket → ws://localhost:${port}/ws`);
});
