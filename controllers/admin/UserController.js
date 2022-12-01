const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const SysMenu = require('../../model/role/SysMenu');
const User = require('../../model/UserModel');
const axios = require('axios');
const { todayVisitorProvider, weekVisitorProvider, monthVisitorProvider, memberCountProvider, affiliatedCountProvider, guestCountProvider, othersCountProvider } = require('../admin/DashboardController');
const SysUserGroup = require('../../model/role/SysUserGroup');
const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('./ResponseController');

const UserController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (req.method == 'GET') return res.render('login', { message: req.flash('msg') });
            if (email === '' || password === '') {
                req.flash('msg', 'Email & Password is required!');
                return res.redirect('..');
            }
            const user = await User.findOne({ email });
            if (!user) {
                req.flash('msg', 'User does not exist!');
                return res.redirect('..');
            }
            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                req.flash('msg', 'Incorrect Password!');
                return res.redirect('..');
            }
            const accesstoken = createAccessToken({ id: user._id, sys_group: user.sys_group, name: user.name });
            res.cookie('accesstoken', accesstoken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
            });
            return res.redirect('/admin/dashboard');
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    logout: async (req, res) => { // backend logout
        try {
            res.clearCookie('accesstoken')
            return res.redirect('/');
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    register: async (req, res) => {
        try {
            const { name, mobile, email, role, password, confirm_password, status } = req.body;
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors = errors.array();
                msg = 'Validation Error';
                return respondWithError(req, res, msg, errors, 422);
            } else {
                const user = await User.findOne({ email });
                if (user) {
                    return respondWithError(req, res, 'User already exists!', errors = [], 422);
                }

                if (password.length < 6) {
                    return respondWithError(req, res, 'Password is at least 6 characters long.!', errors = [], 422);
                }

                if (!(password === confirm_password)) {
                    return respondWithError(req, res, 'Password & Confirm password do not match.!', errors = [], 422);
                }
                const passwordHash = bcrypt.hashSync(password);
                const newUser = new User({
                    name,
                    email,
                    mobile,
                    password: passwordHash,
                    sys_group: {
                        id: role.split('(')[0],
                        name: role.split('(')[1]
                    },
                    status: 1
                });
                // Save mongodb
                await newUser.save();
                return respondWithSuccess(req, res, 'User added successfully!', data = '', 200);
            }

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    index: async (req, res) => {
        var user_groups = await SysUserGroup.find({ status: 1 });
        return res.render('admin/role/user/index', { user_groups });
    },
    edit: async (req, res) => {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return respondWithError(req, res, 'User not found.!', errors = [], 422);
        return respondWithSuccess(req, res, 'User data!', data = user, 200);
    },
    update: async (req, res) => {
        const { name, mobile, email, role, hidden_user_id, password, confirm_password, status } = req.body;
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            errors = errors.array();
            msg = 'Validation Error';
            return respondWithError(req, res, msg, errors, 422);
        } else {
            const isUpdate = await User.updateOne(
                { _id: hidden_user_id },
                {
                    $set: { name, mobile, email, 'sys_group.id': role.split('(')[0], 'sys_group.name': role.split('(')[1] }
                }
            )
            if (!isUpdate.ok) return respondWithError(req, res, 'Do not update the record. Something went wrong!', errors, 422);
            return respondWithSuccess(req, res, 'User updated successfully!', data = '', 200);
        }
    },
    userDatatableAjax: async (req, res) => {
        try {
            var searchStr = req.query.search['value'];
            var limit = req.query.length;
            var recordsTotal = await User.count({});
            var recordsFiltered;

            if (searchStr) {
                var regex = new RegExp(searchStr, "i");
                searchStr = { $or: [{ 'name': regex }, { 'email': regex }, { 'mobile': regex }, { 'sys_group.name': regex }] };
                var users = await User.find(searchStr).sort({ 'createdAt': -1 });
                recordsFiltered = await User.count(searchStr);
            } else {
                searchStr = {};
                var users = await User.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
                recordsFiltered = recordsTotal;
            }

            var data = [];
            var nestedData = {};
            if (users) {
                var sl = 0;
                users.map((user, i) => {
                    var status;
                    if (user['status'] === 1) {
                        status = "<span class='label label-success'>Active</span>";
                    } else if (user['status'] === 0) {
                        status = "<span class='label label-danger'>Inactive</span>";
                    }

                    var action = "<a data-toggle='modal' data-target='#user_modal' id='editUser' data-backdrop='static' data-keyboard='false' class='btn-primary btn btn-rounded user_modal' data-user_id='" + user['_id'] + "' style='padding:0px 4px;' href='#'><i class='glyphicon glyphicon-edit'></i></a>";
                    nestedData = {
                        name: user['name'],
                        email: user['email'],
                        mobile: user['mobile'],
                        role: user['sys_group']['name'],
                        status,
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
    dashboard: async (req, res) => {
        try {
            var today_visitor, today_visitor_count, week_visitor, week_visitor_count, month_visitor, month_visitor_count, member_count, affiliated_count, guest_count, others_count;
            today_visitor = await todayVisitorProvider();
            week_visitor = await weekVisitorProvider();
            month_visitor = await monthVisitorProvider();
            member_count = await memberCountProvider();
            affiliated_count = await affiliatedCountProvider();
            guest_count = await guestCountProvider();
            others_count = await othersCountProvider();
            today_visitor_count = today_visitor.length;
            week_visitor_count = week_visitor.length;
            month_visitor_count = month_visitor.length;
            // return res.send(week_visitor);
            return res.render('admin/dashboard', { today_visitor_count, week_visitor_count, month_visitor_count, member_count,affiliated_count,guest_count,others_count });
        } catch (err) {
            return res.send(200).json({ msg: err.message });
        }
    },
    test2: async (req, res) => { // sms send test
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const obj = {
            id: '3wsd12qai7845362hd',
            name: 'Tasnia Tahsin Nujhat',
            mobile: '01700704436',
            address: 'Mirpur DOHS'
        };

        var sms = obj['name'].split(' ')[0] + " came to visit you.\n";
        sms += "Name : " + obj['name'] + "\n";
        sms += "Mobile: " + obj['mobile'] + "\n";
        sms += "Address: " + obj['address'] + "\n";
        sms += "***Cadet College Club***" + "\n";
        // sms += '<a href="">"Click below link for Accept or Decline"</a>';
        sms += new URL('https://www.youtube.com/' + obj['id']);

        const message = encodeURIComponent(sms);
        // const message1 = JSON.stringify(obj);
        const smsRes = await axios.get('http://103.9.185.211/smsSendApi.php?mobile=' + obj['mobile'] + '&message=' + message + '&cli=CARCOPOLO');
        console.log(smsRes.data);
        // console.log("OTP: " + otp);
    },
    acceptDeny: async (req, res) => { // Meeting accept or decline
        return res.render('admin/test');
    },
    test: async (req, res) => {
        try {
            // var root_menus = await SysMenu.find({}).where('parent_id').equals(null);

            var root_menus = [
                {
                    _id: "62ffde9b10ce8be607faa58e",
                    parent_id: null,
                    title: "Back Office",
                    url: "",
                    alt_title: "back office",
                    description: "description",
                    icon: "glyphicon glyphicon-th",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:03:55.077Z",
                    updatedAt: "2022-08-19T19:03:55.077Z",
                    __v: 0
                },
                {
                    _id: "62ffdf2110ce8be607faa5a3",
                    parent_id: null,
                    title: "Product Information",
                    url: "",
                    alt_title: "product information",
                    description: "",
                    icon: "glyphicon glyphicon-th",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:06:09.064Z",
                    updatedAt: "2022-08-19T19:06:09.064Z",
                    __v: 0
                }
            ];

            // var all_menus = await SysMenu.find({});

            var all_menus = [
                {
                    _id: "62ffde9b10ce8be607faa58e",
                    parent_id: null,
                    title: "Back Office",
                    url: "",
                    alt_title: "back office",
                    description: "description",
                    icon: "glyphicon glyphicon-th",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:03:55.077Z",
                    updatedAt: "2022-08-19T19:03:55.077Z",
                    __v: 0
                },
                {
                    _id: "62ffdedf10ce8be607faa595",
                    parent_id: "62ffde9b10ce8be607faa58e",
                    title: "Permission Management",
                    url: "/admin/permissions/menu",
                    alt_title: "permission management",
                    description: "description",
                    icon: "glyphicon glyphicon-lock",
                    order: 10,
                    status: 1,
                    createdAt: "2022-08-19T19:05:03.276Z",
                    updatedAt: "2022-08-19T19:05:03.276Z",
                    __v: 0
                },
                {
                    _id: "62ffdf0710ce8be607faa59c",
                    parent_id: "62ffde9b10ce8be607faa58e",
                    title: "Group Permission Management",
                    url: "/admin/permissions",
                    alt_title: "group permission",
                    description: "",
                    icon: "glyphicon glyphicon-signal",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:05:43.892Z",
                    updatedAt: "2022-08-19T19:05:43.892Z",
                    __v: 0
                },
                {
                    _id: "62ffdf2110ce8be607faa5a3",
                    parent_id: null,
                    title: "Product Information",
                    url: "",
                    alt_title: "product information",
                    description: "",
                    icon: "glyphicon glyphicon-th",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:06:09.064Z",
                    updatedAt: "2022-08-19T19:06:09.064Z",
                    __v: 0
                },
                {
                    _id: "62ffe013cad59fcd816a3854",
                    parent_id: "62ffdf2110ce8be607faa5a3",
                    title: "All Products",
                    url: "/admin/permissions",
                    alt_title: "all products",
                    description: "",
                    icon: "glyphicon glyphicon-download",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:10:11.778Z",
                    updatedAt: "2022-08-19T19:10:11.778Z",
                    __v: 0
                },
                {
                    _id: "62ffe4014146b7c0ec164be3",
                    parent_id: "62ffdedf10ce8be607faa595",
                    title: "menu Permission",
                    url: "",
                    alt_title: "",
                    description: "",
                    icon: "glyphicon glyphicon-th",
                    order: 999,
                    status: 1,
                    createdAt: "2022-08-19T19:26:57.940Z",
                    updatedAt: "2022-08-19T19:26:57.940Z",
                    __v: 0
                }
            ];

            return res.json(dfs(all_menus, root_menus));
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
        // res.render('admin/test');
    }
}
var dfs = (all_menus, root_menus) => {

    root_menus.forEach((root_menu, index) => {

        root_menu['children'] = all_menus.filter(element => element.parent_id === root_menu._id);
        if (root_menu['children']) {
            dfs(all_menus, root_menu['children']);
        }
    });

    return root_menus;
}

const createAccessToken = (user) => {
    return jwt.sign(user, '37KV?w<P*mNR#K{9eK:N&/r@N=Rr#Y}8F,468/*g[jtVHW&Kbs', { expiresIn: '7d' });
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

module.exports = UserController;