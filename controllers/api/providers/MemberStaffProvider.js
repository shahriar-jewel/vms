const MemberStaffModel = require('../../../model/MemberStaffModel');

const MemberStaffProvider = {
    get : async (req,res) => {
        const memberstaffs = await MemberStaffModel.find({is_active : 'Y' });
        var data = memberstaffs.reduce((group,memberstaff) =>{
                group[memberstaff['is_member']] = group[memberstaff['is_member']] ? group[memberstaff['is_member']] : [];
                group[memberstaff['is_member']].push(memberstaff);
                return group;
        },{});
        return data;
    },
}
module.exports = MemberStaffProvider;


