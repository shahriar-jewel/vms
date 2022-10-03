const {todayVisitorProvider,weekVisitorProvider,monthVisitorProvider,todayMemberProvider,weekMemberProvider,monthMemberProvider} = require('../../controllers/admin/DashboardController');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');

const ReportController = {
    index : async (req,res) => {
        return res.render('admin/report/module');
    },
    generalReport : async(req,res) => {
        return res.render('admin/report/general');
    },
    generalReportAjax : async (req,res) => {
        var report_type = req.body.reportType;
        if(report_type == 1){
            var data = await todayVisitorProvider();
            return respondWithSuccess(req, res, msg = 'today visitor list !', data, 200);
        }else if(report_type == 2){
            var data = await weekVisitorProvider();
            return respondWithSuccess(req, res, msg = 'week visitor list !', data, 200);
        }else if(report_type == 3){
            var data = await monthVisitorProvider();
            return respondWithSuccess(req, res, msg = 'month visitor list !', data, 200);
        }
    },
    memberReport : async (req,res) => {
        return res.render('admin/report/member');
    },
    memberReportAjax : async (req,res) => {
        var report_type = req.body.reportType;
        if(report_type == 1){
            var data = await todayMemberProvider();
            return respondWithSuccess(req, res, msg = 'today member list !', data, 200);
        }else if(report_type == 2){
            var data = await weekMemberProvider();
            return respondWithSuccess(req, res, msg = 'week member list !', data, 200);
        }else if(report_type == 3){
            var data = await monthMemberProvider();
            return respondWithSuccess(req, res, msg = 'month member list !', data, 200);
        }
    },
}

module.exports = ReportController;