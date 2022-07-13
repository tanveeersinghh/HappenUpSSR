// exports.getHome = (req, res, next) => {
// 	// const events = [
// 	// 	{
// 	// 		societyName: 'CCS',
// 	// 		societyLogo: 'A logo here',
// 	// 		eventName: 'Hackathon',
// 	// 		eventPoster: 'A Poster here later',
// 	// 		eventDescription:
// 	// 			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
// 	// 		societyDiscord: 'abc-discord-link',
// 	// 		societyWebsite: 'xyz.com',
// 	// 		eventStartDate: Date.now(),
// 	// 	},
// 	// 	{
// 	// 		societyName: 'Developer Student Club',
// 	// 		societyLogo: 'A logo here',
// 	// 		eventName: 'Recruitments',
// 	// 		eventPoster: 'A Poster here later',
// 	// 		eventDescription:
// 	// 			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
// 	// 		societyDiscord: 'abc-discord-link',
// 	// 		societyWebsite: 'xyz.com',
// 	// 		eventStartDate: Date.now(),
// 	// 	},
// 	// ];

// 	// res.status(200).json({
// 	// 	message: 'All events fetched',
// 	// 	events: events,
// 	// });

// };

const Event = require('../models/event');
const Society = require('../models/society');

exports.getHome = (req, res, next) => {
	let events;
	let societyName;
	let flag = false;

	//Promise.all(iterable) [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all]

	let promises = [];

	Event.displayAllEvents()
		.then(([rows, data]) => {
			//rows is array of objects
			console.log(rows);
			if (rows.length <= 0) {
				// const error = new Error('Could not display all events');
				// error.statusCode = 500;
				// next(error);
				// return res.render('home', {
				// 	pageTitle: 'Home',
				// 	path: '/',
				// 	events: [],
				// });
				flag = true;
				return;
			}

			events = rows;
			// console.log(rows);
			events.forEach((event) => {
				societyId = event.societyId;

				// console.log(societyId, event);

				promises.push(
					Society.findSocietyNameBySocietyId(societyId)
						.then(([rows, data]) => {
							if (rows.length <= 0) {
								const error = new Error(
									'Could not find society name'
								);
								error.statusCode = 500;
								next(error);
							}
							societyName = rows[0].societyName;
							event.societyName = societyName;
						})
						.catch((err) => {
							if (err) {
								if (!err.statusCode) {
									err.statusCode = 500;
								}
								next(err);
							}
						})
				);
			});
			return Promise.all(promises);
		})
		.then((resolvedPromises) => {
			// if (!resolvedPromises) {
			// 	const error = new Error('There is some internal error');
			// 	error.statusCode = 500;
			// 	next(error);
			// }
			// console.log(resolvedPromises);

			if (flag) {
				return res.render('home', {
					pageTitle: 'Home',
					path: '/',
					events: [],
				});
			} else {
				return res.render('home', {
					pageTitle: 'Home',
					path: '/',
					events: events,
				});
			}
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
