const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../ResponseController');
const SysMenu = require('../../../model/role/SysMenu');
const all_routes = require('express-list-endpoints');
const SysUserGroup = require('../../../model/role/SysUserGroup');
const Permission = require('../../../model/role/Permission');
const SysGroupPermission = require('../../../model/role/SysGroupPermission');

const UserGroupController = {
    index: async (req, res) => {
        var permissions = await Permission.find({ status: 1 }); // all active permissions
        const groupBy = permissions.reduce((group, permission) => { // all permissions group by permission layers
            group[permission['name'].split(' ')[0]] = Array.isArray(group[permission['name'].split(' ')[0]]) ? group[permission['name'].split(' ')[0]] : [];
            group[permission['name'].split(' ')[0]].push(permission);
            return group;
        }, {});
        return res.render('admin/role/usergroup/index', { groupBy });
    },
    store: async (req, res) => {
        try {
            var msg, data;
            const { groupname, status } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                var group_check = await SysUserGroup.find({ name: groupname });
                if (group_check.length > 0) {
                    data = '';
                    msg = 'User Group is Already There!';
                } else {
                    const user_group = new SysUserGroup({ name: groupname, status });
                    if (user_group.save()) {
                        data = '';
                        msg = 'User Group Added Successfully!';
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
    checkRolePermissions: async (req, res) => {
        var data = [];
        var sys_group_id = req.body.sys_group_id;
        var group_permissions = await SysGroupPermission.find({ sys_group_id });
        msg = 'group permissions!';
        return respondWithSuccess(req, res, msg, group_permissions, 200);
        
    },
    buildPermissions: async (req, res) => {
        var data = req.body; // All data from ajax call
        var build_permissions = [], backup_old_permissions = [], new_permissions = [], msg,status_code;
        if (req.body.create) {
            req.body.create.forEach((create_routes, index) => {
                build_permissions.push(create_routes);
            });
        }
        if (req.body.view) {
            req.body.view.forEach((view_routes, index) => {
                build_permissions.push(view_routes);
            });
        }
        if (req.body.update) {
            req.body.update.forEach((update_routes, index) => {
                build_permissions.push(update_routes);
            });
        }
        if (req.body.delete) {
            req.body.delete.forEach((delete_routes, index) => {
                build_permissions.push(delete_routes);
            });
        }
        build_permissions.forEach((permission, index) => { // All permissions from ajax call
            new_permissions[index] = {
                sys_group_id: req.body.sys_group_id,
                route: permission.split(' ')[0],
                method: permission.split(' ')[1],
                p_id : permission.split(' ')[2],
                created_by: {
                    id: req.user.id,
                    name: req.user.name,
                    sys_group_id: req.user.sys_group_id
                }
            };
        });

        var old_permissions = await SysGroupPermission.find({}); // All permissions from database before delete all
        backup_old_permissions.push(old_permissions); // backup db permissions
        var delete_many = await SysGroupPermission.deleteMany({sys_group_id : req.body.sys_group_id}); // Delete all permissions before store new permissions
        if (delete_many) {
            var bulk_import = await SysGroupPermission.insertMany(new_permissions); // bulk import new permissions
            if (bulk_import) {
                msg = 'New permission is set successfully !';
                status_code = 200;
            } else {
                var bulk_insert = await SysGroupPermission.insertMany(backup_old_permissions);
                if (bulk_insert) {
                    msg = 'Permission is set from backup successfully !';
                    status_code = 200;
                }else{
                    msg = 'Something went wrong ! No permissions are set !';
                    status_code = 500;
                    return respondWithError(req, res, msg, new_permissions, status_code);
                }
            }
        }
        return respondWithSuccess(req, res, msg, new_permissions, status_code);
    },
    userGroupDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await SysUserGroup.count({});
            var recordsFiltered;

            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'name': regex }] };
                var user_groups = await SysUserGroup.find(searchStr, '_id sys_group_id name status createdAt updatedAt').sort({ 'createdAt': -1 });
                recordsFiltered = await SysUserGroup.count(searchStr);
            } else {
                searchStr = {};
                var user_groups = await SysUserGroup.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [];
            var nestedData = {};
            if (user_groups) {
                var sl = 0;
                user_groups.map((user_group, i) => {
                    var status;
                    if (user_group['status'] === 1) {
                        status = "<span class='label label-success'>Active</span>";
                    } else if (user_group['status'] === 0) {
                        status = "<span class='label label-danger'>Inactive</span>";
                    }

                    var action = "<a data-toggle='modal' data-target='#group_permissions_modal' data-backdrop='static' data-keyboard='false' class='btn-primary btn btn-rounded permission_modal' data-sys_group_id='" + user_group['sys_group_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-lock'></i></a>";
                    nestedData = {
                        _id: user_group['_id'],
                        name: user_group['name'],
                        status,
                        createdAt: new Date(user_group['createdAt']),
                        updatedAt: user_group['updatedAt'],
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
            return res.status(500).json({ msg: err.message })
        }
    },
}
// function convertUTCDateToLocalDate(date) {
//     var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

//     var offset = date.getTimezoneOffset() / 60;
//     var hours = date.getHours();

//     newDate.setHours(hours - offset);

//     return newDate;   
// }
module.exports = UserGroupController;