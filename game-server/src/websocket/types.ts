import {WebSocket} from 'ws';

export interface ExtendedWebSocket extends WebSocket {
  lobbyId?: string;
  userId?: string;
}
