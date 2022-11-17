const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const MemberStaffSchema = new mongoose.Schema({
    member_staff_id: {type: String},
    name: {type: String,required : false},
    email: {type: String,required : false},
    mobile: {type: String,required : false},
    type: {type: String,default : null},
    is_member: {type: String,default : 'member'},
    is_active: {type: String,default : 'Active'},
}, {timestamps: true});

module.exports = mongoose.model('MemberStaff', MemberStaffSchema);