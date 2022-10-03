const mongoose = require('mongoose')

const sysMenuSchema = new mongoose.Schema({
    parent_id: {
        type: String,
        required: false,
        default: null
    },
    title: {
        type: String,
        unique: true
    },
    url: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    // submenu: {
    //     type: [],
    //     required: false,
    //     default: []
    // },
    alt_title: {
        type: String,
        required: false,
        default: null
    },
    description: {
        type: String,
        required: false,
        default: null
    },
    icon: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        required: false,
        default: 999
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

module.exports = mongoose.model('SysMenu', sysMenuSchema)