import server from './src/init/server.init.js';
import io from './src/init/io.init.js';
import { setupSocketHandlers } from './src/rooms/rooms.js';
import { store, setIO } from './src/rooms/store.js';

const ioServer = io(server);
setIO(ioServer);
setupSocketHandlers(ioServer);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});