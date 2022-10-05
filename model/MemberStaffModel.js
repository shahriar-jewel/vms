const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const MemberStaffSchema = new mongoose.Schema({
    member_staff_id: {type: String},
    name: {type: String,required : true},
    email: {type: String,required : true},
    mobile: {type: String,required : true},
    type: {type: String,default : null},
    is_member: {type: String,default : 'member'},
    is_active: {type: String,default : 'Y'}, // Y means active, N means inactive
}, {timestamps: true});

module.exports = mongoose.model('MemberStaff', MemberStaffSchema);