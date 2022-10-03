const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../ResponseController');
const SysMenu = require('../../../model/role/SysMenu');
const all_routes = require('express-list-endpoints');
const SysUserGroup = require('../../../model/role/SysUserGroup');
const Permission = require('../../../model/role/Permission');

const PermissionController = {
    index: async (req, res) => {
        const routes = all_routes(require('../../../routes/web'));
        var all_route = [];

        routes.forEach((route, index) => {
            if (((Array.isArray(route['middlewares']) && route['middlewares'].includes('Auth'))) ||
                (!Array.isArray('middlewares') && route['middlewares'] === 'Auth')) {
                route['methods'].forEach((method, i) => {
                    all_route.push('/admin' + route['path'] + ' ' + method);

                });
            }
        });
        var filtered_routes = all_route.filter((route) => {
            return route != null;
        });
        return res.render('admin/role/permission/index', { all_route: filtered_routes });
    },
    store: async (req, res) => {
        try {
            var msg, data;
            const { name, route, description, status } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                var permission_check = await Permission.find({ name: name });
                if (permission_check.length > 0) {
                    data = '';
                    msg = 'Permission Name is Already There!';
                } else {
                    const permission = new Permission({ name: name, method: route.split(' ')[1], route: route.split(' ')[0], description, status });
                    if (permission.save()) {
                        data = '';
                        msg = 'Permission Name Added Successfully!';
                    } else {
                        data = '';
                        msg = 'Data Not Saved. Something Wrong!';
                    }
                }
                return respondWithSuccess(req, res, msg, data, 200);
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    permissionDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await Permission.count({});
            var recordsFiltered;

            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'name': regex }, { 'route': regex },{ 'method': regex }, { 'description': regex }] };
                var permissions = await Permission.find(searchStr, '_id name route method description status createdAt').sort({ 'createdAt': -1 });
                recordsFiltered = await Permission.count(searchStr);
            } else {
                searchStr = {};
                var permissions = await Permission.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [];
            var nestedData = {};
            if (permissions) {
                var sl = 0;
                permissions.map((permission, i) => {
                    var status;
                    if (permission['status'] === 1) {
                        status = "<span class='label label-success'>Active</span>";
                    } else if (permission['status'] === 0) {
                        status = "<span class='label label-danger'>Inactive</span>";
                    }

                    var action = "<a class='btn-primary btn btn-rounded' id='edit' data-id='" + permission['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-arrow-up'></i></a>";
                    nestedData = {
                        _id: permission['_id'],
                        name: permission['name'],
                        route: permission['route'],
                        method: permission['method'],
                        description: permission['description'],
                        status,
                        createdAt: new Date(permission['createdAt']),
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
module.exports = PermissionController;