import {Request, Response, NextFunction} from 'express';
import {
  fetchOpenLobby,
  createLobby,
  joinLobby,
  createGame,
} from '../models/gameModel';

const handleLobbyRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = res.locals.user.user_id; // Assuming user_id is extracted from JWT or session

  try {
    // Check if there is an open lobby
    const openLobby = await fetchOpenLobby();

    if (openLobby) {
      // Join the open lobby and set status to 'ongoing'
      const success = await joinLobby(openLobby.lobby_id, user_id);
      if (success) {
        // Create a new game
        const newGame = await createGame(
          openLobby.lobby_id,
          openLobby.creator_id,
          user_id
        );
        if (newGame) {
          return res.json({
            message: 'Joined existing lobby and created new game',
            lobby: openLobby,
            game: newGame,
          });
        } else {
          return next(new Error('Failed to create game after joining lobby'));
        }
      } else {
        return next(new Error('Failed to join lobby'));
      }
    } else {
      // Create a new lobby
      const newLobby = await createLobby(user_id);
      if (newLobby) {
        return res.json({message: 'Created new lobby', lobby: newLobby});
      } else {
        return next(new Error('Failed to create lobby'));
      }
    }
  } catch (error) {
    console.error('Error handling lobby request:', error);
    next(error);
  }
};

export {handleLobbyRequest};
