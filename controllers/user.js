const util = require('util');
const crypto = require('crypto');

const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const bcrypt = require('bcryptjs');

const Event = require('../models/event');
const User = require('../models/user');
const Group = require('../models/group');
const Society = require('../models/society');

const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport(
	sendgridTransport({
		auth: {
			//value to be obtained from sendgrid account (settings->api key->create new. added node-shop as name (one time))
			api_key: process.env.API_KEY,
		},
	})
);

exports.getEvents = (req, res, next) => {
	let groupId;
	let societyId;
	let events;
	let societyName;

	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				// The 401 (Unauthorized) status code indicates that the request has not been applied because it lacks valid authentication credentials for the target resource
				//flash with msg to main page
				error.statusCode = 401;
				const error = new Error('The required userId does not exist');
				throw error;
			}

			groupId = rows[0].groupId;
			if (groupId === null) {
				// Page showing No society found or create society
				const error = new Error('No society created by the user');
				error.statusCode = 403;
				next(error);
			}

			return Group.findSocietyIdByGroupId(groupId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			societyId = rows[0].societyId;
			return Event.findEventsBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			events = rows;
			return Society.findSocietyNameBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			societyName = rows[0].societyName;
			// res.status(200).json({
			// 	message: 'Fetched events sucessfully',
			// 	events: events,
			// 	societyName: societyName,
			// });
			return res.status(200).render('user/events', {
				pageTitle: 'User Events',
				path: '/user/events',
				events: events,
				societyName: societyName,
				societyId: societyId,
			});
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

exports.getCreateEvent = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	//can check if user is authorized to create event
	res.render('user/createEvent', {
		path: '/createEvent',
		pageTitle: 'Create Event',
		errorMessage: message,
		oldInput: {
			eventName: '',
			eventDesc: '',
			startDate: '',
			endDate: '',
		},
		validationErrors: [],
	});
};

//assuming rn that society and group are created
exports.createEvent = (req, res, next) => {
	let groupId;
	let loadedEvent;

	const eventName = req.body.eventName;
	//assuming frontend validation done
	const poster = req.file.path;
	console.log('poster:', poster);
	const eventDesc = req.body.eventDesc;
	const startDate = req.body.startDate;
	const endDate = req.body.endDate;
	let website;
	let discord;
	let societyId;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('user/createEvent', {
			path: '/createEvent',
			pageTitle: 'Create Event',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				eventName: eventName,
				eventDesc: eventDesc,
				startDate: startDate,
				endDate: endDate,
			},
			validationErrors: errors.array(),
		});
	}

	if (!req.file) {
		const error = new Error('No poster provided');
		error.statusCode = 422;
		throw err;
	}

	//we have req.userId available, now need to query db and find the societyId of the user who created event.
	//we have userId, need to find groupId of that user from users db, we can use the groupId to find societyId from groups db
	//Remember, we also need to fill groups db with dummy data, so that we can assume the groupId in user db is not null now

	// req.userId = 'fd29931b0ebfa36bf428e3ef07c6fd6ae76563b0';
	// console.log('create event post');
	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('No such user found');
				error.statusCode = 500;
				next(error);
			}
			groupId = rows[0].groupId;
			return Group.findSocietyIdByGroupId(groupId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			societyId = rows[0].societyId;
			//find website and discord from society
			//TEST
			return Society.findWebsiteAndDiscordBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			website = rows[0].website;
			discord = rows[0].discord;

			const event = new Event(
				societyId,
				eventName,
				poster,
				eventDesc,
				startDate,
				endDate,
				website,
				discord
			);
			loadedEvent = event;
			return event.save();
		})
		.then((result) => {
			return res.redirect('/user/events');
		})
		.catch((err) => {
			if (err) {
				next(err);
			}
		});
};

exports.getEditEvent = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	// const errors = validationResult(req);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).render('')
	// }

	const eventId = req.params.eventId;
	//get all event info

	Event.findEventByEventId(eventId)
		.then(([rows, data]) => {
			//throwing server err even when req.param is entered wrong, if someone else's event id is entered manually, then handle later
			// console.log('events:', rows);

			if (rows.length <= 0) {
				const error = new Error(
					'Wrong param entered in url, please dont enter url params manully'
				);
				error.statusCode = 404;
				next(error);
			}

			const event = rows[0];
			return res.render('user/editEvent', {
				//put societyId, eventId, website and discord in hidden inputs in form body in ejs file
				pageTitle: 'Edit Event',
				path: '/editEvent',
				errorMessage: message,
				oldInput: {
					eventName: event.eventName,
					eventDesc: event.eventDesc,
					startDate: event.startDate,
					endDate: event.endDate,
					poster: event.poster,
				},
				societyId: event.societyId,
				eventId: event.eventId,
				website: event.website,
				discord: event.discord,
				validationErrors: [],
			});
		})
		.catch((err) => {
			if (err) {
				next(err);
			}
		});
};

exports.editEvent = (req, res, next) => {
	//getting eventId and societyId from post request (added to frontend when loading events)
	const eventId = req.body.eventId;
	const societyId = req.body.societyId;
	const eventName = req.body.eventName;
	const poster = req.file.path;
	const eventDesc = req.body.eventDesc;
	const startDate = req.body.startDate;
	const endDate = req.body.endDate;
	const website = req.body.website;
	const discord = req.body.discord;
	let groupId;
	let event;

	console.log('societyId:', societyId);

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.render('user/editEvent', {
			//put societyId, eventId, website and discord in hidden inputs in form body in ejs file
			pageTitle: 'Edit Event',
			path: '/editEvent',
			errorMessage: errors.array()[0].message,
			oldInput: {
				eventName: eventName,
				eventDesc: eventDesc,
				startDate: startDate,
				endDate: endDate,
				poster: poster,
			},
			societyId: societyId,
			eventId: eventId,
			website: website,
			discord: discord,
			validationErrors: errors.array(),
		});
	}

	// if (req.file) {
	// 	poster = req.file.path;
	// }
	if (!poster) {
		const error = new Error('No poster picked');
		error.statusCode = 422;
		throw error;
	}

	Event.findEventByEventId(eventId)
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Could not find event');
				error.statusCode = 404;
				next(error);
			}

			event = rows[0];

			//if nothing retrieved from sql, internal error
			return Group.findGroupIdBySocietyId(societyId);
		})
		// if req.userId->groupId === event.societyId->groupId {true} else{return false msg}
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 404;
				next(error);
			}
			//event.societyId->groupId
			groupId = rows[0].groupId;
			// req.userId->groupId
			//if nothing retrieved from sql, internal error
			return User.findGroupIdByUserId(req.userId);
		})
		.then(([rows, data]) => {
			//checking if groupId of user who requested updation is equal to groupId of who created event
			if (groupId !== rows[0].groupId) {
				//see.. maybe show an error page or alert
				const error = new Error('Not authorized');
				error.statusCode = 403;
				next(error);
			}

			//means poster has changed
			if (poster !== event.poster) {
				//clear poster from server
				clearImage(event.poster);
			}

			return Event.update(
				eventId,
				eventName,
				poster,
				eventDesc,
				startDate,
				endDate,
				website,
				discord
			);
		})
		.then(([rows, data]) => {
			// console.log(rows);
			res.redirect('/user/events');
		})
		.catch((err) => {
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			}
		});

	// if req.userId->groupId=== event.societyId->groupId {true} else{return false msg}
};

exports.deleteEvent = (req, res, next) => {
	const eventId = req.body.eventId;
	const societyId = req.body.societyId;
	let groupId;
	let event;

	console.log('dlt evnet');

	Event.findEventByEventId(eventId)
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Could not find event');
				error.statusCode = 404;
				next(error);
			}
			event = rows[0];

			return Group.findGroupIdBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			//catch block will catch the error
			if (rows.length <= 0) {
				error.statusCode = 500;
				const error = new Error('The required groupId does not exist');
				throw error;
			}
			//event.societyId->groupId
			groupId = rows[0].groupId;
			// req.userId->groupId
			//if nothing retrieved from sql, internal error
			return User.findGroupIdByUserId(req.userId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				error.statusCode = 500;
				const error = new Error('The required groupId does not exist');
				throw error;
			}

			//checking if groupId of user who requested updation is equal to groupId of who created event
			if (groupId !== rows[0].groupId) {
				const error = new Error('Not authorized');
				error.statusCode = 403;
				next(error);
			}

			return Event.findByEventIdAndRemove(eventId);
		})
		.then((result) => {
			if (result.affectedRows <= 0) {
				error.statusCode = 500;
				const error = new Error('Event did not get deleted');
				throw error;
			}
			// console.log('see proper err handling here too, what if no event was deleted? what will we receive in result?:', result);
			clearImage(event.poster);

			console.log(res.locals.eventIsDeleted);
			res.locals.eventIsDeleted = true;
			return res.redirect('/user/events');
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

exports.getCreateSociety = (req, res, next) => {
	// console.log('hello');
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}

	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			//here we receive groupId as null, if userId is valid. but if userId is not a valid one, then we go to catch block.
			groupId = rows[0].groupId;
			//causing errors, that below code executing too
			if (groupId !== null) {
				res.redirect('/user/events');
				const error = new Error(
					'Not allowed to create another society'
				);
				error.statusCode = 403;
				next(error);
				//err flashing if smh user reaches this route
				//rn only redirecting
			}
		})
		.then((result) => {
			res.render('user/createSociety', {
				pageTitle: 'Create society',
				path: '/createSociety',
				errorMessage: message,
				oldInput: {
					societyName: '',
					societyDesc: '',
					dateEst: '',
					website: '',
					discord: '',
					user2Email: '',
					user3Email: '',
				},
				validationErrors: [],
			});
		})
		.catch((err) => {
			next(err);
		});
};

exports.postCreateSociety = (req, res, next) => {
	let groupId;
	//for the case when groupId is null (so a new society can be created), after creating a group, we need to store the groupId in loadedGroupId and add it in users db
	let loadedGroupId;
	let societyId;
	let user2Id;
	let user3Id;
	//add data to societies and groups db (also add groupid to users, add 2 new users as well)

	const societyName = req.body.societyName;
	//do req.file.logo later
	// const logo = req.body.logo;
	const societyDesc = req.body.societyDesc;
	const dateEst = req.body.dateEst;
	const website = req.body.website;
	const discord = req.body.discord;
	let user1Email;
	const user2Email = req.body.user2Email;
	const user3Email = req.body.user3Email;
	let user2Password;
	let user3Password;

	// console.log('in postCreateSociety');

	// if (req.file) {
	// 	logo = req.file.logo;
	// }
	// if (!logo) {
	// 	const error = new Error('No logo picked');
	// 	error.statusCode = 422;
	// 	throw error;
	// }

	const errors = validationResult(req);
	console.log(errors);
	if (!errors.isEmpty()) {
		return res.status(422).render('user/createSociety', {
			path: '/createSociety',
			pageTitle: 'Create society',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				societyName: societyName,
				societyDesc: societyDesc,
				dateEst: dateEst,
				website: website,
				discord: discord,
				user2Email: user2Email,
				user3Email: user3Email,
			},
			validationErrors: errors.array(),
		});
	}

	//authorization
	//check if groupId is null or not in users db
	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			//here we receive groupId as null, if userId is valid. but if userId is not a valid one, then we go to catch block.
			groupId = rows[0].groupId;
			//causing errors, that below code executing too
			if (groupId !== null) {
				res.redirect('/user/events');
				const error = new Error(
					'Not allowed to create another society'
				);
				error.statusCode = 403;
				next(error);
			}

			return User.findEmailByUserId(req.userId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error(
					'You are not allowed to create society'
				);
				error.statusCode = 500;
				next(error);
			}
			//user1Email, to insert in groups db
			user1Email = rows[0].email;

			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			console.log('hiii');
			societyId = buffer.toString('hex');
			const society = new Society(
				societyId,
				societyName,
				societyDesc,
				dateEst,
				website,
				discord
			);
			return society.save();
		})
		.then((result) => {
			console.log('in postCreatesociety:', result);
			if (result.affectedRows <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			const group = new Group(
				societyId,
				user1Email,
				user2Email,
				user3Email
			);
			return group.save();
		})
		.then((result) => {
			if (result.affectedRows <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			return Group.findGroupIdByUser1Email(user1Email);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Internal server error');
				error.statusCode = 500;
				next(error);
			}
			loadedGroupId = rows[0].groupId;

			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user2Id = buffer.toString('hex');
			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user3Id = buffer.toString('hex');
			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user2Password = buffer.toString('hex');
			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user3Password = buffer.toString('hex');

			//saving user2 and user3 in users db
			//BUG DIDNT FIND GROUPID -- resolved

			return bcrypt.hash(user2Password, 12);
		})
		.then((hashedPassword) => {
			const user2 = new User(
				user2Id,
				user2Email,
				hashedPassword,
				loadedGroupId
			);
			return user2.save();
		})
		.then((result) => {
			return bcrypt.hash(user3Password, 12);

			// if (result.affectedRows <= 0) {
			// 	const error = new Error('Internal server error');
			// 	error.statusCode = 500;
			// 	next(error);
			// }
		})
		.then((hashedPassword) => {
			const user3 = new User(
				user3Id,
				user3Email,
				hashedPassword,
				loadedGroupId
			);
			return user3.save();
		})
		.then((result) => {
			// if (result.affectedRows <= 0) {
			// 	const error = new Error('Internal server error');
			// 	error.statusCode = 500;
			// 	next(error);
			// }
			//inserting groupId also in 1st user's row in users db

			User.insertGroupIdInUser1(loadedGroupId, req.userId);
		})
		.then((result) => {
			// if (result[0].affectedRows <= 0) {
			// 	const error = new Error('Internal server error');
			// 	error.statusCode = 500;
			// 	next(error);
			// }
			// res.status(201).json({
			// 	message: 'Society created successfully (plus other things)',
			// });
			req.flash('success', 'Society has been created successfully');
			res.redirect('/');

			transporter.sendMail({
				to: user2Email,
				//verified account to send emails
				from: 'shubhamlightning99@gmail.com',
				subject: 'SocietyBoard: Sign Up succesfull!',
				text: `Your email: ${user2Email}, password: ${user2Password}`,
			});
			transporter.sendMail({
				to: user3Email,
				//verified account to send emails
				from: 'shubhamlightning99@gmail.com',
				subject: 'SocietyBoard: Sign Up succesfull!',
				text: `Your email: ${user3Email}, password: ${user3Password}`,
			});
		})
		.catch((err) => {
			//findGroupIdByUserId error --resolved above
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			}
		});
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => {
		if (err) {
			console.log('err in unlink in clearImage:', err);
		}
		// console.log('err in unlinddk in clearImage in feed.js:', err);
	});
};
