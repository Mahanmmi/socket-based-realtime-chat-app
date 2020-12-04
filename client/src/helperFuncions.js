const mime = require('mime-types');

let client;
let pageThis;

const sliceSize = 10000;

let fileReceiveMessage = undefined;

function getUserInRoom(room, userId) {
    for (const user of room.users) {
        if (user._id === userId) {
            return user;
        }
    }
}

function registered(payload) {
    pageThis.user = payload.you;
    pageThis.currentUserId = payload.you.id;
    pageThis.regErr = false;
    pageThis.users = payload.users;
    for (const user of payload.users) {
        const room = {
            roomId: user.id,
            roomName: user.username,
            unreadCount: 0,
            lastMessage: {
                content: '',
            },
            users: [
                {
                    _id: user.id,
                    username: user.username
                },
                {
                    _id: pageThis.user.id,
                    username: pageThis.user.username
                }
            ],
            typingUsers: [],
            messages: []
        }
        pageThis.rooms.push(room);
    }
    pageThis.isLoading = false;
}

function notRegistered() {
    pageThis.isLoading = false;
    pageThis.regErr = true;
    pageThis.user = undefined;
}

function joined(payload) {
    const user = payload;
    pageThis.users.push(user);
    const room = {
        roomId: user.id,
        roomName: user.username,
        unreadCount: 0,
        lastMessage: {
            content: '',
        },
        users: [
            {
                _id: user.id,
                username: user.username
            },
            {
                _id: pageThis.user.id,
                username: pageThis.user.username
            }
        ],
        typingUsers: [],
        messages: []
    }
    pageThis.rooms.push(room);
    pageThis.$notify({
        group: 'notif',
        type: 'success',
        text: `${user.username} just joined the party!`
    })
}

function message(payload) {
    const {from, room, content} = payload;
    const roomm = pageThis.findRoom(room);
    const sender = getUserInRoom(roomm, from);
    const date = new Date();
    const message = {
        _id: roomm.roomId.toString() + roomm.messages.length.toString(),
        content,
        sender_id: sender._id,
        username: sender.username,
        date: `${date.toDateString()}`,
        timestamp: `${date.getHours()}:${date.getMinutes()}`,
        saved: true,
        distributed: true,
        seen: true,
        disable_actions: true,
        disable_reactions: true
    }
    roomm.lastMessage = message;
    roomm.messages.push(message);
    if (pageThis.roomId !== roomm.roomId) {
        roomm.unreadCount++;
    }
}

function startFile(payload) {
    fileReceiveMessage = {
        from: payload.from,
        room: payload.room,
        content: payload.content,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        fileType: payload.fileType,
        fileChunks: []
    }
}

function receiveSlice(payload) {
    fileReceiveMessage.fileChunks.push(payload.slice);
    if (payload.isEnded) {
        const blobFile = new Blob(fileReceiveMessage.fileChunks, {
            type: mime.lookup(fileReceiveMessage.fileType)
        })
        const blobUrl = URL.createObjectURL(blobFile);
        const file = {
            blob: blobFile,
            localURL: blobUrl,
            name: fileReceiveMessage.fileName,
            size: fileReceiveMessage.fileSize,
            type: fileReceiveMessage.fileType
        }

        const room = pageThis.findRoom(fileReceiveMessage.room);
        const sender = getUserInRoom(room, fileReceiveMessage.from);
        const date = new Date();
        const message = {
            _id: room.roomId.toString() + room.messages.length.toString(),
            content: fileReceiveMessage.content,
            sender_id: sender._id,
            username: sender.username,
            date: `${date.toDateString()}`,
            timestamp: `${date.getHours()}:${date.getMinutes()}`,
            saved: true,
            distributed: true,
            seen: true,
            disable_actions: true,
            disable_reactions: true,
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.localURL
            }
        }
        room.lastMessage = message;
        room.messages.push(message);
        if (pageThis.roomId !== room.roomId) {
            room.unreadCount++;
        }
    }
}

function renamed(name) {
    const oldName = pageThis.user.username;
    pageThis.user.username = name;
    for (const room of pageThis.rooms) {
        for (const user of room.users) {
            if (user.username === oldName) {
                user.username = name;
            }
        }
        for (const message of room.messages) {
            if (message.username === oldName) {
                message.username = name;
            }
        }
    }

    pageThis.isLoading = false;
    pageThis.regErr = false;
    pageThis.renameMode = false;
    pageThis.$notify({
        group: 'notif',
        type: 'warn',
        text: `Username changed`
    })
}

function notRenamed() {
    pageThis.isLoading = false;
    pageThis.regErr = true;
}

function someoneRenamed(payload) {
    const { oldName, newName } = payload;
    for(const user of pageThis.users){
        if (user.username === oldName) {
            user.username = newName;
        }
    }
    for (const room of pageThis.rooms) {
        for (const user of room.users) {
            if (user.username === oldName) {
                user.username = newName;
                if(room.roomName === oldName && room.users.length === 2) {
                    room.roomName = newName;
                }
            }
        }
        for (const message of room.messages) {
            if (message.username === oldName) {
                message.username = newName;
            }
        }
    }

    pageThis.$notify({
        group: 'notif',
        type: 'warn',
        text: `${oldName} username changed to ${newName}`
    });
}

function joinRoom(payload) {
    const {name, selection} = payload;
    console.log(payload);
    client.emit('joinroom', name);

    const room = {
        roomId: name,
        roomName: name,
        unreadCount: 0,
        users: [],
        typingUsers: [],
        messages: []
    }
    for (const sel of selection) {
        room.users.push({
            _id: sel.id,
            username: sel.username
        });
    }
    console.log(room.users);
    pageThis.rooms.push(room);
}

function userLeft(payload) {
    const { username, id } = payload;
    let ind;
    for (const i in pageThis.users) {
        if(username === pageThis.users[i].username){
            ind = i;
            break;
        }
    }
    pageThis.users.splice(ind,1);
    for (const i in pageThis.rooms) {
        if(id === ((pageThis.rooms)[i]).roomId) {
            ind = i;
            break;
        }
    }
    pageThis.rooms.splice(ind, 1);
    pageThis.$notify({
        group: 'notif',
        type: 'error',
        text: `${username} left the party :(`
    });
}

function notRoom() {
    pageThis.$notify({
        group: 'notif',
        type: 'error',
        text: `Group name already taken`
    });
    pageThis.isLoading = false;
    pageThis.addRoomMode = false;
}

function doneRoom() {
    pageThis.isLoading = false;
    pageThis.addRoomMode = false;
}

function configClient(socket, page) {
    client = socket;
    pageThis = page;
    client.on('registered', (payload) => {
        registered(payload);
    });
    client.on('notregistered', () => {
        notRegistered();
    });
    client.on('joined', (payload) => {
        joined(payload);
    });
    client.on('message', (payload) => {
        message(payload);
    });
    client.on('startfile', (payload) => {
        startFile(payload);
    });
    client.on('receiveslice', (payload) => {
        receiveSlice(payload);
    });
    client.on('renamed', (payload) => {
        renamed(payload);
    });
    client.on('notrenamed', () => {
        notRenamed();
    });
    client.on('sorenamed', (payload) => {
        someoneRenamed(payload);
    });
    client.on('joinroom', (payload) => {
        joinRoom(payload);
    });
    client.on('uleave', (payload) => {
        userLeft(payload);
    })
    client.on('notroom', () => {
        notRoom();
    });
    client.on('doneroom', () => {
        doneRoom();
    });
}

function sendFileInit(room, content, file) {
    let currentSlice = 0;
    client.emit('filereceivestart', {
        from: pageThis.currentUserId,
        target: room.roomId,
        content,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });

    let isEnded = false;
    while (!isEnded) {
        const place = sliceSize * currentSlice;
        isEnded = Math.min(sliceSize, file.size - place) === file.size - place;
        const slice = file.blob.slice(place, place + Math.min(sliceSize, file.size - place));
        client.emit('receiveslice', {isEnded, slice});
        currentSlice++;
    }

    const fileBlob = new Blob([file.blob], {
        type: mime.lookup(file.type)
    });
    const fileURL = URL.createObjectURL(fileBlob);

    const date = new Date();
    const message = {
        _id: room.roomId.toString() + room.messages.length.toString(),
        content: content,
        sender_id: pageThis.currentUserId,
        username: pageThis.user.username,
        date: `${date.toDateString()}`,
        timestamp: `${date.getHours()}:${date.getMinutes()}`,
        saved: true,
        distributed: true,
        seen: true,
        disable_actions: true,
        disable_reactions: true,
        file: {
            name: file.name,
            size: file.size,
            type: file.type,
            url: fileURL
        }
    }

    room.lastMessage = message;
    room.messages.push(message);
    if (pageThis.roomId !== room.roomId) {
        room.unreadCount++;
    }

    pageThis.isLoading = false;
}

export {
    configClient,
    sendFileInit
}