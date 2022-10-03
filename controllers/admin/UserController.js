const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const SysMenu = require('../../model/role/SysMenu');
const User = require('../../model/UserModel');
const axios = require('axios');
const {todayVisitorProvider,weekVisitorProvider,monthVisitorProvider} = require('../admin/DashboardController');

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
            const { name, email, password,mobile, sys_group_id, sys_group_name,membership_id, status } = req.body;
            if (name == '' || email == '' || password == '' || sys_group_id == '' || mobile == '' || sys_group_name == '' || membership_id == '') {
                return res.json('Fillup all the fields!');
                // req.flash('msg', 'Fillup all the fields!');
                // return res.redirect('/user/create');
            }

            const user = await User.findOne({ email });
            if (user) {
                // req.flash('msg', 'User already exists!');
                // return res.redirect('/user/create');
                return res.json('User already exists!');
            }

            if (password.length < 6) {
                // req.flash('msg', 'Password is at least 6 characters long.!');
                // return res.redirect('/user/create');
                return res.json('Password is at least 6 characters long.!');
            }

            // await User.updateMany(
            //     {"sys_group" : {$exists : false}},
            //     { $set:{sys_group:{id:1,name:"Superadmin"}}});

            // Password Encryption
            const passwordHash = bcrypt.hashSync(password);

            const newUser = new User({
                name,
                email,
                mobile,
                membership_id,
                password: passwordHash,
                sys_group: {
                    id: sys_group_id,
                    name: sys_group_name
                },
                status: 1
            })

            // Save mongodb
            await newUser.save()
            // req.flash('msg', 'User added successfully!');
            // return res.redirect('/user');
            return res.json('User added successfully!');

            // Then create jsonwebtoken to authentication
            // const accesstoken = createAccessToken({ id: newUser._id })
            // const refreshtoken = createRefreshToken({ id: newUser._id })

            // res.cookie('refreshtoken', refreshtoken, {
            //     httpOnly: true,
            //     path: '/api/refresh_token',
            //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
            // })

            // res.json({ accesstoken })

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    dashboard: async (req, res) => {
        try{
        var today_visitor,today_visitor_count,week_visitor,week_visitor_count,month_visitor,month_visitor_count;
        today_visitor = await todayVisitorProvider();
        week_visitor = await weekVisitorProvider();
        month_visitor = await monthVisitorProvider();
        today_visitor_count = today_visitor.length;
        week_visitor_count = week_visitor.length;
        month_visitor_count = month_visitor.length;
        // return res.send(week_visitor);
        return res.render('admin/dashboard',{today_visitor_count,week_visitor_count,month_visitor_count});
        }catch(err){
            return res.send(200).json({msg : err.message});
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
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

module.exports = UserController;