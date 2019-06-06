var express = require('express');
var router = express.Router();
const multer = require('multer');
const Storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, 'public/images/')
    },
    filename(req, file, callback) {
      callback(null, `${file.fieldname}_${file.originalname}.${file.mimetype.split('/')[1]}`)
    },
})
  
const upload = multer({ storage: Storage });

/* ---------------- include controllers ----------------- */
var Auth = require('../Http/Controllers/AuthController');
var Cpanel = require('../Http/Controllers/ControlPanelController');
var DCN = require('../Http/Controllers/DCNController');

/* ---------------- Login API ---------------*/
router.post('/login', Auth.login);
router.post('/login/get_passcode', Auth.get_passcode);
router.post('/login/confirm_passcode', Auth.confirm_passcode);

/* ---------------- Control Panel API ------------------- */
router.get('/cpanel/client', Cpanel.client);
router.post('/get_dcnlist', DCN.get_dcnlist);
router.post('/get_dcndetail', DCN.get_dcndetail);

/* ---------------- Sign And Send API ------------------- */
router.post('/send_data', upload.single('ImageOfDCN'), DCN.save_data);

module.exports = router;
