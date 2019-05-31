const sql = require('mssql');

const config = {
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_HOST,
    port: parseInt(process.env.MSSQL_PORT),
    database: process.env.MSSQL_DATABASE,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
}

// Login First Step.
exports.get_passcode = function(req, res) {
    var user = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        ssn: req.body.ssn
    }
    console.log('==user --', req);
    sql.connect(config).then(pool => {
        return pool.request()
                    .input('firstname', sql.NVarChar, user.firstname)
                    .input('lastname', sql.NVarChar, user.lastname)
                    .query('SELECT SocialSecurityNum as ssn FROM employee WHERE FirstName = @firstname AND LastName = @lastname');
    }).then(result => {
        var exist_user = false;
        var user_ssn = '';
        for (var i = 0; i < result.recordset.length; i++) {
            var ssn = result.recordset[i].ssn
            var last4ssn = ssn.substr(ssn.length - 4);
            if(last4ssn == user.ssn) {
                exist_user = true;
                user_ssn = ssn;
                break;
            } else {
                exist_user = false;
            }
        }
        if(exist_user) {
            var random6pascode = Math.floor(100000 + Math.random() * 900000);
            var data = {
                passcode: random6pascode,
                userinfo: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    ssn: user_ssn
                }
            }
            res.status(200).send({ status: 0, msg: '', data: JSON.stringify(data) });
        } else {
            res.status(400).send({ status: 1, msg: 'The information entered does not match our records, please verify and try again', data: ''} );
        }
        sql.close();
    }).catch(err => {
        console.log('=== login catch err ===', err);
        res.status(500).send({ status: 2, msg: 'Failed to connect server', data: '' });
        sql.close();
    });
}

// Login Last Step
exports.login = function(req, res) {
    var user = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        ssn: req.body.ssn,
        passcode: req.body.passcode,
        passcodeconf: req.body.passcodeconf
    }
    console.log('==user --', req);
    sql.connect(config).then(pool => {
        return pool.request()
                    .input('firstname', sql.NVarChar, user.firstname)
                    .input('lastname', sql.NVarChar, user.lastname)
                    .query('SELECT SocialSecurityNum as ssn FROM employee WHERE FirstName = @firstname AND LastName = @lastname');
    }).then(result => {
        var exist_user = false;
        var user_ssn = '';
        for (var i = 0; i < result.recordset.length; i++) {
            var ssn = result.recordset[i].ssn
            var last4ssn = ssn.substr(ssn.length - 4);
            if(last4ssn == user.ssn) {
                exist_user = true;
                user_ssn = ssn;
                break;
            } else {
                exist_user = false;
            }
        }
        if(exist_user) {
            if(user.passcode == user.passcodeconf) {
                var data = {
                    userinfo: {
                        firstname: user.firstname,
                        lastname: user.lastname,
                        ssn: user_ssn
                    }
                };                
                res.status(200).send({ status: 0, msg: '', data: JSON.stringify(data) });
            } else {
                var random6pascode = Math.floor(100000 + Math.random() * 900000);
                var data = {
                    passcode: random6pascode
                }
                res.status(400).send({ status: 1, msg: 'The passcode does not match, Please re-type', data: JSON.stringify(data) });
            }
            
        } else {
            res.status(400).send({ status: 1, msg: 'The information entered does not match our records, please verify and try again', data: '' });
        }
        sql.close();
    }).catch(err => {
        console.log('=== login catch err ===', err);
        res.status(500).send({ status: 2, msg: 'Failed to connect server', data: '' });
        sql.close();
    });
}

sql.on('error', err => {
    console.log('=== sql connect err ===', err);
    res.status(500).send({ status: 2, msg: 'Failed to connect server', data: '' });
    sql.close();
})