// const jwt = require('jsonwebtoken');

// require('dotenv').config();

// module.exports = (req, res, next) => {
// 	const authHeader = req.get('Authorization');
// 	if (!authHeader) {
// 		const error = new Error('Not Authenticated');
// 		error.statusCode = 401;
// 		throw error;
// 	}

// 	const token = authHeader.split(' ')[1];
// 	let decodedToken;
// 	//trying to decode the token (could fail ???), so adding try catch
// 	try {
// 		//will decode and verify the token
// 		decodedToken = jwt.verify(token, process.env.jwt_secret);
// 	} catch (err) {
// 		err.statusCode = 500;
// 		throw err;
// 	}
// 	//will be undefined if it wasnt verified
// 	if (!decodedToken) {
// 		const error = new Error('Not Authenticated');
// 		error.statusCode = 401;
// 		throw error;
// 	}

// 	//now we have a valid decoded token

// 	req.userId = decodedToken.userId;
// 	next();
// };

module.exports = (req, res, next) => {
	if (!req.session.isLoggedIn) {
		console.log('User is not logged in');
		//401 is for unauthorized access, tho here it'll be overwritten by 300 (redirect)
		return res.status(401).redirect('/login');
	}

	next();
};
