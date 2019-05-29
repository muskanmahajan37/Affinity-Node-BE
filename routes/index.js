var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	const config = {
    user: 'affinityweb',
    password: 'aff123qwe',
		server: '34.195.189.103',
		port: 59419,
    database: 'Affinity',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
	}
	const sql = require('mssql');

	sql.on('error', err => {
		console.log('=== err ===', err);
	})

	// sql.connect(config).then(pool => {
	// 		return (pool.request().query('select * from employee'));
	// }).then(result => {
  //   console.log(result)
	// }).catch(err => {
	// 	console.log('=== catch ===', err);
	// });
	
	sql.connect(config).then(pool => {
		console.log('===pool===', pool);
	}).catch(err => {
		console.log('=== catch ===', err);
	});

});

module.exports = router;
