const cds = require("@sap/cds");

// OData v2 support
const proxy = require("@sap/cds-odata-v2-adapter-proxy");

cds.on("bootstrap", app => app.use(proxy()));

module.exports = cds.server;