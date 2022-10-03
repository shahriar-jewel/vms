const router = require('express').Router();
const UserController = require('../controllers/admin/UserController');
const MenuController = require('../controllers/admin/role/MenuController');
const UserGroupController = require('../controllers/admin/role/UserGroupController');
const PermissionController = require('../controllers/admin/role/PermissionController');
const PurposeController = require('../controllers/admin/PurposeController');
const VisitorController = require('../controllers/admin/VisitorController');
const ReportController = require('../controllers/admin/ReportController');
const Auth = require('../middlewares/Auth');
const CheckPermission = require('../middlewares/CheckPermission');
const expressListRoutes = require('express-list-routes');
const { check, validationResult } = require('express-validator');

// User registration & login
router.get('/', UserController.login);
router.post('/login', UserController.login);
router.post('/register', UserController.register);


router.get('/accept-deny', UserController.acceptDeny);

// Admin routes starts
router.get('/dashboard', [Auth, CheckPermission('/admin/dashboard'), UserController.dashboard]);
router.get('/test', [Auth, CheckPermission('/admin/test'), UserController.test]);
router.get('/test2', [Auth, UserController.test2]);
router.post('/logout', [UserController.logout]);

// Routes for Permission Menu Management
router
    .route('/permissions/menu')
    .get([Auth, CheckPermission('/admin/permissions/menu'), MenuController.index])
    .post([
        Auth, CheckPermission('/admin/permissions/menu'),
        check('title').not().isEmpty().withMessage('Title field is required!'),
        MenuController.store
    ]);

router.get('/permissions/menu-datatable-ajax', [Auth, CheckPermission('/admin/permissions/menu-datatable-ajax'), MenuController.menuDatatableAjax]);
// Routes for User-group Management
router
    .route('/user-groups')
    .get([Auth, CheckPermission('/admin/user-groups'), UserGroupController.index])
    .post([
        Auth, CheckPermission('/admin/user-groups'),
        check('groupname').not().isEmpty().withMessage('Group name field is required !'),
        UserGroupController.store
    ]);
router.get('/user-group/datatable-ajax', [Auth, CheckPermission('/admin/user-group/datatable-ajax'), UserGroupController.userGroupDatatableAjax]);

// Routes for Permission Management
router
    .route('/permissions')
    .get([Auth, CheckPermission('/admin/permissions'), PermissionController.index])
    .post([
        Auth, CheckPermission('/admin/permissions'),
        check('name').not().isEmpty().withMessage('Permission name field is required !'),
        check('route').not().isEmpty().withMessage('Route field is required !'),
        PermissionController.store
    ]);
router.get('/permissions/datatable-ajax', [Auth, CheckPermission('/admin/permissions/datatable-ajax'), PermissionController.permissionDatatableAjax]);
router.post('/permissions/check-role-permissions', [Auth, CheckPermission('/admin/permissions/check-role-permissions'), UserGroupController.checkRolePermissions]);
router.post('/permissions/build-permissions', [Auth, CheckPermission('/admin/permissions/build-permissions'), UserGroupController.buildPermissions]);

// visitor routes
router
    .route('/visitor')
    .get([Auth, CheckPermission('/admin/visitor'), VisitorController.index])
    .post([
        Auth, CheckPermission('/admin/visitor'),
        VisitorController.store
    ]);
router.get('/visitor/datatable-ajax', [Auth, CheckPermission('/admin/visitor/datatable-ajax'), VisitorController.visitorDatatableAjax]);
router.post('/visitor/meeting-checkout', [Auth, CheckPermission('/admin/visitor/meeting-checkout'), VisitorController.meetingCheckout]);
router.post('/visitor/member-availability-check', [Auth, CheckPermission('/admin/visitor/member-availability-check'), VisitorController.memberAvailability]);
router.post('/visitor/view-guest', [Auth, CheckPermission('/admin/visitor/view-guest'), VisitorController.viewGuest]);
// purpose routes
router
    .route('/purpose')
    .get([Auth, CheckPermission('/admin/purpose'), PurposeController.index])
    .post([
        Auth, CheckPermission('/admin/purpose'),
        check('purpose').not().isEmpty().withMessage('Purpose field is required !'),
        PurposeController.store
    ]);
router.get('/purpose/datatable-ajax', [Auth, CheckPermission('/admin/purpose/datatable-ajax'), PurposeController.purposeDatatableAjax]);
// reports route
router.get('/report/module',[Auth, CheckPermission('/admin/report/module'), ReportController.index]);
router.get('/report/general',[Auth, CheckPermission('/admin/report/general'), ReportController.generalReport]);
router.post('/report/general/ajax',[Auth, CheckPermission('/admin/report/general/ajax'), ReportController.generalReportAjax]);
router.get('/report/member',[Auth, CheckPermission('/admin/report/member'), ReportController.memberReport]);
router.post('/report/member/ajax',[Auth, CheckPermission('/admin/report/member/ajax'), ReportController.memberReportAjax]);


module.exports = router;