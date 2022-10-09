const VisitPlaceProvider = require('../api/providers/VisitPlaceProvider');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');

const VisitPlaceController = {
    getVisitPlace : async (req,res) => {
        const data = await VisitPlaceProvider.get(); // get all the visit places
        return respondWithSuccess(req,res,msg='all visit places',data,200);
    },
}
module.exports = VisitPlaceController;