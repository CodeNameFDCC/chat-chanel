import { createServer } from 'http';
import app from './app.init.js';

const server = createServer(app);

export default server;