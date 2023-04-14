const mongoose = require('mongoose');

//Schema describes how the data looks

const userSchema = mongoose.Schema({
    // id: {
    //     type: String,
    //     required: true
    // },
    username: {
        type: String,
        required: true
    },
    player: {
        type: Number,
        required: true
    },
    room: {
        type: Number,
        required: true
    },
    board: {
        type: Array,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);