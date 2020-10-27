const User = require('./models/User');

async function createUser(username, socket){
    if(User.find({ username : username })) {
        throw new Error("Uniqueness error");
    } else {
        const user = new User({
           username : username,
           userSocket : socket 
        });
        user.save();
        return user;
    }
}

module.exports = {
    createUser
};