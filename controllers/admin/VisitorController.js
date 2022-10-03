const User = require('../../model/UserModel');
const jwt = require('jsonwebtoken');
const multiparty = require('multiparty');
const moveFile = require('move-file');
const { respondWithError, respondWithSuccess, convertTime12to24 } = require('../../controllers/admin/ResponseController');
const VisitorInfo = require('../../model/VisitorModel');

const VisitorController = {
    index: async (req, res) => {
        const member_staffs = await User.find({ status: 1 }).select('-password');
        res.render('admin/visitor/index', { title: 'Visitor List', member_staffs });
    },
    store: async (req, res) => {
        const form = new multiparty.Form();
        const timeNow = new Date().getTime();
        var file_name,bag = {};

        try {
            form.parse(req, async (err, fields, files) => {
                if (err) return respondWithError(req, res, msg = 'Validation Error', err, 422);
                if (fields.visitor_type == '') return respondWithError(req, res, msg = 'Visitor type is required!', errors = [], 422);
                if (fields.membership_id[0] == '') return respondWithError(req, res, msg = 'Membership id is required!', errors = [], 422);
                var is_image_exist = await VisitorInfo.find({ "$and": [{ "visitor_info.member.membership_id": fields.membership_id[0] }, { "visitor_info.member.image": { $ne: '' } }] });
                if (is_image_exist.length > 0) {
                    file_name = is_image_exist[0]['visitor_info']['member']['image'];
                } else {
                    const newFilePath = './upload/images/' + timeNow;
                    if (files.image[0].originalFilename != '') {
                        const currentPath = newFilePath + files.image[0].originalFilename;
                        file_name = timeNow + files.image[0].originalFilename;
                        await moveFile(files.image[0].path, currentPath);
                    } else {
                        file_name = '';
                    }
                }

                var visitor_obj = {
                    visitor_info: {
                        member: {
                            _id: fields._id[0].split(' ')[1],
                            name: fields._id[0].split(' ')[4],
                            membership_id: fields.membership_id[0],
                            image: file_name,
                            visitor_type: fields.visitor_type[0],
                            is_member_ref: fields.visitor_type[0] == 'Guest' || fields.visitor_type[0] == 'Affiliated' ? true : false,
                            date: (new Date().toLocaleDateString()).split('/').join('-'),
                            time_in: new Date().toLocaleTimeString(),
                            time_out: new Date().toLocaleTimeString(),
                            meeting_status: 'checkedin',
                            duration: 0,
                            visit_place: fields.visit_place ? fields.visit_place[0] : '',
                            remarks: fields.remarks[0],
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
        } catch (error) {
            return respondWithError(req, res, msg = 'Something went wrong !', errors = error, 422);
        }
    },

    visitorDatatableAjax: async (req, res) => {
        var searchStr = req.query.search['value'];
        var limit = req.query.length;
        var recordsTotal = await VisitorInfo.count({});
        var recordsFiltered;
        if (searchStr) {
            var regex = new RegExp(searchStr, "i");
            searchStr = { $or: [{ 'visitor_info.member.name': regex }, { 'visitor_info.member.membership_id': regex }, { 'visitor_info.member.visitor_type': regex }, { 'visitor_info.member.date': regex }, { 'visitor_info.member.time_in': regex }, { 'visitor_info.member.time_out': regex }, { 'visitor_info.member.meeting_status': regex }, { 'visitor_info.member.visit_place': regex }, { 'visitor_info.member.remarks': regex }] };
            var visits = await VisitorInfo.find(searchStr).sort({ 'createdAt': -1 });
            recordsFiltered = await VisitorInfo.count(searchStr);
        } else {
            searchStr = {};
            var visits = await VisitorInfo.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
            recordsFiltered = recordsTotal;
        }

        var data = [];
        var nestedData = {};
        var meeting_duration;
        if (visits) {
            visits.map((visit, i) => {
                var image = '', meeting_status;
                if (visit['visitor_info']['member']['image'] != '') {
                    image = '<img src="/images/' + visit['visitor_info']['member']['image'] + '" class="zoom profile-user-img img-responsive img-circle img-sm" alt="Member Image">';
                } else {
                    image = '<img src="/assets/images/avatar.png" class="zoom profile-user-img img-responsive img-circle img-sm" alt="Member Image">';
                }
                if (visit['visitor_info']['member']['meeting_status'] == 'checkedin') {
                    meeting_status = "<span style='cursor:pointer' id='checkout' data-visit_id='" + visit['_id'] + "' class='label btn-primary'>" + visit['visitor_info']['member']['meeting_status'] + "</span>";
                } else {
                    meeting_status = "<span class='label label-success'>" + visit['visitor_info']['member']['meeting_status'] + "</span>";
                }
                var action = "<a data-toggle='modal' data-target='#view_guest_modal' class='btn-primary btn btn-rounded' id='guests' data-id='" + visit['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-eye-open'></i></a>";
                nestedData = {
                    membership_id: visit['visitor_info']['member']['membership_id'],
                    visitor_type: visit['visitor_info']['member']['visitor_type'],
                    name: visit['visitor_info']['member']['name'] ? visit['visitor_info']['member']['name'] : '-',
                    image: image,
                    meeting_status,
                    date: visit['visitor_info']['member']['date'],
                    time_in: visit['visitor_info']['member']['time_in'],
                    time_out: visit['visitor_info']['member']['time_out'],
                    duration: visit['visitor_info']['member']['duration'],
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
    },
    meetingCheckout: async (req, res) => {
        try {
            var visit_data = await VisitorInfo.findById(req.body._id, { "visitor_info.member.meeting_status": 1, "visitor_info.member.time_out": 1, "visitor_info.member.duration": 1, "visitor_info.member.date": 1 });
            var timeout, timein, hour, minute, temp, duration;
            if (visit_data) {
                if (visit_data.visitor_info.member.date != (new Date().toLocaleDateString()).split('/').join('-')) return respondWithError(req, res, msg = 'Checkin & Checkout not in same date !', data = [], 200);
                await VisitorInfo.updateOne(
                    { "_id": req.body._id },
                    { $set: { "visitor_info.member.time_out": new Date().toLocaleTimeString() } }
                );
                var visit = await VisitorInfo.findById(req.body._id, { "visitor_info.member.meeting_status": 1, "visitor_info.member.time_in": 1, "visitor_info.member.time_out": 1, "visitor_info.member.duration": 1, "visitor_info.member.date": 1 });
                timeout = convertTime12to24(visit.visitor_info.member.time_out);
                timein = convertTime12to24(visit.visitor_info.member.time_in);
                if (parseInt(timein.split(':')[1]) > parseInt(timeout.split(':')[1])) {
                    hour = parseInt(timeout.split(':')[0]) - parseInt(timein.split(':')[0]);
                    minute = parseInt(timein.split(':')[1]) - parseInt(timeout.split(':')[1]);
                    hour = (hour * 60) - minute;
                    temp = hour;
                    hour = Math.floor(hour / 60);
                    minute = temp % 60;
                } else {
                    hour = parseInt(timeout.split(':')[0]) - parseInt(timein.split(':')[0]);
                    minute = parseInt(timeout.split(':')[1]) - parseInt(timein.split(':')[1]);
                }
                duration = hour + 'h' + ' ' + minute + 'm';
                await VisitorInfo.updateOne(
                    { "_id": req.body._id },
                    { $set: { "visitor_info.member.meeting_status": 'checkedout', "visitor_info.member.duration": duration } }
                );
                return respondWithSuccess(req, res, msg = 'Check out successfull !', data = [], 200);
            } else {
                return respondWithError(req, res, msg = 'No record found !', data = [], 200);
            }
        } catch (err) {
            return res.status(200).json({ msg: err.message, statuscode: 200 });
        }
    },
    memberAvailability: async (req, res) => {
        try {
            var membership_id = req.body.membership_id;
            var mobile = req.body.mobile;
            var user_status = req.body.user_status == 1 ? "<span class='label label-success'>Active</span>" : "<span class='label label-danger'>Inactive</span>";
            var member = {};
            // Improve it later on
            var agg_data = await VisitorInfo.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'visitor_info.member.membership_id',
                        foreignField: 'membership_id',
                        as: 'user'
                    }
                },
                { $match: { 'user.membership_id': { "$eq": membership_id } } },
                { $project: { "user.status": 1, "user.membership_id": 1, "user.mobile": 1, "visitor_info.member.date": 1, "visitor_info.member.meeting_status": 1, "visitor_info.member.duration": 1 } },
            ]);

            if (agg_data.length > 0) {

                var filtered_data = agg_data.filter((data, index) => {
                    return data.visitor_info.member.date === (new Date().toLocaleDateString()).split('/').join('-')
                        && (data.visitor_info.member.meeting_status == 'checkedin' && data.visitor_info.member.duration == 0);
                });

                member['membership_id'] = agg_data[0]['user'][0]['membership_id'];
                member['membership_status'] = agg_data[0]['user'][0]['status'] == 1 ? "<span class='label label-success'>Active</span>" : "<span class='label label-danger'>Inactive</span>";
                member['mobile'] = agg_data[0]['user'][0]['mobile'];

                if (filtered_data.length > 0) {
                    member['availability'] = "<span class='label label-danger'>Unavilable</span>";
                } else {
                    member['availability'] = "<span class='label label-success'>Avilable</span>";
                }
                return respondWithSuccess(req, res, msg = 'Member availability check !', data = member, 200);
            } else {
                member['membership_id'] = membership_id;
                member['membership_status'] = user_status;
                member['mobile'] = mobile;
                member['availability'] = "<span class='label label-success'>Avilable</span>";
                return respondWithSuccess(req, res, msg = 'Member availability check !', data = member, 200);
            }
        } catch (err) {
            console.log(err)
            return res.status(200).json({ msg: err.message });
        }
    },
    viewGuest : async (req,res) =>{
        var bag = await VisitorInfo.findById(req.body.visit_id).select('visitor_info.member.guests');
        if(bag['visitor_info']['member']['guests']){
            var guests = bag['visitor_info']['member']['guests'];
            return respondWithSuccess(req, res, msg = 'Guests !', data = guests, 200);
        }else{
            return respondWithSuccess(req, res, msg = 'No guests !', data = [], 200);
        }
    }
}

module.exports = VisitorController;