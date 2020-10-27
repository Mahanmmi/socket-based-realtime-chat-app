const mongoose = require("mongoose");

const schema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    userIP: {
        type: String,
        required: true,
        trim: true
    },
    userPort: {
        type: Number,
        required: true,
        trim: true
    }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

const User = new mongoose.model("User", schema);

module.exports = User;