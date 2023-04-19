const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ClubSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    status: {
        type: Number,
        default: 1
    },
    created_by: {
        type: {},
        default: {}
    },
}, {
    timestamps: true
})

module.exports = mongoose.model('club', ClubSchema);