const eventList = document.querySelector('.event-list');

fetch('http://localhost:8080/')
	.then((result) => {
		return result.json();
	})
	.then((data) => {
        console.log(data.events[0]);
        data.events.forEach(event => {
            const eventName = event.eventName;
            const societyName = event.societyName;
            const eventDesc = event.eventDesc;
            const poster = event.poster;
            const website = event.website;
            const discord = event.discord;
            const startDate = event.startDate;
            
        });
    })
	.catch((err) => {
		console.log(err);
	});
