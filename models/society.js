const db = require('../util/database');

module.exports = class Society {
	constructor(
		societyId,
		societyName,
		societyDesc,
		dateEst,
		website,
		discord
	) {
		this.societyId = societyId;
		this.societyName = societyName;
		// this.logo = logo;
		this.societyDesc = societyDesc;
		this.dateEst = dateEst;
		this.website = website;
		this.discord = discord;
	}

	save() {
		// INSERT INTO `society-board`.`societies` (`societyId`, `societyName`) VALUES ('12', 'Hefe');
		return db.execute(
			'INSERT INTO `society-board`.societies (societyId, societyName, societyDesc, dateEst, website, discord) VALUES (?, ?, ?, ?, ?, ?)',
			[
				this.societyId,
				this.societyName,
				this.societyDesc,
				this.dateEst,
				this.website,
				this.discord,
			]
		);
	}

	static findSocietyNameBySocietyId(societyId) {
		return db.execute(
			'SELECT societyName FROM `society-board`.societies WHERE societies.societyId = ?',
			[societyId]
		);
	}

	static findWebsiteAndDiscordBySocietyId(societyId) {
		return db.execute(
			'SELECT website, discord FROM `society-board`.societies WHERE societies.societyId = ?',
			[societyId]
		);
	}
};
