const MemberStaffModel = require('../../../model/MemberStaffModel');

const MemberStaffProvider = {
    get : async (req,res) => {
        const memberstaffs = await MemberStaffModel.find({is_active : 'Active' });
        return memberstaffs;
    },
}
module.exports = MemberStaffProvider;


