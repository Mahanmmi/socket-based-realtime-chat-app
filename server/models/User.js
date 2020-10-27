const mongoose = require("mongoose");

const schema = mongoose.Schema({
    username : {
        type : String,
        required: true,
        trim: true,
        unique: true
    },
    userSocket : {
        type : Object,
        required : true
    }
});

schema.virtual('userIP').get(function() {
    return this.userSocket.remoteAddress;
});
schema.virtual('userPort').get(function() {
    return this.userSocket.remotePort;
});

const User = new mongoose.model("User", schema);

module.exports = User;