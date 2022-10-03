const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');
const Purpose = require('../../model/PurposeModel');

const PurposeController = {
    index: async (req, res) => {
        return res.render('admin/purpose/index');
    },
    store: async (req, res) => {
        try {
            var msg, data;
            var { purpose, status } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                var purpose_check = await Purpose.find({ purpose });
                if (purpose_check.length > 0) {
                    data = '';
                    msg = 'Purpose Name is Already There!';
                    return respondWithSuccess(req, res, msg, data, 200);
                } else {
                    const purpos = new Purpose({ purpose, status });
                    if (purpos.save()) {
                        data = '';
                        msg = 'Purpose Added Successfully!';
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
    purposeDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await Purpose.count({});
            var recordsFiltered;

            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'purpose': regex }] };
                var purposes = await Purpose.find(searchStr, '_id purpose status createdAt').sort({ 'createdAt': -1 });
                recordsFiltered = await Purpose.count(searchStr);
            } else {
                searchStr = {};
                var purposes = await Purpose.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [];
            var nestedData = {};
            if (purposes) {
                var sl = 0;
                purposes.map((purpose, i) => {
                    var status;
                    if (purpose['status'] === 1) {
                        status = "<span class='label label-success'>Active</span>";
                    } else if (purpose['status'] === 0) {
                        status = "<span class='label label-danger'>Inactive</span>";
                    }

                    var action = "<a class='btn-primary btn btn-rounded' id='edit' data-id='" + purpose['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-lock'></i></a>";
                    nestedData = {
                        _id: purpose['_id'],
                        purpose: purpose['purpose'],
                        status,
                        createdAt: new Date(purpose['createdAt']),
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
}
module.exports = PurposeController;