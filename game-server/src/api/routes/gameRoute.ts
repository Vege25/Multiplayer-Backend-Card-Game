import express from 'express';
import {handleLobbyRequest} from '../controllers/gameController';
import {authenticate} from '../../middlewares'; // Assuming you have an auth middleware

const router = express.Router();

// Route to handle lobby requests
router.route('/').post(authenticate, handleLobbyRequest);

router.get('/test', (req, res) => {
  res.send({message: 'Game API - 👋🌎🌍🌏'});
});

export default router;
