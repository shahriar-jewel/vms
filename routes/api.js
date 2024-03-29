const router = require('express').Router();
const VisitorController = require('../controllers/api/VisitorController');
const LoginController = require('../controllers/api/LoginController');
const VisitPlaceController = require('../controllers/api/VisitPlaceController');
const ClubController = require('../controllers/api/ClubController');
const MemberStaffController = require('../controllers/api/MemberStaffController');
const apiauth = require('../middlewares/ApiAuth');
const { check } = require('express-validator');

router.post('/access-token', LoginController.accessToken);
router.get('/logout', LoginController.logout);
router.get('/refresh-token', LoginController.refreshToken);
router.get('/visit-place', apiauth,VisitPlaceController.getVisitPlace);
router.get('/club', apiauth,ClubController.getClub);
router.get('/member-staff', apiauth,MemberStaffController.getMemberStaff);
router.get('/loggedin-user', apiauth, LoginController.getLoggedinUser);

router.post('/visitor-payload', apiauth, VisitorController.getVisitorPayload);
router.post('/other/is-available', apiauth, VisitorController.getOtherData);
router.post('/search-with-mobile', apiauth, VisitorController.searchWithMobile);

module.exports = router;