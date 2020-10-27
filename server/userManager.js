const User = require('./models/User');

//Generic response class
class Response {
    constructor(from, to, type, body) {
        this.from = from;
        this.to = to;
        this.type = type;
        this.body = body;
    }
}


//Create user function
async function createUser(username, socket) {
    //Checks Uniqueness of username
    if ((await User.find({ username: username.toLowerCase() })).length != 0 || username.toUpperCase() == "SERVER") {
        throw new Error("Uniqueness error");
    } else {
        const user = new User({
            username: username.toLowerCase(),
            userIP: socket.remoteAddress,
            userPort: socket.remotePort
        });
        await user.save();
        return user;
    }
}

//Change username function
async function changeUsername(newName, socket, from) {
    //Checks Uniqueness of username
    if ((await User.find({ username: newName.toLowerCase() })).length != 0 || newName.toUpperCase() == "SERVER") {
        throw new Error("Uniqueness error");
    } else {
        try {
            //Finding current user by socket ip and port
            const user = await User.findOne({ userIP: socket.remoteAddress, userPort: socket.remotePort });
            const oldName = user.username;
            user.username = newName.toLowerCase();
            await user.save();
            return { user, oldName };
        } catch {
            socket.write(JSON.stringify(new Response("SERVER", from, "500", undefined)))
            return undefined;
        }
    }
}

//Send message function
async function sendMessage(message, socket, socket_pool) {
    //Finding target by user name
    const target = await User.findOne({ username: message.to });
    //If target name is no where to be found let the use know
    if(!target) {
        socket.write(JSON.stringify(new Response('SERVER', message.from, "404", "Target not found")));
        return undefined;
    }
    //Get target socket from pool and send message
    targetSocket = socket_pool.get(target.username);
    targetSocket.write(JSON.stringify(new Response(message.from, message.to, "MESSAGE", message.body)));
    return true;
}

module.exports = {
    Response,
    createUser,
    changeUsername,
    sendMessage
};