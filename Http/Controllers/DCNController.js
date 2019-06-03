var DcnSubmitted = require('../Models/DcnSubmitted');

/* GET users listing. */
exports.save_data = function (req, res) {
    // console.log('=== req file ===', req);
    // console.log('=== req data ===', req.body);
    DcnSubmitted.save(req, res);
}
