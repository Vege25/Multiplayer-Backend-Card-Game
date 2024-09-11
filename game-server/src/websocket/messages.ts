import WebSocket from 'ws'; // Import WebSocket from the 'ws' package
import {ExtendedWebSocket} from './types';
import {fetchData} from '../lib/functions';
import {handleInvalidMessageFormatError, handleWebSocketError} from './errors';
import {getGameData, changeTurn} from '../api/models/gameModel'; // Assuming you have this function to handle turn changes

export const handleMessages = async (
  ws: ExtendedWebSocket,
  message: string | Buffer,
  lobbies: {[key: string]: ExtendedWebSocket[]}
) => {
  console.log('Received message: ', message);

  // Ensure WebSocket has a valid lobbyId
  if (!ws.lobbyId) {
    handleWebSocketError(ws, new Error('No lobbyId found'));
    return;
  }

  let data: any;
  try {
    // Parse incoming message (Buffer or string)
    data = Buffer.isBuffer(message) ? message.toString() : message;
    if (typeof data === 'string') data = JSON.parse(data);

    // Handle the game_data_set message
    if (data.type === 'game_data_set') {
      console.log(
        `User ${data.user_id} has set their gameData for game ${data.game_id}`
      );

      const lobbyId = ws.lobbyId;
      if (lobbies[lobbyId]) {
        lobbies[lobbyId].forEach(async (client) => {
          // Notify other players to set their game data, skip the sender
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            try {
              const gameData = await getGameData(data.game_id);
              client.send(
                JSON.stringify({
                  status: 'ready_to_set_game_data',
                  gameData,
                })
              );
            } catch (error) {
              console.error(
                `Error fetching gameData for game ${data.game_id}:`,
                error
              );
              handleWebSocketError(client, error);
            }
          }
        });
      }
    }

    // Handle the change_turn message
    if (data.type === 'change_turn') {
      console.log(
        `User ${data.user_id} is changing turn for game ${data.game_id}`
      );

      const lobbyId = ws.lobbyId;
      if (lobbies[lobbyId]) {
        lobbies[lobbyId].forEach(async (client: ExtendedWebSocket) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            try {
              const gameData = await changeTurn(
                data.game_id,
                data.current_turn
              );
              client.send(
                JSON.stringify({
                  status: 'turn_changed',
                  gameData,
                })
              );
            } catch (error) {
              console.error(
                `Error changing turn for game ${data.game_id}:`,
                error
              );
              handleWebSocketError(client, error);
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
    handleInvalidMessageFormatError(ws);
  }
};
