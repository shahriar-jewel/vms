const jwt = require('jsonwebtoken');
const SysGroupPermission = require('../model/role/SysGroupPermission');

const CheckPermission = (url) => {
    return  async (req, res, next) => {
        try {
            const routes = await SysGroupPermission.find({}).select('route method sys_group_id');
            const sys_group_id = req.user.sys_group.id;
            var flag = false;

            for(var i = 0; i < routes.length; i++){
                if(routes[i]['route'] === url && routes[i]['method'] === req.method && routes[i]['sys_group_id'] == sys_group_id ){
                    flag = true;
                    break;
                }
            }
            if(flag){
                return next();
            }else{
                return res.render('admin/role/usergroup/page401');
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = CheckPermission;