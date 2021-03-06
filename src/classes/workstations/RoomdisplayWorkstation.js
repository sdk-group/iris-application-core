'use strict'

let BaseWorkstation = require('./BaseWorkstation.js');
let SharedEntities = require('../access-objects/SharedEntities.js');
let Connection = require('../access-objects/connection-instance.js');
let Ticket = require('../ticket.js');

let connection = new Connection();

class RoomdisplayWorkstation extends BaseWorkstation {
	constructor(user) {
		super();
		this.user = user;
		this.type = 'roomdisplay';
		this.queue = [];
		this.queue_to_play = [];
		this.queue_length = 40;
	}
	middleware() {
		this.default_voice_duration = this.fields.default_voice_duration || 40000;

		let drop_events = _.isArray(this.fields.history_enabled) ? this.fields.history_enabled : [];

		if (this.fields.history_enabled === false) {
			drop_events = ['postpone', 'processing', 'route', 'expire', 'close'];
		}

		console.log('<RD> Drop events list:', drop_events);

		if (!_.isEmpty(drop_events)) {
			let remove_from_queue = (event) => {
				console.log('<RD> Ticket event', event);
				let ticket = event.data;
				let id = _.get(ticket, 'id');

				this.queue = _.filter(this.queue, queue_ticket => _.get(queue_ticket, 'id') != id);

				let first = _.head(this.queue_to_play);
				let first_id = first ? first.id : false;

				_.remove(this.queue_to_play, (queue_ticket) => (_.get(queue_ticket, 'id') != first_id && _.get(queue_ticket, 'id') == id));

				this.emit('queue.change');
			};


			_.forEach(drop_events, event => this.subscribe({
				name: 'ticket.' + event,
				owner_id: '*'
			}, remove_from_queue));
		}

		return connection.request('/shared-entities/organization-chain', {
			workstation: this.getId()
		}).then(data => {
			const last = _.last(_.keys(data.entities));
			const office = _.get(data.entities, [last, 'id']);
			const department = this.fields.attached_to;

			return this.subscribe({
				name: 'roomdisplay.command',
				department: department,
				office: office,
				owner_id: this.getId()
			}, (event) => {
				console.log('ticket called with data:', event);
				let event_data = event.data;
				let id = _.get(event_data.ticket, 'id');

				let ticket = this.makeTicket(event_data.ticket);
				ticket.workstation = event_data.workstation;
				ticket.voice = event_data.voice;
				ticket.voice_duration = event_data.voice_duration || this.default_voice_duration;

				this.addToQueue(ticket);
				this.emit('queue.change');
			});
		});
	}
	getShared() {
		let ws_params = {
			workstation: this.getId()
		};
		let request_shared = [{
			name: 'timezone',
			params: ws_params
		}, {
			name: 'office',
			params: ws_params
		}, {
			name: 'organization-chain',
			params: ws_params
		}];

		return SharedEntities.request(request_shared);
	}
	makeTicket(data) {
		let ticket = new Ticket(data, this);
		ticket.origin = this.id;
		return ticket;
	}
	onChange(cb) {
		this.on('queue.change', cb)
	}
	autoFlush() {
		if (this.flush_interval) clearInterval(this.flush_interval);
		if (!this.queue_to_play.length) return;

		console.log('Auto flush every 45 sec');
		this.flush_interval = setInterval(() => {
			console.log('Autoflush');
			this.queue_to_play.shift();
			this.emit('queue.change');
		}, 45000)
	}
	isSameID(ticket1, ticket2) {
		if (!(ticket1 instanceof Ticket) || !(ticket2 instanceof Ticket)) return false;
		return ticket1.getId() == ticket2.getId();
	}
	isSameWorkstation(ticket1, ticket2) {
		if (!(ticket1 instanceof Ticket) || !(ticket2 instanceof Ticket)) return false;
		return ticket1.workstation.id == ticket2.workstation.id;
	}
	played(ticket) {
		console.log('report played', ticket.getId());

		return connection.request('/roomdisplay/report-played', {
			ticket: ticket.getId(),
			success: true
		}).then(({
			success,
			ticket: updated_ticket
		}) => {
			console.log('success', success, 'ticket', updated_ticket);
			this.checkTicketState(updated_ticket);
			return this.clearQueueToPlay(ticket);
		});
	}
	checkTicketState(ticket) {
		let he = this.fields.history_enabled;

		if ((he === false || _.isArray(he)) && ticket.state == 'closed') {
			let id = _.get(ticket, 'id');

			this.queue = _.filter(this.queue, queue_ticket => _.get(queue_ticket, 'id') != id);
			this.emit('queue.change');
		}
	}
	clearQueueToPlay(ticket) {
		_.remove(this.queue_to_play, queue_ticket => this.isSameID(queue_ticket, ticket) && this.isSameWorkstation(queue_ticket, ticket));

		this.emit('queue.change');
		this.autoFlush();
	}
	failed(ticket) {
		console.log('report failed', ticket.getId());

		return connection.request('/roomdisplay/report-played', {
			ticket: ticket.getId(),
			success: false
		}).then(() => this.clearQueueToPlay(ticket));
	}
	addToQueue(ticket) {
		if (this.queue_to_play.length == 0) this.autoFlush();

		_.remove(this.queue_to_play, (queue_ticket, index) => index && this.isSameID(queue_ticket, ticket) && !this.isSameWorkstation(queue_ticket, ticket));

		this.queue_to_play.push(ticket);

		_.remove(this.queue, queue_ticket => this.isSameID(queue_ticket, ticket));

		this.queue.unshift(ticket);

		this.queue = _.slice(this.queue, 0, this.queue_length);
	}
}

module.exports = RoomdisplayWorkstation;
