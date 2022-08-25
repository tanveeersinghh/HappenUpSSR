const db = require('../util/database');

module.exports = class User {
	//groupId is null when signing up
	constructor(userId, email, password, groupId) {
		this.userId = userId;
		this.email = email;
		this.password = password;
		this.groupId = groupId;
	}

	save() {
		//returns a promise
		return db.execute(
			'INSERT INTO `societyboard`.users (userId, email, password, groupId) VALUES (?, ?, ?, ?)',
			[this.userId, this.email, this.password, this.groupId]
		);
	}

	static findByEmail(email) {
		// return db.execute('SELECT * FROM users');
		return db.execute(
			'SELECT * FROM `societyboard`.users WHERE users.email = ?',
			[email]
		);
	}

	static findGroupIdByUserId(userId) {
		return db.execute(
			'SELECT groupId FROM `societyboard`.users WHERE users.userId = ?',
			[userId]
		);
	}

	static findEmailByUserId(userId) {
		return db.execute(
			'SELECT email FROM `societyboard`.users WHERE users.userId = ?',
			[userId]
		);
	}

	static insertGroupIdInUser1(groupId, userId) {
		return db.execute(
			'UPDATE `societyboard`.users SET users.groupId = ? WHERE (users.userId = ?)',
			[groupId, userId]
		);
	}
};
