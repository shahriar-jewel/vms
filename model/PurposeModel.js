const mongoose = require('mongoose');
const autoIncrement = require("mongoose-auto-increment");
mongoose.Promise = require('bluebird');

const PurposeSchema = new mongoose.Schema({
    purpose: {
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

module.exports = mongoose.model('Purpose', PurposeSchema);