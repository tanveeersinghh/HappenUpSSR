const express = require('express');
const { body } = require('express-validator');

// const isAuth = require('../middleware/is-auth');
const authController = require('../controllers/auth');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/signup', authController.getSignup);

router.get('/login', authController.getLogin);

//PUT /auth/signup
router.post(
	'/signup',
	[
		//Add custom validator to see if email already exists
		body('email')
			.isEmail()
			.withMessage('Please Enter a valid email')
			.isLength({ max: 50 })
			.custom((value, { req }) => {
				return User.findByEmail(value).then(([rows, data]) => {
					console.log(rows.length, rows);
					if (rows.length > 0) {
						console.log('ehllo');
						return Promise.reject(
							'Email exists already, please use a different one!'
						);
					}
				});
			}),
		// .withMessage('Email already exists!'),
		body('password', 'Please enter a password with minimum 5 characters')
			.trim()
			.isLength({ min: 5, max: 50 }),
	],
	authController.signup
);

//POST /auth/login
router.post('/login', authController.login);

router.post('/logout',isAuth , authController.postLogout);


module.exports = router;
