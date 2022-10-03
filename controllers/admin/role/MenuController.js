const { check, validationResult } = require('express-validator');
const { respondWithError, respondWithSuccess } = require('../ResponseController');
const SysMenu = require('../../../model/role/SysMenu');
const all_routes = require('express-list-endpoints');

const MenuController = {
    index: async (req, res) => {
        try {
            const routes = all_routes(require('../../../routes/web'));
            var all_route = [];

            routes.forEach((route, index) => {
                if (route['methods'].includes('GET') &&
                    ((Array.isArray(route['middlewares']) && route['middlewares'].includes('Auth'))) ||
                    (!Array.isArray('middlewares') && route['middlewares'] === 'Auth')) {
                    all_route[index] = '/admin' + route['path'];
                }
            });

            var filtered_routes = all_route.filter((route) => {
                return route != null;
            })
            const menus = await SysMenu.find().where('status').equals('1').select('_id parent_id submenu title');
            // var arr = [], temp1,temp2,menu_arr = [];
            // menus.forEach((menu, index) =>{
            //       temp1 = {
            //         title : menu['title'],
            //         parent_id : menu['parent_id']
            //     };
            //     if(menu['submenu']){
            //         menu['submenu'].forEach((submenu,i) =>{
            //           arr[i] = {
            //             title : submenu['title'],
            //             parent_id : submenu['parent_id']
            //           };
            //         });
            //     }
            //     menu_arr[index] =  [temp1].concat(arr);
            // })
            // return res.json(menu_arr);
            return res.render('admin/role/menu/index', { all_route: filtered_routes, menus });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    store: async (req, res) => {
        try {
            const { parent_id, title, alt_title, icon, order, url, uri, description, status } = req.body;
            var menu_data = {
                parent_id, title, alt_title, icon, order, url, description, status
            };
            const menu_object = new SysMenu(menu_data);
            if (menu_object.save()) {
                const data = '';
                const msg = 'Menu Saved Successfully!';
                return respondWithSuccess(req, res, msg, menu_object, 200);
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    // store: async(req, res) => {
    //     try {
    //         const { parent_id, title, alt_title, icon, order, url, uri, description, status } = req.body;
    //         let errors = validationResult(req);
    //         if (!errors.isEmpty()) {
    //             errors = errors.array();
    //             const msg = 'Validation Error';
    //             return respondWithError(req, res, msg, errors, 422);
    //         } else {
    //             var menu = {
    //                 parent_id: parent_id,
    //                 title: title,
    //                 alt_title: alt_title,
    //                 icon: icon,
    //                 order: order,
    //                 url: url,
    //                 description: description,
    //                 status: status
    //             };
    //             const menu_object = new SysMenu(menu);
    //             if (typeof parent_id === 'undefined') {
    //                 if (menu_object.save()) {
    //                     const data = '';
    //                     const msg = 'Menu Saved Successfully!';
    //                     return respondWithSuccess(req, res, msg, data, 200);
    //                 }
    //             } else {
    //                 const menu_data = await SysMenu.findById({ _id: parent_id });
    //                 var submenu = [];
    //                 if (menu_data && menu_data['submenu'].length === 0) {
    //                     submenu = [menu];
    //                 } else {
    //                     submenu = [menu].concat(menu_data['submenu']);
    //                 }
    //                 const flag = await SysMenu.findOneAndUpdate({ '_id': parent_id }, { '$set': { submenu } });
    //                 // console.log(flag);
    //             }
    //         }
    //     } catch (err) {
    //         return res.status(500).json({ msg: err.message });
    //     }
    // },
    menuDatatableAjax: async (req, res) => {
        var searchStr = req.query.search['value'];
        var limit = req.query.length;
        var recordsTotal = await SysMenu.count({});
        var recordsFiltered;

        if (searchStr) {
            var regex = new RegExp(searchStr, "i");
            searchStr = { $or: [{ 'title': regex }, { 'url': regex }] };
            var menus = await SysMenu.find(searchStr, '_id title parent_id url icon').sort({ 'createdAt': -1 });
            recordsFiltered = await SysMenu.count(searchStr);
        } else {
            searchStr = {};
            var menus = await SysMenu.find({}).limit(Number(req.query.length)).skip(Number(req.query.start)).sort({ 'createdAt': -1 });
            recordsFiltered = recordsTotal;
        }

        var data = [];
        var nestedData = {};
        if (menus) {
            var sl = 0;
            menus.map((menu, i) => {
                // var status;
                // if (menu['status'] === 1) {
                //     status = "<span class='label label-success'>Active</span>";
                // } else if (menu['status'] === 0) {
                //     status = "<span class='label label-success'>Inactive</span>";
                // }

                var action = "<a class='btn-primary btn btn-rounded' id='edit' data-id='" + menu['_id'] + "' style='padding:0px 4px;' href='#'><i class='fa fa-edit'></i></a>";
                nestedData = {
                    _id: menu['_id'],
                    title: menu['title'],
                    parent_id: menu['parent_id'] === null ? '--:--' : menu['parent_id'],
                    url: menu['url'] === '' ? '--:--' : menu['url'],
                    icon: "<i style='color:gray;' class='"+menu['icon']+"'></i>",
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
        res.send(mytable);
    }
}
module.exports = MenuController;