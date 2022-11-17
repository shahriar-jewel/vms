const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');
const MemberStaff = require('../../model/MemberStaffModel');
const readXlsxFile = require("read-excel-file/node");
const multiparty = require('multiparty');
const moveFile = require('move-file');

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
                    var data = new MemberStaff({ member_staff_id, name, email, mobile, type, is_member, is_active: 'Y' });
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
                searchStr = { $or: [{ 'member_staff_id': regex }, { 'name': regex }, { 'email': regex }, { 'mobile': regex }, { 'type': regex }, { 'is_member': regex }] };
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
    getStaff: async (req, res) => {
        var is_member_staff = req.body.is_member_staff;
        var memberstaffs = await MemberStaff.find({ is_member: is_member_staff });
        if (memberstaffs) {
            return respondWithSuccess(req, res, 'all member staffs', memberstaffs, 200);
        } else {
            return respondWithSuccess(req, res, 'no member staffs', memberstaffs, 200);
        }
    },
    bulkUploadIndex: async (req, res) => {
        return res.render('admin/member/bulkupload');
    },
    bulkUpload: async (req, res) => {
        let file_name;
        const form = new multiparty.Form();
        const timeNow = new Date().getTime();
        try {
            form.parse(req, async (err, fields, files) => {
                if (err) return respondWithError(req, res, msg = 'Validation Error', err, 422);
                const newFilePath = './upload/images/' + timeNow;
                if (files.image[0].originalFilename != '') {
                    const currentPath = newFilePath + files.image[0].originalFilename;
                    file_name = timeNow + files.image[0].originalFilename;
                    await moveFile(files.image[0].path, currentPath);

                    readXlsxFile(currentPath).then((rows) => {
                        // skip header
                        rows.shift();
        
                        let members = [];
                        // console.log(rows[3])
        
                        rows.forEach((row) => {
                            let member = {
                                member_staff_id: row[1],
                                name: row[2],
                                type: row[3],
                                is_active: row[4],
                                mobile: row[5],
                                email: row[6],
                                is_member: 'member'
                            };
        
                            members.push(member);
                        });
        
                        MemberStaff.insertMany(members)
                            .then(() => {
                                res.status(200).send({
                                    message: "Uploaded the file successfully: ",
                                });
                            })
                            .catch((error) => {
                                res.status(500).send({
                                    message: "Fail to import data into database!",
                                    error: error.message,
                                });
                            });
                    });

                } else {
                    file_name = '';
                }
                



            });
        } catch (error) {
            console.log(error);
            res.status(500).send({message: "Could not upload the file: "});
        }
    }
}
module.exports = MemberStaffController;