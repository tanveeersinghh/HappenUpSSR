const db = require('../util/database');

module.exports = class Group {
	// groupId is autoincrement
	constructor(societyId, user1Email, user2Email, user3Email) {
		this.societyId = societyId;
		this.user1Email = user1Email;
		this.user2Email = user2Email;
		this.user3Email = user3Email;
	}

	save() {
		return db.execute(
			'INSERT INTO `society-board`.groups (societyId, user1Email, user2Email, user3Email) VALUES (?, ?, ?, ?)',
			[this.societyId, this.user1Email, this.user2Email, this.user3Email]
		);
	}

	static findSocietyIdByGroupId(groupId) {
		return db.execute(
			'SELECT societyId FROM `society-board`.groups WHERE groups.groupId = ?',
			[groupId]
		);
	}

	static findGroupIdBySocietyId(societyId) {
		return db.execute(
			'SELECT groupId FROM `society-board`.groups WHERE groups.societyId = ?',
			[societyId]
		);
	}

	static findGroupIdByUser1Email(user1Email) {
		return db.execute(
			'SELECT groupId FROM `society-board`.groups WHERE groups.user1Email = ?',
			[user1Email]
		);
	}
};
