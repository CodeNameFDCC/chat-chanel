import { store } from './store.js';
import { changeHost } from './roomUtills.js';

function leaveRoom(socket, roomName, io, isKicked = false) {
    const room = store.rooms.get(roomName);
    if (room) {
        const wasHost = room.host === socket.id;
        const playerName = store.users.get(socket.id) || socket.id;

        room.players.delete(socket.id);
        room.playerNames.delete(socket.id);
        socket.leave(roomName);

        if (room.players.size === 0) {
            store.rooms.delete(roomName);
            io.emit('roomList', Array.from(store.rooms.keys()));  // 방 목록 갱신
        } else {
            if (wasHost) {
                const newHost = changeHost(roomName);
                io.to(roomName).emit('hostChanged', newHost);
                io.to(roomName).emit('systemMessage',
                    `${store.users.get(newHost) || newHost}님이 새로운 방장이 되었습니다.`);
            }

            io.to(roomName).emit('playerList', {
                players: [...room.playerNames.entries()].map(([id, name]) => ({
                    id,
                    name,
                    isHost: id === room.host
                }))
            });

            if (!isKicked) {
                io.to(roomName).emit('systemMessage', `${playerName}님이 퇴장하셨습니다.`);
            }
        }
    }
}

export { leaveRoom };