const User = require('../../model/UserModel');
const jwt = require('jsonwebtoken');
const multiparty = require('multiparty');
const moveFile = require('move-file');
const { respondWithError, respondWithSuccess, convertTime12to24, dhm } = require('../../controllers/admin/ResponseController');
const VisitorInfo = require('../../model/VisitorModel');
const MemberStaff = require('../../model/MemberStaffModel');
const Visitplace = require('../../model/VisitPlaceModel');

const VisitorController = {
    index: async (req, res) => {
        const member_staffs = await MemberStaff.find({});
        const places = await Visitplace.find({ status: 1 });
        res.render('admin/visitor/index', { title: 'Visitor List', member_staffs, places });
    },
    store: async (req, res) => {
        const form = new multiparty.Form();
        const timeNow = new Date().getTime();
        var file_name, bag = {};

        try {
            form.parse(req, async (err, fields, files) => {
                if (err) return respondWithError(req, res, msg = 'Validation Error', err, 422);
                if (fields.visitor_type == '') return respondWithError(req, res, msg = 'Visitor type is required!', errors = [], 422);
                if (fields.visitor_type[0] != 'Others') {
                    if (fields.member_staff_id[0] == '') return respondWithError(req, res, msg = 'Membership id is required!', errors = [], 422);
                }
                var is_image_exist = await VisitorInfo.find({ "$and": [{ "visitor_info.visitor.member_staff_id": fields.member_staff_id[0] }, { "visitor_info.visitor.image": { $ne: '' } }] });
                if (is_image_exist.length > 0) {
                    file_name = is_image_exist[0]['visitor_info']['visitor']['image'];
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
                        visitor: {
                            _id: fields.visitor_type[0] == 'Affiliated' || fields.visitor_type[0] == 'Others' ? null : fields._id[0].split(' ')[1],
                            name: fields.visitor_type[0] == 'Member' || fields.visitor_type[0] == 'Guest' ? fields._id[0].split(' ')[4] : (fields.visitor_type[0] == 'Affiliated' ? fields.name[0] : (fields.visitor_type[0] == 'Others' ? fields.other_name[0] : '-')),
                            member_staff_id: fields.visitor_type[0] != 'Others' ? fields.member_staff_id[0] : null,
                            mobile: fields.visitor_type[0] == 'Member' || fields.visitor_type[0] == 'Guest' ? fields.visitor_type[0].split(' ')[3] : (fields.visitor_type[0] == 'Affiliated' ? '' : fields.other_mobile[0]),
                            club: fields.visitor_type[0] == 'Affiliated' ? fields.club[0] : null,
                            image: file_name,
                            // type : fields.is_staff ? fields.is_staff[0] : 'member', // type whom the guest to visit. e.g member or staff
                            visitor_type: fields.visitor_type[0],
                            is_member_ref: fields.visitor_type[0] == 'Guest' ? true : false,
                            date: (new Date().toLocaleDateString()).split('/').join('-'),
                            // time_in: new Date().toLocaleTimeString(),
                            time_in: new Date(),
                            time_out: new Date(),
                            meeting_status: 'checkedin',
                            spouse: fields.visitor_type[0] == 'Member' || fields.visitor_type[0] == 'Affiliated' ? fields.spouse[0] : 0,
                            children: fields.visitor_type[0] == 'Member' || fields.visitor_type[0] == 'Affiliated' ? fields.children[0] : 0,
                            duration: 0,
                            visit_place: fields.visit_place ? fields.visit_place[0] : null,
                            address: fields.address ? fields.address[0] : null,
                            purpose: fields.purpose ? fields.purpose[0] : null,
                            remarks: fields.remarks[0],
                            platform: 'Web',
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
            searchStr = { $or: [{ 'visitor_info.visitor.name': regex }, { 'visitor_info.visitor.member_staff_id': regex }, { 'visitor_info.visitor.visitor_type': regex }, { 'visitor_info.visitor.time_in': regex }, { 'visitor_info.visitor.time_out': regex }, { 'visitor_info.visitor.meeting_status': regex }, { 'visitor_info.visitor.visit_place': regex }, { 'visitor_info.visitor.remarks': regex }] };
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
                let timein_date = (visit['visitor_info']['visitor']['time_in']).toLocaleDateString('en-ca');
                let timein_time = (visit['visitor_info']['visitor']['time_in']).toLocaleTimeString();

                let timeout_date = (visit['visitor_info']['visitor']['time_out']).toLocaleDateString('en-ca');
                let timeout_time = (visit['visitor_info']['visitor']['time_out']).toLocaleTimeString();

                if (visit['visitor_info']['visitor']['image'] != '') {
                    image = '<img src="/images/' + visit['visitor_info']['visitor']['image'] + '" class="zoom profile-user-img img-responsive img-circle img-sm" alt="Member Image">';
                } else {
                    image = '<img src="/assets/images/avatar.png" class="zoom profile-user-img img-responsive img-circle img-sm" alt="Member Image">';
                }
                if (visit['visitor_info']['visitor']['meeting_status'] == 'checkedin') {
                    meeting_status = "<span style='cursor:pointer' id='checkout' data-visit_id='" + visit['_id'] + "' class='label btn-primary'>" + visit['visitor_info']['visitor']['meeting_status'] + "</span>";
                } else {
                    meeting_status = "<span class='label label-success'>" + visit['visitor_info']['visitor']['meeting_status'] + "</span>";
                }
                var action = "<a data-toggle='modal' data-target='#view_guest_modal' class='btn-primary btn btn-rounded' id='guests' data-id='" + visit['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-eye-open'></i></a>";
                nestedData = {
                    member_staff_id: visit['visitor_info']['visitor']['member_staff_id'] ? visit['visitor_info']['visitor']['member_staff_id'] : '-:-',
                    visitor_type: visit['visitor_info']['visitor']['visitor_type'],
                    name: visit['visitor_info']['visitor']['name'] ? visit['visitor_info']['visitor']['name'] : '-',
                    image: image,
                    meeting_status,
                    time_in: timein_date+' '+timein_time,
                    time_out: timeout_date+' '+timeout_time,
                    duration: visit['visitor_info']['visitor']['duration'],
                    actions: visit['visitor_info']['visitor']['visitor_type'] == 'Guest' ? action : ''
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
            var visit_data = await VisitorInfo.findById(req.body._id, { "visitor_info.visitor.meeting_status": 1, "visitor_info.visitor.time_out": 1, "visitor_info.visitor.duration": 1, "visitor_info.visitor.date": 1,"createdAt": 1 });
            var timeout, timein, hour, minute, temp, duration;
            if (visit_data) {
                await VisitorInfo.updateOne(
                    { "_id": req.body._id },
                    { $set: { "visitor_info.visitor.time_out": new Date() } }
                );
                var visit = await VisitorInfo.findById(req.body._id, { "visitor_info.visitor.meeting_status": 1, "visitor_info.visitor.time_in": 1, "visitor_info.visitor.time_out": 1, "visitor_info.visitor.duration": 1, "visitor_info.visitor.date": 1 });
                const t1 = (new Date('2022-11-15T17:01:11.407+00:00')).getTime();
                const t2 = (new Date('2022-11-17T18:01:11.407+00:00')).getTime();
                timeout = (visit.visitor_info.visitor.time_out).getTime();
                timein = (visit.visitor_info.visitor.time_in).getTime();
                duration = dhm(Math.abs(timeout - timein));
                await VisitorInfo.updateOne(
                    { "_id": req.body._id },
                    { $set: { "visitor_info.visitor.meeting_status": 'checkedout', "visitor_info.visitor.duration": duration } }
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
            var member_staff_id = req.body.member_staff_id;
            var mobile = req.body.mobile;
            var is_active = req.body.is_active == 'Y' ? "<span class='label label-success'>Active</span>" : "<span class='label label-danger'>Inactive</span>";
            var member = {};
            // Improve it later on
            var agg_data = await VisitorInfo.aggregate([
                {
                    $lookup: {
                        from: 'memberstaffs',
                        localField: 'visitor_info.visitor.member_staff_id',
                        foreignField: 'member_staff_id',
                        as: 'member_staff'
                    }
                },
                { $match: { 'member_staff.member_staff_id': { "$eq": member_staff_id } } },
                { $project: { "member_staff.is_active": 1, "member_staff.member_staff_id": 1, "member_staff.mobile": 1, "visitor_info.visitor.date": 1, "visitor_info.visitor.meeting_status": 1, "visitor_info.visitor.duration": 1 } },
            ]);

            if (agg_data.length > 0) {

                var filtered_data = agg_data.filter((data, index) => {
                    return data.visitor_info.visitor.date === (new Date().toLocaleDateString()).split('/').join('-')
                        && (data.visitor_info.visitor.meeting_status == 'checkedin' && data.visitor_info.visitor.duration == 0);
                });

                member['member_staff_id'] = agg_data[0]['member_staff'][0]['member_staff_id'];
                member['is_active'] = agg_data[0]['member_staff'][0]['is_active'] == 'Y' ? "<span class='label label-success'>Active</span>" : "<span class='label label-danger'>Inactive</span>";
                member['mobile'] = agg_data[0]['member_staff'][0]['mobile'];

                if (filtered_data.length > 0) {
                    member['availability'] = "<span class='label label-danger'>Unavilable</span>";
                } else {
                    member['availability'] = "<span class='label label-success'>Avilable</span>";
                }
                return respondWithSuccess(req, res, msg = 'Member availability check !', data = member, 200);
            } else {
                member['member_staff_id'] = member_staff_id;
                member['is_active'] = is_active;
                member['mobile'] = mobile;
                member['availability'] = "<span class='label label-success'>Avilable</span>";
                return respondWithSuccess(req, res, msg = 'Member availability check !', data = member, 200);
            }
        } catch (err) {
            console.log(err)
            return res.status(200).json({ msg: err.message });
        }
    },
    viewGuest: async (req, res) => {
        var bag = await VisitorInfo.findById(req.body.visit_id).select('visitor_info.visitor.guests');
        if (bag['visitor_info']['visitor']['guests']) {
            var guests = bag['visitor_info']['visitor']['guests'];
            return respondWithSuccess(req, res, msg = 'Guests !', data = guests, 200);
        } else {
            return respondWithError(req, res, msg = 'No guests !', data = [], 200);
        }
    },
    getOtherData : async (req,res) => { // data of 'Others' visitor_type visitor
        var mobile = req.body.other_mobile;
        var data = await VisitorInfo.find({"$and" : [{"visitor_info.visitor.mobile" : {"$regex" : mobile,"$options" : "i"}},{"visitor_info.visitor.visitor_type" : 'Others'}]}).select("visitor_info.visitor.name visitor_info.visitor.mobile visitor_info.visitor.address visitor_info.visitor.purpose").limit(1);
        try{
            if(data.length > 0){
                return respondWithSuccess(req, res, msg = 'visitor data !', data, 200);
            }else{
                return respondWithError(req, res, msg = 'no data found !', data, 200);
            }
        }catch(err){
            return res.status(200).json({ msg: err.message });
        }
    },
}

module.exports = VisitorController;