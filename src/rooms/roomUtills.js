// 해당 코드는 호스트의 변경을 검사하는 코드다.
import { store } from './store.js';
function changeHost(roomName) {
    const room = store.rooms.get(roomName);
    if (room && room.players.size > 0) {
        room.host = Array.from(room.players)[0];
        return room.host;
    }
    return null;
}

export { changeHost };