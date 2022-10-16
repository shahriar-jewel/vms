const MemberStaffModel = require('../../../model/MemberStaffModel');

const MemberStaffProvider = {
    get : async (req,res) => {
        const memberstaffs = await MemberStaffModel.find({is_active : 'Y' });
        return memberstaffs;
    },
}
module.exports = MemberStaffProvider;


