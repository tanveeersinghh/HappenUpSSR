const path = require('path');

const db = require('./util/database');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const errorController = require('./controllers/error');
const User = require('./models/user');
const Group = require('./models/group');
const Event = require('./models/event');
const Society = require('./models/society');

const app = express();

const PORT = 8080;
const MONGO_USER = process.env.mongo_user;
const MONGO_PASSWORD = process.env.mongo_password;
const MONGODB_URI = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.b6e3a.mongodb.net/societyBoard?retryWrites=true&w=majority`;

const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: 'sessions',
});

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	},
});
const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

//*solution to queries and outputs being logged twice in console, as browser again sends a request when it doesnt find favicon
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));

app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single('poster')
);

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

//*matches session with cookie if present
app.use(
	session({
		secret: process.env.session_secret,
		resave: false,
		saveUninitialized: false,
		//session will be stored in mongodb collection sessions
		store: store,
		//can also configure the session cookie here
		// cookie{expires: }	cookie{maxAge: }
	})
);

//* when not logged in, it'll create a session on which the msg (err msg rn) will be flashed, and then pulled out, but still that session will exist with empty flash obj. After logging in, in that same session isLoggedIn and user obj will be stored. SO new sessions are not created, on that same session data is stored
app.use(flash());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization'
	);

	next();
});

//SEE
app.use((req, res, next) => {
	//if not req.session.user, the isAuth middleware in routes will handle
	// if (!req.session.userId) {
	// 	return next();
	// }

	// console.log('hello', req.session.userId);
	// req.userId = req.session.userId;
	res.locals.isAuthenticated = req.session.isLoggedIn;
	//as 1 user is allowed ot create only 1 society, so button doesnt show in navbar
	res.locals.allowedToCreateSociety = false;
	res.locals.eventIsDeleted = false;

	next();
});

app.use((req, res, next) => {
	if (!req.session.userId) {
		return next();
	}
	//*locals field on response obj allows us to set local variables that are always passed into the views (local as they'll only exist in views that are rendered)
	// console.log(req.userId);
	req.userId = req.session.userId;

	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			console.log('hi', rows);
			//here we receive groupId as null, if userId is valid. but if userId is not a valid one, then we go to catch block.
			// console.log(rows);
			groupId = rows[0].groupId;
			//causing errors, that below code executing too
			if (groupId !== null) {
				res.locals.allowedToCreateSociety = false;
			} else {
				res.locals.allowedToCreateSociety = true;
			}
			// req.userId = req.session.userId;
			next();
		})
		.catch((err) => {
			next(new Error(err));
		});
});

// app.use('/', (req, res,next) => {
// 	res.render('user/events', {
// 		pageTitle: 'User page'
// 	})
// })
console.log('hii');
app.use(homeRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use(errorController.get404);

//CHANGE, according to error status code
app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	//data passed in case of validation errors
	const data = error.data;
	// res.status(status).json({
	// 	message: message,
	// 	data: data,
	// });
	res.status(status).render('500', {
		pageTitle: 'Error!',
		path: '/500',
		message: message,
		data: data,
	});
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose
	.connect(MONGODB_URI)
	.then((result) => {
		app.listen(PORT, () => {
			console.log(`Listening on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.log('err in mongoose.connect in app.js:', err);
	});

// app.listen(PORT, () => {
// 	console.log(`Listening on port ${PORT}`);
// });

process.on('SIGINT', () => {
	console.log('\nShutting down');
	process.exit(1);
});

// Group.findsocietyIdByGroupId(78)
// 	.then(([rows, data]) => {
// 		console.log(rows[0].societyId);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// const groupId = 5;
// const test = db.execute('SELECT * FROM `society-board`.groups WHERE groups.groupId = 5', [
// 	groupId,
// ]);

// test.then((result) => {
// 	console.log(result[0]);
// }).catch((err) => {
// 	console.log(err);
// });

// Event.findEventById(3)
// 	.then(([rows, data]) => {
// 		const event = rows[0];

// 		if (!event) {
// 			console.log('yo');
// 		}
// 		console.log(rows);
// 		// console.log(event.poster);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// User.findGroupIdByUserId('ce14290ea7e15e0b0fa643e6f73f04dc86d276a5').then(([rows, data]) => {
// 	if (rows.length == 0) {
// 		console.log('this is');
// 	}
// 	else {
// 		console.log('that is');
// 	}
// 	// console.log(rows);

// }).catch((err) => {
// 	console.log(err);
// });

// const id = 'fd29931b0ebfa36bf428e3ef07c6fd6ae76563b0'

// User.findEmailByUserId(id).then(([rows, data]) => {
// 	console.log(rows[0].email);
// }).catch((err) => {
// 	console.log(err);
// });

// Group.findGroupIdByUser1Email('adiad')
// 	.then(([rows, data]) => {
// 		console.log(rows[0].groupId);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// Event.findEventByEventId(5)
// 	.then(([rows, data]) => {
// 		const event = rows[0]
// 		console.log(event);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// Group.findGroupIdBySocietyId('78dd0813f9d7e2c22c43baeed45df82d967f981').then(([rows, data]) => {
// 	if (!rows.length) {
// 		console.log('hii');
// 	}
// 	else {
// 		console.log('yooo');
// 	}
// 	console.log(rows);
// }).catch((err) => {
// 	console.log(err);
// });

// Event.findByEventIdAndRemove(3).then((result) => {
// 	console.log(result);
// }).catch((err) => {
// 	console.log(err);
// });

// Society.findWebsiteAndDiscordBySocietyId(
// 	'78dd0813f9d7e2c22c43baeed45df82d967f9812'
// )
// 	.then(([rows, data]) => {
// 		console.log(rows[0]);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// Event.findEventsBySocietyId('78dd0813f9d7e2c22c43baeed45df82d967f9812').then(([rows, data]) => {
// 	console.log(rows);
// }).catch((err) => {
// 	console.log(err);
// })

// Event.displayAllEvents().then(([rows, data]) => {
// 	let date = new Date(rows[1].startDate);
// 	console.log(rows[1]);
// 	console.log(date.getUTCDate());
// }).catch((err) => {
// 	console.log(err);
// });

// User.findByEmail('shubhamlightning99@gmail.comm').then(([rows, data]) => {
// 	console.log(rows);
// }).catch((err) => {
// 	console.log(err);
// });

// Event.findEventByEventId(1).then(([rows, data]) => {
// 	console.log(rows[0]);
// }).catch((err) => {
// 	console.log(err);
// });