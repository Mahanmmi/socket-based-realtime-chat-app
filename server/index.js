const net = require('net');

const mongoose = require('mongoose');

const { Response, createUser, changeUsername, sendMessage } = require('./userManager');
const User = require('./models/User');


// Database connection initializaton
mongoose.connect("mongodb://127.0.0.1:27017/node-chat-app", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

//Creating socket pool
socket_pool = new Map();

//Creating server
const server = net.createServer(socket => {
    socket.on("data", async data => {

        //Parse incoming data into message object
        const message = JSON.parse(data.toString());

        //Check if its a registration message (new user) or not
        if ((await User.find({ userIP: socket.remoteAddress, userPort: socket.remotePort })).length != 0) {

            //Change username request
            if (message.type == "CHANGE") {
                try {
                    const { user, oldName } = await changeUsername(message.body, socket, message.from);

                    //if it's sucessful let the user know and change in socket pool
                    if (user) {
                        socket.write(JSON.stringify(new Response('SERVER', user.username, "210", `You are now ${user.username}`)));
                        socket_pool.delete(oldName);
                        socket_pool.set(user.username, socket);
                        //TO DO Notify all other users
                    }
                } catch (e) {
                    console.log(e.message);

                    //New username uniqueness error
                    socket.write(JSON.stringify(new Response("SERVER", message.from, "440", e.message)));
                }
            }

            //Send message request
            if (message.type == "SEND") {
                if (sendMessage(message, socket, socket_pool)) {
                    socket.write(JSON.stringify(new Response("SERVER", message.from, "211", "SENT")));
                };
            }


        } else {
            //Register request
            try {
                const user = await createUser(message.from, socket);

                //if it's sucessful let the user know and add him to socket pool
                if (user) {
                    socket.write(JSON.stringify(new Response('SERVER', user.username, "201", `Welcome ${user.username}`)));
                    socket_pool.set(user.username, socket);
                    //TO DO Notify all other users
                }
            } catch (e) {
                console.log(e.message);

                //Username uniqueness error
                socket.write(JSON.stringify(new Response("SERVER", "NOT REGISTERED", "440", e.message)));

                //We end the connection cause we don't want any blank usernames with connections in database
                socket.end();
            }
        }
    });

    //on end connection remove user from socket_pool and DB
    socket.on("end", async () => {
        let user;
        for (const [key, value] of socket_pool.entries()) {
            if (socket.remoteAddress == value.remoteAddress && socket.remotePort == value.remotePort) {
                user = key;
                break;
            }
        }
        await User.findOneAndRemove({ username: user });
        socket_pool.delete(user);
        //TO DO Notify all other users
    })
});

server.listen(8778);