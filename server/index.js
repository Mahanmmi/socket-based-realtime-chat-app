const net = require('net');

const mongoose = require('mongoose');

const { createUser } = require('./userManager');
const User = require('./models/User');


// Database connection initializaton
mongoose.connect("mongodb://127.0.0.1:27017/node-chat-app", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});


//Creating server
const server = net.createServer(socket => {
    console.log(socket.remoteAddress);
    console.log(socket.remotePort);
    socket.on("data", async data => {
        const message = JSON.parse(data.toString());
        if(await User.find({ socket : socket })) {
            // handle message
        } else {
            try {
                console.log(createUser(message.from, socket));
            } catch (e) {
                console.log(e.message);
                socket.write(e.message);
                socket.end();
            }
        }
    });
});

server.listen(8778);