import express, {Request, Response} from 'express';

import gameRoute from './routes/gameRoute';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Game API - 👋🌎🌍🌏',
  });
});

router.use('/game', gameRoute);

export default router;
