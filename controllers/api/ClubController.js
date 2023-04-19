const ClubProvider = require('../api/providers/ClubProvider');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');

const ClubController = {
    getClub : async (req,res) => {
        const data = await ClubProvider.get(); // get all the clubs
        return respondWithSuccess(req,res,msg='all club name',data,200);
    },
}
module.exports = ClubController;