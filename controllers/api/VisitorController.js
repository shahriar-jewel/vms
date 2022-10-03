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

        let full_name = '', mobile = '', from = '', image = '', cardno = '';

        form.parse(req, async (err, fields, files) => {
            if(err) return respondWithError(req, res, msg='Validation Error', err, 422);
            if(!files.image) return respondWithError(req, res, msg='Image is required!', errors=[], 422); 
            if(!fields.fullname) return respondWithError(req, res, msg='Visitor name is required!', errors=[], 422);

            

            const newFilePath = './upload/images/' + timeNow;
            if (files.image) {
                const currentPath = newFilePath + files.image[0].originalFilename;
                file_name = timeNow + files.image[0].originalFilename;
                await moveFile(files.image[0].path, currentPath);
            } else {
                file_name = '';
            }

            fullname = fields.fullName[0];
            mobile = fields.mobileNo[0];
            from = fields.from[0];
            image = fileName;
            cardno = fields.cardno[0];


            const created_by = {
                _id: fields.created_id[0],
                name: fields.created_by[0]
            };

            const purpose = {
                _id: fields.purpose_id[0],
                purposename: fields.purposename[0]
            };
            // created_by = fields.id[0];

            const emp_info = {
                emp_name: fields.emp_name[0],
                emp_mobile: fields.emp_mobile[0],
                designation: fields.designation[0],
                department: fields.department[0]
            };
            return res.json({ fullname, file_name, status: true });
        });
    },
}

module.exports = VisitorController;