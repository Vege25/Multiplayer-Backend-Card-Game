import {createServer} from 'http';
import {WebSocketServer} from 'ws';
import app from './app';
import {handleConnection} from './websocket/connection';
import {ExtendedWebSocket} from './websocket/types';

const port = process.env.PORT || 3000;
const server = createServer(app);

// Create WebSocket server using the same HTTP server
const wss = new WebSocketServer({server});

// Handle new connections
wss.on('connection', (ws, req) => {
  handleConnection(ws as ExtendedWebSocket, req);
});

// Start the server (both HTTP and WebSocket)
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
