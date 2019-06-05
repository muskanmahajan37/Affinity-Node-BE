var DcnSubmitted = require('../Models/DcnSubmitted');

/* GET users listing. */
exports.save_data = function (req, res) {
    DcnSubmitted.save(req, res);
}
