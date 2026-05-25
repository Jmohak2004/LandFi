const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'world.json');

const ZONES = ['neon-district', 'cyber-bay', 'sky-tower', 'meta-mall', 'arcade-block'];
const BUILDING_TYPES = ['none', 'gallery', 'club', 'shop', 'office', 'arena'];

function enrichParcel(parcel) {
  return {
    deedMinted: false,
    deedTokenId: null,
    stakedAmount: 0,
    stakeMultiplier: 1,
    totalShares: 10000,
    sharesHeld: {},
    lease: null,
    ...parcel,
    sharesHeld: parcel.sharesHeld || {},
    stakedAmount: parcel.stakedAmount || 0,
    stakeMultiplier: parcel.stakeMultiplier || 1,
    deedMinted: parcel.deedMinted || false,
    deedTokenId: parcel.deedTokenId || null,
    lease: parcel.lease || null,
  };
}

function generateParcels() {
  const parcels = [];
  let id = 1;
  const gridSize = 8;
  const spacing = 12;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
      const basePrice = 500 + Math.floor(Math.random() * 4500);
      const rarity = basePrice > 3500 ? 'legendary' : basePrice > 2000 ? 'rare' : 'common';
      parcels.push(enrichParcel({
        id: `P-${String(id).padStart(3, '0')}`,
        gridX: x,
        gridZ: z,
        position: [(x - gridSize / 2) * spacing, 0, (z - gridSize / 2) * spacing],
        zone,
        price: basePrice,
        rarity,
        owner: null,
        building: 'none',
        incomePerHour: 0,
        listed: false,
        listPrice: null,
        name: `${zone.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} Parcel ${id}`,
        description: `Tokenized land parcel in ${zone.replace(/-/g, ' ')}. Eligible for deed minting, staking yield, and fractional liquidity.`,
      }));
      id++;
    }
  }
  return parcels;
}

function defaultGovernance() {
  return [
    {
      id: 'GOV-001',
      title: 'Reduce marketplace fee to 2%',
      description: 'Lower secondary-sale protocol fee from 5% to 2% to increase land liquidity across all zones.',
      status: 'active',
      votesFor: 1240,
      votesAgainst: 380,
      quorum: 1500,
      endsAt: '2026-06-30',
      proposer: 'landi-dao',
    },
    {
      id: 'GOV-002',
      title: 'Launch Sky Tower infrastructure fund',
      description: 'Allocate 50,000 META from treasury to develop transit and venue infrastructure in sky-tower zone.',
      status: 'active',
      votesFor: 890,
      votesAgainst: 210,
      quorum: 1200,
      endsAt: '2026-07-15',
      proposer: 'landi-dao',
    },
    {
      id: 'GOV-003',
      title: 'Enable cross-zone land leasing',
      description: 'Allow parcel owners to lease land to tenants with on-chain lease agreements and revenue sharing.',
      status: 'passed',
      votesFor: 2100,
      votesAgainst: 420,
      quorum: 1500,
      endsAt: '2026-05-01',
      proposer: 'landi-dao',
    },
  ];
}

function migrateWorld(world) {
  world.parcels = (world.parcels || []).map(enrichParcel);
  if (!world.governance) world.governance = defaultGovernance();
  if (!world.proposalVotes) world.proposalVotes = {};
  if (!world.zoneMetrics) world.zoneMetrics = computeZoneMetrics(world.parcels);
  world.marketStats = world.marketStats || { totalVolume: 0, parcelsSold: 0, activeListings: 0 };
  return world;
}

function computeZoneMetrics(parcels) {
  const metrics = {};
  for (const zone of ZONES) {
    const inZone = parcels.filter(p => p.zone === zone);
    const owned = inZone.filter(p => p.owner);
    const listed = inZone.filter(p => p.listed);
    const prices = inZone.map(p => p.listed && p.listPrice ? p.listPrice : p.price);
    metrics[zone] = {
      parcelCount: inZone.length,
      ownedCount: owned.length,
      listedCount: listed.length,
      floorPrice: prices.length ? Math.min(...prices) : 0,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      totalStaked: inZone.reduce((s, p) => s + (p.stakedAmount || 0), 0),
      deedsMinted: inZone.filter(p => p.deedMinted).length,
    };
  }
  return metrics;
}

function defaultWorld() {
  const parcels = generateParcels();
  return {
    parcels,
    governance: defaultGovernance(),
    proposalVotes: {},
    zoneMetrics: computeZoneMetrics(parcels),
    events: [
      {
        id: 'EVT-001',
        title: 'Neon Night Market',
        zone: 'neon-district',
        date: '2026-06-15',
        attendees: 1240,
        revenue: 8500,
        host: 'system',
      },
      {
        id: 'EVT-002',
        title: 'Cyber Bay DJ Festival',
        zone: 'cyber-bay',
        date: '2026-07-02',
        attendees: 3200,
        revenue: 22000,
        host: 'system',
      },
    ],
    transactions: [],
    marketStats: {
      totalVolume: 0,
      parcelsSold: 0,
      activeListings: 0,
    },
  };
}

function loadWorld() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const world = migrateWorld(JSON.parse(raw));
      world.zoneMetrics = computeZoneMetrics(world.parcels);
      return world;
    }
  } catch (e) {
    console.warn('Could not load world data, regenerating.', e.message);
  }
  const world = defaultWorld();
  saveWorld(world);
  return world;
}

function saveWorld(world) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(world, null, 2));
}

function recalcStats(world) {
  world.marketStats.activeListings = world.parcels.filter(p => p.listed).length;
  world.marketStats.parcelsSold = world.transactions.filter(t => t.type === 'buy').length;
  world.marketStats.totalVolume = world.transactions.reduce((s, t) => s + (t.amount || 0), 0);
  world.marketStats.deedsMinted = world.parcels.filter(p => p.deedMinted).length;
  world.marketStats.totalStaked = world.parcels.reduce((s, p) => s + (p.stakedAmount || 0), 0);
  world.zoneMetrics = computeZoneMetrics(world.parcels);
}

function calcStakeMultiplier(stakedAmount) {
  return Math.min(2.5, 1 + stakedAmount / 5000);
}

function getReputation(user) {
  const owned = user.ownedParcels?.length || 0;
  const earned = user.totalEarned || 0;
  const score = owned * 100 + Math.floor(earned / 100);
  if (score >= 2000) return { tier: 'Architect', level: 5, score };
  if (score >= 1000) return { tier: 'Developer', level: 4, score };
  if (score >= 500) return { tier: 'Investor', level: 3, score };
  if (score >= 150) return { tier: 'Citizen', level: 2, score };
  return { tier: 'Explorer', level: 1, score };
}

function buildingIncome(building) {
  const rates = { none: 0, gallery: 12, club: 28, shop: 18, office: 22, arena: 45 };
  return rates[building] || 0;
}

module.exports = {
  loadWorld,
  saveWorld,
  recalcStats,
  buildingIncome,
  defaultWorld,
  migrateWorld,
  enrichParcel,
  computeZoneMetrics,
  calcStakeMultiplier,
  getReputation,
  defaultGovernance,
  BUILDING_TYPES,
  ZONES,
  DATA_FILE,
};
