const mongoose = require('mongoose')

const SysGroupPermissionSchema = new mongoose.Schema({
    sys_group_id: {
        type: String,
        required: true
    },
    p_id: { // permission id
        type: String,
        required: true
    },
    route: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
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

module.exports = mongoose.model('SysGroupPermission', SysGroupPermissionSchema)