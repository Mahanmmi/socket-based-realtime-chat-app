const User = require('./models/User');


async function getUsers(excludeId) {
    const users = [];
    const raw_users = await User.find({ _id: { $ne: excludeId } });
    for (const i in raw_users) {
        const rawu = raw_users[i];
        const user = {};
        const stringID = rawu._id.toString();
        user.id = parseInt("0x" + stringID.substring(stringID.length - 6, stringID.length));
        user.username = rawu.username;
        users.push(user);
    }
    return users;
}

//Create user function
async function createUser(username, socket) {
    //Checks Uniqueness of username
    if ((await User.find({ username: username.toLowerCase() })).length != 0) {
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
async function changeUsername(newName, oldName) {
    //Checks Uniqueness of username
    if ((await User.find({ username: newName.toLowerCase() })).length !== 0) {
        throw new Error("Uniqueness error");
    } else {
        //Finding current user by oldName
        const user = await User.findOne({ username: oldName.toLowerCase() });
        user.username = newName.toLowerCase();
        await user.save();
        return user;
    }
}

module.exports = {
    createUser,
    changeUsername,
    getUsers
};