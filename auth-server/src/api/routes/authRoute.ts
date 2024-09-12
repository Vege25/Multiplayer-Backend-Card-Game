import express from 'express';
import {login} from '../controllers/authController';
const router = express.Router();
import {body} from 'express-validator';

router.post(
  '/login',
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),
  login
);

export default router;
