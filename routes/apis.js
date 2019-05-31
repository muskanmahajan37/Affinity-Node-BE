var express = require('express');
var router = express.Router();

/* ---------------- include controllers ----------------- */
var Auth = require('../Http/Controllers/AuthController');
var Cpanel = require('../Http/Controllers/ControlPanelController');

/* ---------------- Login API ---------------*/
router.post('/login', Auth.login);
router.post('/login/get_passcode', Auth.get_passcode);
router.post('/login/confirm_passcode', Auth.confirm_passcode);

/* ---------------- Control Panel API ------------------- */
router.get('/cpanel/client', Cpanel.client);

module.exports = router;
