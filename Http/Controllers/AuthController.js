var Employee = require('../Models/Employee');

/* GET users listing. */
exports.login = function (req, res) {
    Employee.login(req, res);
}

exports.get_passcode = function (req, res) {
    Employee.get_passcode(req, res);
}

exports.confirm_passcode = function (req, res) {
    var passcode = req.body.passcode;
    var passcodeconf = req.body.passcodeconf;
    if (passcode == passcodeconf) {
        res.status(200).send({status: 0, msg: ''});
    } else {
        res.status(400).send({status: 1, msg: 'The passcode does not match, Please re-type'});
    }
}