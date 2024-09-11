import app from './app';
import {createServer} from 'http';

const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 8080;
const server = createServer(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
