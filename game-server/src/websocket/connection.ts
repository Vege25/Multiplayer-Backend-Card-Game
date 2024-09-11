import {IncomingMessage} from 'http';
import {ExtendedWebSocket} from './types';
import {handleMessages} from './messages';
import {
  createLobby,
  fetchWaitingLobby,
  updateLobbyStatus,
  createGame,
  leaveLobby,
  fetchIfOnlyUserInLobby,
  leaveLobbyAndHandleGame,
  getLobbyData,
  getGameData, // Import the createGame function
} from '../api/models/gameModel';
import {handleWebSocketError, handleLobbyAssignmentError} from './errors';

const lobbies: {[key: string]: ExtendedWebSocket[]} = {};

export const handleConnection = async (
  ws: ExtendedWebSocket,
  req: IncomingMessage
) => {
  console.log('Client connected');

  if (!req.url) {
    console.log('No URL provided');
    ws.close(1008, 'No URL provided');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  ws.userId = url.searchParams.get('userId') || undefined;

  if (!ws.userId) {
    console.log('User ID is required');
    ws.close(1008, 'User ID is required');
    return;
  }

  try {
    let lobby = await fetchWaitingLobby();

    if (!lobby) {
      const creatorId = Number(ws.userId);
      lobby = await createLobby(creatorId);
      console.log(`Created new lobby with ID: ${lobby?.lobby_id}`);

      ws.send(
        JSON.stringify({
          status: 'created',
          lobbyId: lobby?.lobby_id,
        })
      );
      console.log('sent response to client');
    } else {
      const opponentId = Number(ws.userId);
      await updateLobbyStatus(lobby.lobby_id, 'ongoing', opponentId);
      console.log(`Joined existing lobby with ID: ${lobby.lobby_id}`);

      // Create the game after updating the lobby status
      const newGame = await createGame(
        lobby.lobby_id,
        lobby.creator_id,
        opponentId
      );

      if (newGame) {
        const lobbyData = await getLobbyData(lobby.id);
        const gameData = await getGameData(newGame.game_id);
        ws.send(
          JSON.stringify({
            status: 'joined',
            lobbyData,
            gameData,
          })
        );
        console.log(`Created new game with ID: ${newGame.game_id}`);
      } else {
        throw new Error('Failed to create game');
      }
    }

    ws.lobbyId = String(lobby?.lobby_id);
    if (!lobbies[ws.lobbyId]) {
      lobbies[ws.lobbyId] = [];
    }
    lobbies[ws.lobbyId].push(ws);
    console.log(`Client joined lobby: ${ws.lobbyId}`);
  } catch (error) {
    handleLobbyAssignmentError(ws, error);
  }

  ws.on('message', (message: string | Buffer) =>
    handleMessages(ws, message, lobbies)
  );

  ws.on('close', async (code, reason) => {
    console.log(
      `Client disconnected from lobby: ${ws.lobbyId}, Code: ${code}, Reason: ${reason}`
    );

    // Remove the client from the lobby
    if (ws.lobbyId && lobbies[ws.lobbyId]) {
      // check if user is the only player in the lobby, if true returned, delete the lobby
      // const lobbyWithOnlyMeJoinedExists = await fetchIfOnlyUserInLobby(
      //   Number(ws.lobbyId),
      //   Number(ws.userId)
      // );
      // if (lobbyWithOnlyMeJoinedExists) {
      //   const success = await leaveLobby(Number(ws.lobbyId));
      //   if (!success) {
      //     throw new Error('Failed to leave lobby');
      //   }
      // } else {
      //   const success = await leaveLobbyAndHandleGame(
      //     Number(ws.lobbyId),
      //     Number(ws.userId)
      //   );
      //   if (!success) {
      //     throw new Error('Failed to leave lobby and handle game');
      //   }
      // }
      lobbies[ws.lobbyId] = lobbies[ws.lobbyId].filter(
        (client) => client !== ws
      );
    }
  });

  ws.on('error', (error: unknown) => {
    handleWebSocketError(ws, error);
  });
};
