const http = require('http');
const net = require('net');


const express = require('express');
const mongoose = require('mongoose');

const { createUser, changeUsername, getUsers, deleteUser } = require('./userManager');
const User = require('./models/User');

const PORT = 8778;


// Database connection initializaton
mongoose.connect("mongodb://127.0.0.1:27017/node-chat-app", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    mongoose.connection.db.dropDatabase();
});

//Creating socket pool
const socketPool = new Map();
const roomNames = [];

//Creating socket server
const app = express();
const server = http.createServer(app);
const io = (require('socket.io'))(server, {
    path: '/',
    cors: true,
    origins: '127.0.0.1:*'
});
server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});


// Register new client with username = payload
async function register(socket, payload) {
    const name = payload;

    try {
        const user = await createUser(name, socket.request.connection);

        //if it's sucessful let the user know and add him to socket pool
        if (user) {
            const stringID = user._id.toString();
            const userId = parseInt("0x" + stringID.substring(stringID.length - 6, stringID.length));

            users = await getUsers(user._id);
            socket.emit('registered', {
                you: {
                    username: name,
                    id: userId
                },
                users
            });

            // Tell all other clients that he joined the party!
            socket.broadcast.emit('joined', {
                username: name,
                id: userId
            })

            socketPool.set(userId, {
                identifier: socket.id,
                isRoom: false
            });
        }
    } catch (e) {
        console.log(e.message);
        //Username uniqueness error
        socket.emit('notregistered');
    }
}

// Send message to target room/client
function message(socket, payload) {
    const { from, target, content } = payload;
    console.log(payload);
    const targetIO = socketPool.get(target);
    if (targetIO.isRoom) {
        socket.to(targetIO.identifier).emit('message', { from, room: targetIO.identifier, content });
    } else {
        socket.to(targetIO.identifier).emit('message', { from, room: from, content });
    }
}

// File transfer initial request handler
function fileRecieveStart(socket, payload, fileReceive) {
    fileReceive.from = payload.from;
    fileReceive.target = payload.target;
    fileReceive.content = payload.content;
    fileReceive.fileName = payload.fileName;
    fileReceive.fileSize = payload.fileSize;
    fileReceive.fileType = payload.fileType;
    fileReceive.fileChunks = [];

    socket.emit('sendslice');
}

function fileRecieveSlice(socket, payload, fileReceive) {
    fileReceive.fileChunks.push(payload.slice);
    if (!payload.isEnded) {
        return false;
    } else {
        return true;
    }
}

function fileSendStart(socket, fileSend) {
    const { from, target, content, fileName, fileSize, fileType } = fileSend;
    const targetIO = socketPool.get(target);
    if (targetIO.isRoom) {
        socket.to(targetIO.identifier).emit('startfile', { from, room: targetIO.identifier, content, fileName, fileSize, fileType });
    } else {
        socket.to(targetIO.identifier).emit('startfile', { from, room: from, content, fileName, fileSize, fileType });
    }
    let isEnded;
    while (!isEnded) {
        isEnded = ((fileSend.currentSlice + 1) === fileSend.fileChunks.length)
        socket.to(targetIO.identifier).emit('receiveslice', { isEnded, slice: fileSend.fileChunks[fileSend.currentSlice] });
        fileSend.currentSlice++;
    }
    fileSend.currentSlice = 0;
    fileSend.from = undefined
    fileSend.target = undefined
    fileSend.content = undefined
    fileSend.fileName = undefined
    fileSend.fileSize = undefined
    fileSend.fileType = undefined
    fileSend.fileChunks = undefined
}

async function rename(socket, payload) {
    const oldName = payload.old;
    const newName = payload.username;

    if (oldName === newName) {
        socket.emit('renamed', newName);
        return;
    }
    try {
        changeUsername(newName, oldName);
        socket.broadcast.emit('sorenamed', {
            oldName,
            newName
        });
        socket.emit('renamed', newName);
    } catch (e) {
        console.log(e.message);
        socket.emit('notrenamed');
    }

}

function addRoom(socket, payload) {
    const { name, selection } = payload;
    if (roomNames.includes(name.toLowerCase())) {
        socket.emit('notroom');
        return;
    }
    roomNames.push(name);
    socketPool.set(name, {
        identifier: name,
        isRoom: true
    });
    socket.join(name);
    for (sel of selection) {
        const targetIO = socketPool.get(sel.id);
        socket.to(targetIO.identifier).emit('joinroom', {
            name,
            selection
        });
    }
    socket.emit('joinroom', {
        name,
        selection
    });
    socket.emit('doneroom');
}

io.on('connection', (socket) => {
    console.log(socket.id);
    console.log(socket.request.connection.remoteAddress);
    console.log(socket.request.connection.remotePort);
    const fileReceive = {
        from: undefined,
        target: undefined,
        content: undefined,
        fileName: undefined,
        fileSize: undefined,
        fileType: undefined,
        fileChunks: undefined
    }
    const fileSend = {
        from: undefined,
        target: undefined,
        content: undefined,
        fileName: undefined,
        fileSize: undefined,
        fileType: undefined,
        currentSlice: 0,
        fileChunks: undefined
    }

    socket.on('register', async (payload) => {
        await register(socket, payload);
    });
    socket.on('message', (payload) => {
        message(socket, payload);
    });
    socket.on('filereceivestart', (payload) => {
        fileRecieveStart(socket, payload, fileReceive);
    });
    socket.on('receiveslice', (payload) => {
        if (fileRecieveSlice(socket, payload, fileReceive)) {
            fileSend.from = fileReceive.from
            fileSend.target = fileReceive.target
            fileSend.content = fileReceive.content
            fileSend.fileName = fileReceive.fileName
            fileSend.fileSize = fileReceive.fileSize
            fileSend.fileType = fileReceive.fileType
            fileSend.fileChunks = fileReceive.fileChunks
            fileSend.currentSlice = 0;
            fileReceive.from = undefined
            fileReceive.target = undefined
            fileReceive.content = undefined
            fileReceive.fileName = undefined
            fileReceive.fileSize = undefined
            fileReceive.fileType = undefined
            fileReceive.fileChunks = undefined
            fileSendStart(socket, fileSend);
        }
    });
    socket.on('rename', async (payload) => {
        await rename(socket, payload);
    });
    socket.on('addroom', (payload) => {
        addRoom(socket, payload);
    });
    socket.on('joinroom', (payload) => {
        socket.join(payload);
    })


    socket.on('disconnect', async () => {
        const user = await deleteUser(socket.request.connection.remoteAddress, socket.request.connection.remotePort);
        const stringID = user._id.toString();
        const userId = parseInt("0x" + stringID.substring(stringID.length - 6, stringID.length));
        socketPool.delete(userId);
        socket.broadcast.emit('uleave', {
            id: userId,
            username: user.username
        });
    });
});
