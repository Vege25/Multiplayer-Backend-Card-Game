require('dotenv').config();
import express, {Request, Response} from 'express';
import morgan from 'morgan';
import cors from 'cors';

import {notFound, errorHandler} from './middlewares';
import api from './api';

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);

export default app;
