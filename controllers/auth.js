const util = require('util');
const crypto = require('crypto');

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

require('dotenv').config();

exports.getSignup = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Sign Up',
		errorMessage: message,
		oldInput: {
			email: '',
			password: '',
			confirmPassword: '',
		},
		validationErrors: [],
	});
};

exports.signup = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const confirmPassword = req.body.confirmPassword;

	const errors = validationResult(req);
	console.log(errors);
	if (!errors.isEmpty()) {
		// const error = new Error('Validation Failed');
		// error.statusCode = 422;
		// error.data = errors.array();
		// throw error;
		// console.log(errors.array());
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Sign Up',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				email: email,
				password: password,
				confirmPassword: req.body.confirmPassword,
			},
			validationErrors: errors.array(),
		});
	}

	if (password !== confirmPassword) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Sign Up',
			errorMessage: "Passwords don't match",
			oldInput: {
				email: email,
				password: '',
				confirmPassword: '',
			},
			validationErrors: [
				{ param: 'password' },
				{ param: 'confirmPassword' },
			],
		});
	}

	// User.findByEmail(email).then(([rows, data]) => {
	// 	const errors = validationResult(req);

	// 	if (rows.length > 0) {
	// 		return res.status(422).render('auth/signup', {
	// 			path: '/signup',
	// 			pageTitle: 'Sign Up',
	// 			errorMessage: 'Email already exists!',
	// 			oldInput: {
	// 				email: email,
	// 				password: password,
	// 				confirmPassword: req.body.confirmPassword,
	// 			},
	// 			validationErrors: [],
	// 		});
	// 	}
	// 	let randomToken;
	// 	const randomBytes = util.promisify(crypto.randomBytes);
	// })
	console.log('should not run');
	let randomToken;
	const randomBytes = util.promisify(crypto.randomBytes);
	randomBytes(20)
		.then((buffer) => {
			randomToken = buffer.toString('hex');
			return bcrypt.hash(password, 12);
		})
		.then((hashedPassword) => {
			//groupId is null when signing up
			const user = new User(randomToken, email, hashedPassword, null);
			return user.save();
		})
		.then((result) => {
			res.redirect('/auth/login');
		})
		.catch((err) => {
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			}
		});
};

exports.getLogin = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		errorMessage: message,
		oldInput: {
			email: '',
			password: '',
		},
		validationErrors: [],
	});
};

exports.login = (req, res, next) => {
	const errors = validationResult(req);

	const email = req.body.email;
	const password = req.body.password;
	let user;
	let flag = false;

	User.findByEmail(email)
		.then(([rows, data]) => {
			console.log('in post login', rows);

			if (rows.length <= 0) {
				flag = true;
				return res.status(422).render('auth/login', {
					path: '/login',
					pageTitle: 'Login',
					errorMessage: 'Invalid email',
					oldInput: {
						email: email,
						password: password,
					},
					validationErrors: [{ param: 'email' }],
				});
			}
			user = rows[0];
			console.log('this should not run');
			// return bcrypt.compare(password, user.password);

			return bcrypt.compare(password, user.password);
		})
		.then((isEqual) => {
			if (flag === true) {
				return;
			}
			if (!isEqual) {
				return res.status(422).render('auth/login', {
					path: '/login',
					pageTitle: 'Login',
					errorMessage: 'Invalid password',
					oldInput: {
						email: email,
						password: password,
					},
					validationErrors: [{ param: 'password' }],
				});
			}
			//creating jwt token
			// const token = jwt.sign(
			// 	{
			// 		email: user.email,
			// 		userId: user.userId,
			// 	},
			// 	process.env.jwt_secret,
			// 	{ expiresIn: '24h' }
			// );

			req.session.isLoggedIn = true;
			req.session.userId = user.userId;
			return req.session.save((err) => {
				if (err) {
					err.message =
						'Could not save password due to server outage';
					return next(err);
				}
				return res.redirect('/');
			});

			// //in frontend we look for the user id and store it
			// res.status(200).json({
			// 	token: token,
			// 	userId: user.userId,
			// });
		})
		.catch((err) => {
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			}
		});
};

exports.postLogout = (req, res, next) => {
	delete req.session.isLoggedIn;
	delete req.session.userId;
	res.redirect('/');
};
