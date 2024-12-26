import { Server } from 'socket.io';
import http from 'http';

const io = (server) => new Server(server);

export default io;