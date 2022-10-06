const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');
const MemberStaff = require('../../model/MemberStaffModel');

const MemberStaffController = {
    index: async (req, res) => {
        return res.render('admin/member/index');
    },
    store: async (req, res) => {
        try {
            var msg, data;
            var { member_staff_id, name, email, mobile, type, is_member } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                var is_exist = await MemberStaff.find({ mobile });
                if (is_exist.length > 0) {
                    data = '';
                    msg = 'This record is already exists!';
                    return respondWithSuccess(req, res, msg, data, 200);
                } else {
                    var data = new MemberStaff({ member_staff_id, name, email, mobile, type, is_member, is_active:'Y' });
                    if (data.save()) {
                        data = '';
                        msg = 'Member Added Successfully!';
                        return respondWithSuccess(req, res, msg, data, 200);
                    } else {
                        data = '';
                        msg = 'Data Not Saved. Something Wrong!';
                        return respondWithError(req, res, msg, data, 200);
                    }
                }
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    memberStaffDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await MemberStaff.count({});
            var recordsFiltered;
            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'member_staff_id': regex }, { 'name': regex }, { 'email': regex }, { 'mobile': regex }, { 'type': regex },{ 'is_member': regex }] };
                var member_staffs = await MemberStaff.find(searchStr).sort({ 'createdAt': -1 });
                recordsFiltered = await MemberStaff.count(searchStr);
            } else {
                searchStr = {};
                var member_staffs = await MemberStaff.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [], is_member, is_active;
            var nestedData = {};
            if (member_staffs) {
                member_staffs.map((member_staff, i) => {
                    if (member_staff['is_active'] == 'Y') {
                        is_active = "<span style='cursor:pointer' class='label btn-success'>" + 'Active' + "</span>";
                    } else {
                        is_active = "<span class='label label-success'>" + 'InActive' + "</span>";
                    }
                    var action = "<a class='btn-primary btn btn-rounded' id='member_staff' data-id='" + member_staff['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-eye-open'></i></a>";
                    nestedData = {
                        member_staff_id: member_staff['member_staff_id'],
                        name: member_staff['name'],
                        email: member_staff['email'],
                        mobile: member_staff['mobile'],
                        type: member_staff['type'],
                        is_active: is_active,
                        is_member: "<span style='cursor:pointer' class='label btn-success'>" + member_staff['is_member'] + "</span>",
                        actions: action
                    };
                    data.push(nestedData);
                })
            }

            var mytable = JSON.stringify({
                "draw": req.query.draw,
                "iTotalRecords": recordsTotal,
                "iTotalDisplayRecords": recordsFiltered,
                "limit": limit,
                "aaData": data
            });
            return res.send(mytable);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    getStaff : async (req,res) => {
        var is_member_staff = req.body.is_member_staff;
        var memberstaffs = await MemberStaff.find({is_member : is_member_staff});
        if(memberstaffs){
            return respondWithSuccess(req, res, 'all member staffs', memberstaffs, 200);
        }else{
            return respondWithSuccess(req, res, 'no member staffs', memberstaffs, 200);
        }
    },
}
module.exports = MemberStaffController;