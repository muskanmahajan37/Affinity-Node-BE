var Client = require('../Models/Client');

/* GET users listing. */
exports.client = function (req, res) {
    Client.get_clients(req, res);
}
