const ClubModel = require('../../../model/ClubModel');

const ClubProvider = {
    get : async (req,res) => {
        const data = await ClubModel.find({status : 1});
        return data;
    },
}
module.exports = ClubProvider;