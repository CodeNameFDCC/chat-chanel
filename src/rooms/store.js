// 전역 상태 저장소 객체 정의
export const store = {
    rooms: new Map(), // 방 정보를 저장하는 Map 객체
    users: new Map(), // 사용자 정보를 저장하는 Map 객체
    io: null // Socket.IO 인스턴스를 저장할 변수 (초기값은 null)
};

// Socket.IO 인스턴스를 설정하는 함수
export const setIO = (ioInstance) => {
    store.io = ioInstance; // 전달받은 ioInstance를 store의 io 속성에 저장
};