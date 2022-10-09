const moveFile = require('move-file');
const csv = require('fast-csv');
const multiparty = require('multiparty');
const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');

const VisitorController = {
    getVisitorPayload: async (req, res) => {
        const form = new multiparty.Form();
        const timeNow = new Date().getTime();
        var file_name;

        form.parse(req, async (err, fields, files) => {
            if(err) return respondWithError(req, res, msg='Validation Error', err, 422);
            if (!fields.visitor_type) return respondWithError(req, res, msg = 'Visitor type is required!', errors = [], 200); 
            if(!fields.member_staff_id) return respondWithError(req, res, msg='Membership Id is required!', errors=[], 200);

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
                        member: {
                            _id: fields._id[0],
                            name: fields.name[0],
                            member_staff_id:  fields.member_staff_id[0],
                            image: file_name,
                            type : fields.is_staff ? fields.is_staff[0] : 'member', // type whom the guest to visit. e.g member or staff
                            visitor_type: fields.visitor_type[0],
                            is_member_ref: fields.visitor_type[0] == 'Guest' ? true : false,
                            date: (new Date().toLocaleDateString()).split('/').join('-'),
                            time_in: new Date().toLocaleTimeString(),
                            time_out: new Date().toLocaleTimeString(),
                            meeting_status: 'checkedin',
                            spouse : fields.visitor_type[0] == 'Member' || fields.visitor_type[0] == 'Affiliated' ? fields.spouse[0] : 0,
                            children : fields.visitor_type[0] == 'Member' || fields.visitor_type[0] == 'Affiliated' ? fields.children[0] : 0,
                            duration: 0,
                            visit_place: fields.visit_place ? fields.visit_place[0] : '-:-',
                            remarks: fields.remarks[0],
                            guests: JSON.parse(fields.guests) ? JSON.parse(fields.guests) : []
                        }
                    }
                };

            return res.json(visitor_obj);
        });
    },
}

module.exports = VisitorController;