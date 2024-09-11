// src/websocket/errors.ts

import {ExtendedWebSocket} from './types';

// Handle WebSocket errors
export const handleWebSocketError = (ws: ExtendedWebSocket, error: unknown) => {
  const errMsg = error instanceof Error ? error.message : 'Unknown error';
  console.error(`WebSocket error: ${errMsg}`);

  // You can send a generic error message back to the client if needed
  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        error: 'An error occurred on the server. Please try again later.',
      })
    );
  }
};

// Handle errors related to lobby assignment
export const handleLobbyAssignmentError = (
  ws: ExtendedWebSocket,
  error: unknown
) => {
  const errMsg = error instanceof Error ? error.message : 'Unknown error';
  console.error('Error handling lobby assignment:', errMsg);

  // Send a specific error message to the client
  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({error: 'Failed to assign lobby. Please try again later.'})
    );
  }
};

// Handle invalid message format errors
export const handleInvalidMessageFormatError = (ws: ExtendedWebSocket) => {
  console.error('Error: Invalid message format received.');

  // Send an error message to the client
  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        error:
          'Invalid message format. Please check the message structure and try again.',
      })
    );
  }
};
