const mongoose = require('mongoose');
const autoIncrement = require("mongoose-auto-increment");

const sysUserGroupSchema = new mongoose.Schema({
    sys_group_id: {
        type: Number
    },
    parent_id: {
        type: String,
        required: false,
        default: null
    },
    name: {
        type: String,
        required: true,
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

autoIncrement.initialize(mongoose.connection);
sysUserGroupSchema.plugin(autoIncrement.plugin, {
  model: "SysUserGroup",
  field: "sys_group_id",
  startAt: 1,
  incrementBy: 1,
});

module.exports = mongoose.model('SysUserGroup', sysUserGroupSchema);