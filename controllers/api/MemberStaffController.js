const MemberStaffProvider = require('../api/providers/MemberStaffProvider');
const { respondWithError, respondWithSuccess } = require('../../controllers/admin/ResponseController');

const MemberStaffController = {
    getMemberStaff: async (req, res) => {
        try {
            const data = await MemberStaffProvider.get();
            return respondWithSuccess(req, res, msg = 'Member Staff data',data, 200);
        } catch (err) {
            return respondWithError(req, res, msg = 'Something went wrong!',data='', 200);
        }
    }
}

module.exports = MemberStaffController;