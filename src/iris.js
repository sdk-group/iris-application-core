module.exports = {
	'BaseWorkstation': require('./classes/workstations/BaseWorkstation.js'),
	'ControlPanelWorkstation': require('./classes/workstations/ControlPanelWorkstation.js'),
	'DigitalDisplayWorkstation': require('./classes/workstations/DigitalDisplayWorkstation.js'),
	'PandoraBoxWorkstation': require('./classes/workstations/PandoraBoxWorkstation.js'),
	'QaWorkstation': require('./classes/workstations/QaWorkstation.js'),
	'ReceptionWorkstation': require('./classes/workstations/ReceptionWorkstation.js'),
	'OperatorDisplayWorkstation': require('./classes/workstations/OperatorDisplayWorkstation.js'),
	'ReportsWorkstation': require('./classes/workstations/ReportsWorkstation.js'),
	'RoomdisplayWorkstation': require('./classes/workstations/RoomdisplayWorkstation.js'),
	'CallCenterWorkstation': require('./classes/workstations/CallCenterWorkstation.js'),
	'TerminalWorkstation': require('./classes/workstations/TerminalWorkstation.js'),
	"HttpConnectionMethod": require("./classes/access-objects/HTTPConnection.js"),
	"SocketConnection": require("./classes/access-objects/SocketConnection.js"),
	"SharedEntities": require("./classes/access-objects/SharedEntities.js"),
	"Connection": require("./classes/access-objects/Connection.js"),
	"connection": require("./classes/access-objects/connection-instance.js"),
	"settings": require("./classes/access-objects/Settings.js"),
	"History": require("./classes/access-objects/History.js"),
	"User": require("./classes/User.js"),
	"Ticket": require("./classes/ticket.js"),
	"Errors": require("./classes/access-objects/Errors.js")
};
