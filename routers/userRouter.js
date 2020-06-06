const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// instantiating the express user router
const router = express.Router();

// signing up users
router.route('/signup').post(authController.signUp);
// logging users in
router.route('/login').post(authController.login);
// forgot password
router.route('/forgotPassword').post(authController.forgotPassword);
// reset password
router.route('/resetPassword/:token').patch(authController.resetPassword);

// get all the users
router.route('/').get(userController.getAllUsers);


module.exports = router;

/*

to authenticate and authorize a given route:


http_method('/route', authController.protectRoute, authController.restrictTo('admin'), routeHandler);

protectRoute will only allow logged in user to access the route
restrictTo will restrict the route to the user roles that has been passed

*/
