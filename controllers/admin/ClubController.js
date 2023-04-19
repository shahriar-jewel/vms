const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('./ResponseController');
const Visitplace = require('../../model/VisitPlaceModel');
const ClubModel = require('../../model/ClubModel');

const ClubController = {
    index: async (req, res) => {
        return res.render('admin/club/index');
    },
    store: async (req, res) => {
        try {
            var msg, data;
            var { name, status } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                var is_exist = await ClubModel.find({ name });
                if (is_exist.length > 0) {
                    data = '';
                    msg = 'Club Already Exists!';
                    return respondWithSuccess(req, res, msg, data, 200);
                } else {
                    var data = new ClubModel({ name, status });
                    if (data.save()) {
                        data = '';
                        msg = 'Club Added Successfully!';
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
    clubDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await ClubModel.count({});
            var recordsFiltered;

            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'name': regex }] };
                var clubs = await ClubModel.find(searchStr, '_id name status createdAt').sort({ 'createdAt': -1 });
                recordsFiltered = await ClubModel.count(searchStr);
            } else {
                searchStr = {};
                var clubs = await ClubModel.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [];
            var nestedData = {};
            if (clubs) {
                var sl = 0;
                clubs.map((club, i) => {
                    var status;
                    if (club['status'] === 1) {
                        status = "<span class='label label-success'>Active</span>";
                    } else if (club['status'] === 0) {
                        status = "<span class='label label-danger'>Inactive</span>";
                    }

                    // var action = "<a data-toggle='modal' data-target='#club_modal' id='editClub' data-backdrop='static' data-keyboard='false' class='btn-primary btn btn-rounded' data-club_id='" + club['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-edit'></i></a>";
                    nestedData = {
                        _id: club['_id'],
                        name: club['name'],
                        status,
                        createdAt: new Date(club['createdAt']).toLocaleTimeString(),
                        actions: ''
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
module.exports = ClubController;