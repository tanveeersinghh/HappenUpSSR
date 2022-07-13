const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../middleware/is-auth');
const userController = require('../controllers/user');

const router = express.Router();

//GET /user/events
router.get('/events', isAuth, userController.getEvents);

router.get('/createEvent', isAuth, userController.getCreateEvent);

// //POST /user/createEvent
router.post(
	'/createEvent',
	isAuth,
	[
		body('eventName').trim().isLength({ min: 3, max: 50 }),
		body('eventDesc').trim().isLength({ min: 10, max: 1000 }),
		body('website').trim().isLength({ max: 100 }),
		body('discord').trim().isLength({ max: 100 }),
		body('startDate')
			.custom((value, { req }) => {
				console.log(value, req.body.endDate);
				return req.body.endDate >= value;
			})
			.withMessage('startDate must be before endDate'),
	],
	userController.createEvent
);

router.get('/editEvent/:eventId', isAuth, userController.getEditEvent);

// POST /user/editEvent
router.post(
	'/editEvent',
	isAuth,
	[
		body('eventId').isLength({ min: 1 }),
		body('eventName').trim().isLength({ min: 3, max: 50 }),
		body('eventDesc').trim().isLength({ min: 10, max: 1000 }),
		body('website').trim().isLength({ max: 100 }),
		body('discord').trim().isLength({ max: 100 }),
	],
	userController.editEvent
);

// //POST /user/createSociety (cuz delete doesnt have body, we dont wanna pass id in params)
router.post('/deleteEvent', isAuth, userController.deleteEvent);

// GET  /user/createSociety
router.get('/createSociety', isAuth, userController.getCreateSociety);

// //POST /user/createSociety
router.post(
	'/createSociety',
	isAuth,
	[
		body('societyName').trim().isLength({ min: 3, max: 50 }),
		body('societyDesc').trim().isLength({ min: 5, max: 1000 }),
		body('website').trim().isLength({ max: 100 }),
		body('discord').trim().isLength({ max: 100 }),
		body('user2Email')
			.isEmail()
			.withMessage('Please Enter a valid user1 email')
			.isLength({ max: 50 }),
		body('user3Email')
			.isEmail()
			.withMessage('Please Enter a valid user2 email')
			.isLength({ max: 50 }),
	],
	userController.postCreateSociety
);

module.exports = router;
