const moveFile = require('move-file');
const csv = require('fast-csv');
const multiparty = require('multiparty');
const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');
const VisitorInfo = require('../../model/VisitorModel');

const VisitorController = {
    getVisitorPayload: async (req, res) => {
        const form = new multiparty.Form();
        const timeNow = new Date().getTime();
        var file_name;

        form.parse(req, async (err, fields, files) => {
            if (err) return respondWithError(req, res, msg = 'Validation Error', err, 422);
            if (!fields.visitor_type) return respondWithError(req, res, msg = 'Visitor type is required!', errors = [], 200);
            if (fields.visitor_type[0] != 'Others') {
                if (fields.member_id[0] == '') return respondWithError(req, res, msg = 'Membership id is required!', errors = [], 200);
            }

            const newFilePath = './upload/images/' + timeNow;
            if (files.image) {
                const currentPath = newFilePath + files.image[0].originalFilename;
                file_name = timeNow + files.image[0].originalFilename;
                await moveFile(files.image[0].path, currentPath);
            } else {
                file_name = '';
            }

            var visitor_obj = {
                visitor_info: {
                    visitor: {
                        _id: fields._id[0],
                        name: fields.name[0],
                        member_staff_id: fields.member_id[0],
                        mobile: fields.mobile[0],
                        club: fields.club ? fields.club[0] : null,
                        image: file_name,
                        // type : fields.is_staff ? fields.is_staff[0] : 'member', // type whom the guest to visit. e.g member or staff
                        visitor_type: fields.visitor_type[0],
                        is_member_ref: fields.visitor_type[0] == 'Guest' ? true : false,
                        date: (new Date().toLocaleDateString()).split('/').join('-'),
                        time_in: new Date(),
                        time_out: new Date(),
                        meeting_status: 'checkedin',
                        spouse: fields.spouse[0],
                        children: fields.children[0],
                        duration: 0,
                        visit_place: fields.visit_place ? fields.visit_place[0] : null,
                        address: fields.address[0],
                        purpose: fields.purpose[0],
                        remarks: fields.remarks[0],
                        platform: 'Tab',
                        guests: JSON.parse(fields.guests) ? JSON.parse(fields.guests) : []
                    }
                }
            };

            var visitor = await new VisitorInfo(visitor_obj);
            if (visitor.save()) {
                return respondWithSuccess(req, res, msg = 'Visitor registration successfull !', data = visitor, 200);
            } else {
                return respondWithError(req, res, msg = 'Visitor registration not successfull !', errors = [], 422);
            }
        });
    },
    getOtherData: async (req, res) => {
        var mobile = req.body.mobile;
        var data = await VisitorInfo.find({ "$and": [{ "visitor_info.visitor.mobile": { "$regex": mobile, "$options": "i" } }, { "visitor_info.visitor.visitor_type": 'Others' }] }).select("visitor_info.visitor.name visitor_info.visitor.mobile visitor_info.visitor.address visitor_info.visitor.purpose").limit(1);
        try {
            if (data.length > 0) {
                return respondWithSuccess(req, res, msg = 'visitor data !', data, 200);
            } else {
                return respondWithError(req, res, msg = 'no data found !', data, 200);
            }
        } catch (err) {
            return res.status(200).json({ msg: err.message });
        }
    },
    searchWithMobile: async (req, res) => {
        var mobile = req.body.mobile;
        var data = await VisitorInfo.find({ "$and": [{ "visitor_info.visitor.mobile": { "$regex": mobile, "$options": "i" } }] }).limit(1);
        try {
            if (data.length > 0) {
                return respondWithSuccess(req, res, msg = 'Visitor data !', data, 200);
            } else {
                return respondWithError(req, res, msg = 'no data found !', data, 200);
            }
        } catch (err) {
            return res.status(200).json({ msg: err.message });
        }
    },
}

module.exports = VisitorController;