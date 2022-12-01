const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('./ResponseController');
const Visitplace = require('../../model/VisitPlaceModel');

const VisitPlaceController = {
    index: async (req, res) => {
        return res.render('admin/visitplace/index');
    },
    store: async (req, res) => {
        try {
            var msg, data;
            var { place, status } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                var is_exist = await Visitplace.find({ place });
                if (is_exist.length > 0) {
                    data = '';
                    msg = 'Visit place is Already There!';
                    return respondWithSuccess(req, res, msg, data, 200);
                } else {
                    var data = new Visitplace({ place, status });
                    if (data.save()) {
                        data = '';
                        msg = 'Visit Place Added Successfully!';
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
    edit: async (req, res) => {
        const place = await Visitplace.findById(req.params.id);
        if (!place) return respondWithError(req, res, 'Place not found.!', errors = [], 422);
        return respondWithSuccess(req, res, 'Visit place data!', data = place, 200);
    },
    update: async (req, res) => {
        const { place, status, hidden_place_id } = req.body;
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            errors = errors.array();
            msg = 'Validation Error';
            return respondWithError(req, res, msg, errors, 422);
        } else {
            const isUpdate = await Visitplace.updateOne(
                { _id: hidden_place_id },
                {
                    $set: { place, status: status? status : 0 }
                }
            )
            if (!isUpdate.ok) return respondWithError(req, res, 'Do not update the record. Something went wrong!', errors, 422);
            return respondWithSuccess(req, res, 'Visit place updated successfully!', data = '', 200);
        }
    },
    visitPlaceDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await Visitplace.count({});
            var recordsFiltered;

            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'place': regex }] };
                var places = await Visitplace.find(searchStr, '_id place status createdAt').sort({ 'createdAt': -1 });
                recordsFiltered = await Visitplace.count(searchStr);
            } else {
                searchStr = {};
                var places = await Visitplace.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [];
            var nestedData = {};
            if (places) {
                var sl = 0;
                places.map((place, i) => {
                    var status;
                    if (place['status'] === 1) {
                        status = "<span class='label label-success'>Active</span>";
                    } else if (place['status'] === 0) {
                        status = "<span class='label label-danger'>Inactive</span>";
                    }

                    var action = "<a data-toggle='modal' data-target='#visitplace_modal' id='editPlace' data-backdrop='static' data-keyboard='false' class='btn-primary btn btn-rounded' data-place_id='" + place['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-edit'></i></a>";
                    nestedData = {
                        _id: place['_id'],
                        place: place['place'],
                        status,
                        createdAt: new Date(place['createdAt']).toLocaleTimeString(),
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
module.exports = VisitPlaceController;