const VisitPlaceModel = require('../../../model/VisitPlaceModel');

const VisitPlaceProvider = {
    get : async (req,res) => {
        const data = await VisitPlaceModel.find({status : 1});
        return data;
    },
}
module.exports = VisitPlaceProvider;