var DcnSubmitted = require('../Models/DcnSubmitted');

/* save DCN form */
exports.save_data = function (req, res) {
    if (req.body.isNewDCN == 'true') {
        DcnSubmitted.save(req, res);
    } else {
        DcnSubmitted.update(req, res);
    }
}

/* get DCN item list */
exports.get_dcnlist = function (req, res) {
    DcnSubmitted.read(req, res);
}

/* get DCN item detail */
exports.get_dcndetail = function (req, res) {
    DcnSubmitted.read_detail(req, res);
}
