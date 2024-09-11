import {Game, Lobby} from '@sharedTypes/DBTypes';
import pool from '../../lib/db';
import {PoolClient} from 'pg';

// Fetch the first available lobby with 'waiting' status
const fetchOpenLobby = async (): Promise<any | null> => {
  try {
    const result = await pool.query(
      `SELECT * FROM lobbies WHERE status = 'waiting' LIMIT 1`
    );
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching open lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

const fetchLobbyById = async (lobby_id: number): Promise<any | null> => {
  try {
    const result = await pool.query(
      `SELECT * FROM lobbies WHERE lobby_id = $1`,
      [lobby_id]
    );
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

const fetchIfOnlyUserInLobby = async (
  lobby_id: number,
  user_id: number
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `SELECT * FROM lobbies WHERE lobby_id = $1 AND creator_id = $2 AND opponent_id IS NULL`,
      [lobby_id, user_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error fetching lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// Create a new lobby
const createLobby = async (creator_id: number): Promise<any | null> => {
  try {
    const result = await pool.query(
      `INSERT INTO lobbies (creator_id, status) VALUES ($1, 'waiting') RETURNING lobby_id`,
      [creator_id]
    );
    const lobbyId = result.rows[0].lobby_id;

    const lobby = await pool.query(
      `SELECT * FROM lobbies WHERE lobby_id = $1`,
      [lobbyId]
    );
    return lobby.rows.length ? lobby.rows[0] : null;
  } catch (error) {
    console.error('Error creating lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// Fetch the waiting lobby
const fetchWaitingLobby = async (): Promise<any | null> => {
  try {
    const result = await pool.query(
      `SELECT * FROM lobbies WHERE status = 'waiting' ORDER BY created_at ASC LIMIT 1`
    );
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching waiting lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// Update lobby status and opponent_id
const updateLobbyStatus = async (
  lobby_id: number,
  status: 'waiting' | 'ongoing' | 'finished',
  opponent_id: number
): Promise<boolean> => {
  try {
    const client = await pool.connect(); // Use the pool to get a client

    const result = await client.query(
      `UPDATE lobbies SET status = $1, opponent_id = $2 WHERE lobby_id = $3`,
      [status, opponent_id, lobby_id]
    );

    client.release(); // Release the client after use

    // Safe rowCount check
    return result?.rowCount! > 0;
  } catch (error) {
    console.error('Error updating lobby status:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// Join an existing lobby and set opponent
const joinLobby = async (
  lobby_id: number,
  opponent_id: number
): Promise<boolean> => {
  try {
    const client = await pool.connect();

    const result = await client.query(
      `UPDATE lobbies SET opponent_id = $1, status = 'ongoing' WHERE lobby_id = $2`,
      [opponent_id, lobby_id]
    );

    client.release();

    // Check rowCount safely
    return result?.rowCount! > 0;
  } catch (error) {
    console.error('Error joining lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// Create a new game
const createGame = async (
  lobby_id: number,
  player1_id: number,
  player2_id: number
): Promise<any | null> => {
  try {
    const coinFlip = Math.random();
    const randomizeTurn = coinFlip >= 0.5 ? player1_id : player2_id;

    const result = await pool.query(
      `INSERT INTO games (lobby_id, player1_id, player2_id, game_status, current_turn, player1_mana, player2_mana)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING game_id`,
      [lobby_id, player1_id, player2_id, 'ongoing', randomizeTurn, 10, 10]
    );
    const gameId = result.rows[0].game_id;

    const game = await pool.query(`SELECT * FROM games WHERE game_id = $1`, [
      gameId,
    ]);
    return game.rows.length ? game.rows[0] : null;
  } catch (error) {
    console.error('Error creating game:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

const getLobbyData = async (lobby_id: number): Promise<Lobby | null> => {
  try {
    const result = await pool.query(
      `SELECT * FROM lobbies WHERE lobby_id = $1`,
      [lobby_id]
    );
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

const getGameData = async (game_id: number): Promise<Game | null> => {
  try {
    const result = await pool.query(`SELECT * FROM games WHERE game_id = $1`, [
      game_id,
    ]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching game:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// Leave the lobby if only one player is present
const leaveLobby = async (lobby_id: number): Promise<boolean> => {
  try {
    const client = await pool.connect();

    const result = await client.query(
      `DELETE FROM lobbies WHERE lobby_id = $1`,
      [lobby_id]
    );

    client.release();

    return result?.rowCount! > 0;
  } catch (error) {
    console.error('Error leaving lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  }
};

// If leave as second player, start transaction, check if user is player1 or 2, update game's player1_connected or player2_connected, if both are false, delete game and delete lobby and delete Disconnects where game_id = game_id. If changing only 1 disconnect, create a new Disconnect row
const leaveLobbyAndHandleGame = async (
  lobby_id: number,
  user_id: number
): Promise<boolean> => {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Fetch the game and player information associated with this lobby
    const gameResult = await client.query(
      `
      SELECT game_id, player1_id, player2_id, player1_connected, player2_connected
      FROM games
      WHERE lobby_id = $1
      `,
      [lobby_id]
    );

    if (gameResult.rowCount === 0) {
      throw new Error('Game not found for the lobby.');
    }

    const game = gameResult.rows[0];
    const {
      game_id,
      player1_id,
      player2_id,
      player1_connected,
      player2_connected,
    } = game;

    // Determine if the user is player1 or player2
    let playerColumnToUpdate = '';
    if (user_id === player1_id) {
      playerColumnToUpdate = 'player1_connected';
    } else if (user_id === player2_id) {
      playerColumnToUpdate = 'player2_connected';
    } else {
      throw new Error('User is not a player in this game.');
    }

    // Update the connection status for the player
    await client.query(
      `UPDATE games SET ${playerColumnToUpdate} = false WHERE game_id = $1`,
      [game_id]
    );

    // Check if both players are now disconnected
    const bothPlayersDisconnected =
      (playerColumnToUpdate === 'player1_connected' && !player2_connected) ||
      (playerColumnToUpdate === 'player2_connected' && !player1_connected);

    if (bothPlayersDisconnected) {
      // Both players are disconnected, clean up the game, lobby, and disconnects

      // Delete the game
      await client.query(`DELETE FROM games WHERE game_id = $1`, [game_id]);

      // Delete the lobby
      await client.query(`DELETE FROM lobbies WHERE lobby_id = $1`, [lobby_id]);

      // Delete associated disconnects
      await client.query(`DELETE FROM disconnects WHERE game_id = $1`, [
        game_id,
      ]);
    } else {
      // Only one player disconnected, create a disconnect record
      await client.query(
        `
        INSERT INTO disconnects (game_id, user_id, disconnect_time)
        VALUES ($1, $2, NOW())
        `,
        [game_id, user_id]
      );
    }

    // Commit the transaction
    await client.query('COMMIT');

    return true;
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Error handling game and lobby:', (error as Error).message);
    throw new Error((error as Error).message);
  } finally {
    client.release();
  }
};

const changeTurn = async (game_id: number, next_turn: number): Promise<any> => {
  let client: PoolClient | null = null; // Initialize as null to ensure proper type checking

  try {
    client = await pool.connect();

    // Perform the update query
    const result = await client.query(
      `UPDATE games SET current_turn = $1 WHERE game_id = $2`,
      [next_turn, game_id]
    );

    if (result?.rowCount! > 0) {
      // Fetch the updated game data
      const gameData = await getGameData(game_id);

      // Release the client connection
      client.release();

      // Return the updated game data
      return gameData;
    } else {
      // Release the client connection if no rows were affected
      client.release();

      // Optionally, handle the case where no rows were updated
      throw new Error('No rows were updated.');
    }
  } catch (error) {
    console.error('Error changing turn:', (error as Error).message);

    // Ensure the client is released in case of an error
    if (client) {
      client.release();
    }

    throw new Error((error as Error).message);
  }
};

export {
  fetchOpenLobby,
  createLobby,
  joinLobby,
  fetchWaitingLobby,
  updateLobbyStatus,
  createGame,
  leaveLobby,
  leaveLobbyAndHandleGame,
  fetchLobbyById,
  fetchIfOnlyUserInLobby,
  getLobbyData,
  getGameData,
  changeTurn,
};
