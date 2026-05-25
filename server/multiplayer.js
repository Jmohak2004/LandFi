const { WebSocketServer } = require('ws');

const AVATAR_COLORS = ['#ff00ea', '#00f0ff', '#fbbf24', '#22c55e', '#a855f7', '#ef4444', '#f97316'];

function createMultiplayerServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const players = new Map();

  function broadcast(data, excludeId = null) {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === 1 && client.playerId !== excludeId) {
        client.send(msg);
      }
    });
  }

  function playerList() {
    return Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      rotation: p.rotation,
      color: p.color,
      walletAddress: p.walletAddress || null,
    }));
  }

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === 'join') {
          const id = data.id;
          if (!id) return;

          ws.playerId = id;
          const color = data.color || AVATAR_COLORS[players.size % AVATAR_COLORS.length];
          players.set(id, {
            id,
            name: data.name || `Explorer_${id.slice(0, 6)}`,
            position: data.position || [0, 0, 15],
            rotation: 0,
            color,
            walletAddress: data.walletAddress || null,
            lastSeen: Date.now(),
          });

          ws.send(JSON.stringify({ type: 'welcome', id, players: playerList() }));
          broadcast({ type: 'player_joined', player: players.get(id) }, id);
          return;
        }

        if (data.type === 'move' && ws.playerId) {
          const p = players.get(ws.playerId);
          if (!p) return;
          p.position = [data.x ?? p.position[0], data.y ?? 0, data.z ?? p.position[2]];
          p.rotation = data.rotY ?? p.rotation;
          p.lastSeen = Date.now();

          broadcast({
            type: 'player_moved',
            id: ws.playerId,
            position: p.position,
            rotation: p.rotation,
          }, ws.playerId);
        }

        if (data.type === 'chat' && ws.playerId && data.message) {
          const p = players.get(ws.playerId);
          broadcast({
            type: 'chat',
            id: ws.playerId,
            name: p?.name,
            message: String(data.message).slice(0, 200),
          });
        }
      } catch (_) {}
    });

    ws.on('close', () => {
      if (ws.playerId) {
        players.delete(ws.playerId);
        broadcast({ type: 'player_left', id: ws.playerId });
      }
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
    const now = Date.now();
    for (const [id, p] of players) {
      if (now - p.lastSeen > 60000) {
        players.delete(id);
        broadcast({ type: 'player_left', id });
      }
    }
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  return { wss, players };
}

module.exports = { createMultiplayerServer };
