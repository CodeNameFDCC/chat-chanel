import { store } from './store.js'; // 전역 상태 저장소에서 store를 import
import { leaveRoom } from './playerUtills.js'; // 플레이어 관련 유틸리티 함수인 leaveRoom을 import

// 소켓 핸들러 설정 함수
function setupSocketHandlers(io) {
    store.io = io; // io 인스턴스를 store에 저장
    io.on('connection', (socket) => { // 클라이언트가 연결되었을 때
        console.log('사용자 접속:', socket.id); // 접속한 사용자의 소켓 ID 출력

        // 닉네임 설정
        socket.on('setNickname', (nickname) => {
            store.users.set(socket.id, nickname); // 사용자의 소켓 ID에 닉네임 저장
        });

        // 방 생성 요청 핸들러
        socket.on('createRoom', (roomName) => {
            if (!store.rooms.has(roomName)) { // 방 이름이 이미 존재하지 않는 경우
                const newRoom = {
                    players: new Set([socket.id]), // 현재 플레이어를 포함하는 Set
                    host: socket.id, // 방장의 소켓 ID
                    playerNames: new Map([[socket.id, store.users.get(socket.id) || socket.id]]) // 플레이어 이름 저장
                };
                store.rooms.set(roomName, newRoom); // 방을 store에 추가
                socket.join(roomName); // 클라이언트를 방에 추가

                // 방 생성 성공 메시지 전송
                socket.emit('roomCreated', { roomName, isHost: true }); // 방장에게 방 생성 알림
                io.emit('roomList', Array.from(store.rooms.keys())); // 모든 클라이언트에게 방 목록 전송
                io.to(roomName).emit('playerList', { // 방에 있는 플레이어 목록 전송
                    players: [...newRoom.playerNames.entries()].map(([id, name]) => ({
                        id,
                        name,
                        isHost: id === newRoom.host // 방장 여부 확인
                    }))
                });
            } else {
                socket.emit('error', '이미 존재하는 방 이름입니다.'); // 방 이름 중복 시 오류 메시지 전송
            }
        });

        // 방 참가 요청 핸들러
        socket.on('joinRoom', (roomName) => {
            const room = store.rooms.get(roomName); // 방 정보 가져오기
            if (room && room.players.size < 4) { // 방이 존재하고 플레이어 수가 4명 미만인 경우
                room.players.add(socket.id); // 플레이어를 방에 추가
                room.playerNames.set(socket.id, store.users.get(socket.id) || socket.id); // 플레이어 이름 저장
                socket.join(roomName); // 클라이언트를 방에 추가

                socket.emit('joinedRoom', { roomName, isHost: false }); // 방 참가 성공 메시지 전송

                // 플레이어 목록 업데이트 및 입장 메시지 전송
                io.to(roomName).emit('playerList', {
                    players: [...room.playerNames.entries()].map(([id, name]) => ({
                        id,
                        name,
                        isHost: id === room.host // 방장 여부 확인
                    }))
                });
                io.to(roomName).emit('systemMessage', `${store.users.get(socket.id) || socket.id}님이 입장하셨습니다.`); // 입장 메시지 전송
            } else {
                socket.emit('error', '방이 가득 찼거나 존재하지 않습니다.'); // 방이 가득 찼거나 존재하지 않을 때 오류 메시지 전송
            }
        });

        // 강퇴 요청 핸들러
        socket.on('kickPlayer', ({ roomName, playerId }) => {
            const room = store.rooms.get(roomName); // 방 정보 가져오기
            if (room && room.host === socket.id) { // 방장 확인
                const targetSocket = io.sockets.sockets.get(playerId); // 강퇴할 플레이어의 소켓 가져오기
                const playerName = store.users.get(playerId) || playerId; // 플레이어 이름 가져오기
                if (targetSocket) {
                    leaveRoom(targetSocket, roomName, io, true); // 플레이어를 방에서 강퇴
                    targetSocket.emit('kicked', roomName); // 강퇴된 플레이어에게 알림
                    io.to(roomName).emit('systemMessage', `${playerName}님이 강퇴되었습니다.`); // 방에 강퇴 메시지 전송
                }
            }
        });

        // 방 목록 요청 핸들러
        socket.on('getRoomList', () => {
            io.emit('roomList', Array.from(store.rooms.keys())); // 모든 클라이언트에게 방 목록 전송
        });

        // 방 나가기 핸들러
        socket.on('leaveRoom', (roomName) => {
            leaveRoom(socket, roomName, io); // 클라이언트를 방에서 나가게 함
        });

        // 연결 끊김 핸들러
        socket.on('disconnect', () => {
            store.rooms.forEach((room, roomName) => {
                if (room.players.has(socket.id)) { // 클라이언트가 방에 있는 경우
                    leaveRoom(socket, roomName, io); // 방에서 나가게 함
                }
            });
            store.users.delete(socket.id); // 사용자 목록에서 클라이언트 제거
        });
    });
}

// 소켓 핸들러 설정 함수 export
export { setupSocketHandlers };
