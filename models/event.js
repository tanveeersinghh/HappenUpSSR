const db = require('../util/database');

module.exports = class Event {
	//eventId is autogenerated
	constructor(
		societyId,
		eventName,
		poster,
		eventDesc,
		startDate,
		endDate,
		website,
		discord
	) {
		this.societyId = societyId;
		this.eventName = eventName;
		this.poster = poster;
		this.eventDesc = eventDesc;
		this.startDate = startDate;
		this.endDate = endDate;
		this.website = website;
		this.discord = discord;
	}

	save() {
		return db.execute(
			'INSERT INTO `societyboard`.events (societyId, eventName, poster, eventDesc, startDate, endDate, website, discord) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			[
				this.societyId,
				this.eventName,
				this.poster,
				this.eventDesc,
				this.startDate,
				this.endDate,
				this.website,
				this.discord,
			]
		);
	}

	static update(
		eventId,
		eventName,
		poster,
		eventDesc,
		startDate,
		endDate,
		website,
		discord
	) {
		return db.execute(
			'UPDATE `societyboard`.events SET eventName = ?, poster = ?, eventDesc = ?, startDate = ?, endDate = ?, website = ?, discord = ? WHERE eventId = ?',
			[
				eventName,
				poster,
				eventDesc,
				startDate,
				endDate,
				website,
				discord,
				eventId,
			]
		);
	}

	static displayAllEvents() {
		return db.execute(
			'SELECT * FROM `societyboard`.events WHERE events.startDate >= NOW() ORDER BY events.startDate ASC'
		);
	}

	static findEventByEventId(eventId) {
		return db.execute(
			'SELECT * FROM `societyboard`.events WHERE events.eventId = ?',
			[eventId]
		);
	}

	static findEventsBySocietyId(societyId) {
		return db.execute(
			'SELECT * FROM `societyboard`.events WHERE events.societyId = ? order by events.startDate asc',
			[societyId]
		);
	}

	static findByEventIdAndRemove(eventId) {
		return db.execute(
			'DELETE FROM `societyboard`.events WHERE events.eventId = ?',
			[eventId]
		);
	}
};
