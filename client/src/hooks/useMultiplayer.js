import { useEffect, useRef, useCallback } from 'react';
import { useMetaverseStore } from '../store/useMetaverseStore';

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  return `${proto}://${host}/ws`;
}

const AVATAR_COLORS = ['#ff00ea', '#00f0ff', '#fbbf24', '#22c55e', '#a855f7', '#ef4444'];

export function useMultiplayer() {
  const wsRef = useRef(null);
  const lastSend = useRef(0);

  const connect = useCallback(() => {
    const state = useMetaverseStore.getState();
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        useMetaverseStore.setState({ multiplayerConnected: true });
        ws.send(JSON.stringify({
          type: 'join',
          id: state.userId,
          name: state.displayName,
          position: state.playerPosition,
          color: state.avatarColor,
          walletAddress: state.walletAddress,
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'welcome') {
          const others = (data.players || []).filter(p => p.id !== state.userId);
          useMetaverseStore.setState({ remotePlayers: others, onlineCount: (data.players || []).length });
        }

        if (data.type === 'player_joined' && data.player?.id !== state.userId) {
          useMetaverseStore.setState(s => {
            const exists = s.remotePlayers.find(p => p.id === data.player.id);
            if (exists) return s;
            return {
              remotePlayers: [...s.remotePlayers, data.player],
              onlineCount: s.onlineCount + 1,
            };
          });
        }

        if (data.type === 'player_moved') {
          useMetaverseStore.setState(s => ({
            remotePlayers: s.remotePlayers.map(p =>
              p.id === data.id
                ? { ...p, position: data.position, rotation: data.rotation }
                : p
            ),
          }));
        }

        if (data.type === 'player_left') {
          useMetaverseStore.setState(s => ({
            remotePlayers: s.remotePlayers.filter(p => p.id !== data.id),
            onlineCount: Math.max(1, s.onlineCount - 1),
          }));
        }

        if (data.type === 'chat') {
          useMetaverseStore.getState().addNotification(`${data.name}: ${data.message}`, 'info');
        }
      };

      ws.onclose = () => {
        useMetaverseStore.setState({ multiplayerConnected: false });
        setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    } catch (_) {
      useMetaverseStore.setState({ multiplayerConnected: false });
    }
  }, []);

  const sendPosition = useCallback((x, y, z, rotY) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (now - lastSend.current < 80) return;
    lastSend.current = now;
    ws.send(JSON.stringify({ type: 'move', x, y, z, rotY }));
  }, []);

  const sendChat = useCallback((message) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat', message }));
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    const idx = Math.floor(Math.random() * AVATAR_COLORS.length);
    useMetaverseStore.setState({ avatarColor: AVATAR_COLORS[idx] });
    connect();
  }, [connect]);

  useEffect(() => {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    useMetaverseStore.setState({ avatarColor: color });
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { sendPosition, sendChat, reconnect };
}
