const mongoose = require('mongoose');
// mongoose.Promise = Promise;
mongoose.Promise = require('bluebird');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    sys_group: {
        id : { type: String, required: true },
        name : { type: String, required: true },
    },
    status: { type: Number, default: 1 } // 1 means active , 0 means inactive
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);