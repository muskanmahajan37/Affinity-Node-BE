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
exports.get_clients = function(req, res) {
    sql.connect(config).then(pool => {
        return pool.request()
                    .input('ssn', sql.NVarChar, req.body.ssn.toString())
                    .query('SELECT ClientId FROM schedules WHERE SocialSecNum = @ssn');
    }).then(result => {
        sql.close();
        console.log('=== get clients ids(in schedules table) ===', result);
        if(result.recordset.length > 0) {
            var ids = '';
            for (var i=0; i<result.recordset.length; i++) {
                if (!ids.indexOf(result.recordset[i].ClientId + ', ')) {
                    ids += i == (result.recordset.length - 1) ? (result.recordset[i].ClientId) : (result.recordset[i].ClientId + ', ');
                }
            }
            get_clients_by_ids(req, res, ids);
        } else {
            res.status(400).send({status: 1, data: JSON.stringify(result.recordset), msg: 'There is no actived client.'});
        }
    }).catch(err => {
        console.log('=== get clients ids - catch err ===', err);
        sql.close();
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
    });
}

get_clients_by_ids = function (req, res, ids) {
    sql.connect(config).then(pool => {
        return pool.request()
                    .input('status', sql.NVarChar, 'A')
                    .input('ids', sql.NVarChar, ids)
                    .query('SELECT ClientId, FirstName, LastName FROM client WHERE Status = @status AND ClientId in (@ids)');
    }).then(result => {
        sql.close();
        if(result.recordset.length > 0) {
            res.status(200).send({status: 0, data: JSON.stringify(result.recordset), msg: ''});
        } else {
            res.status(400).send({status: 1, data: JSON.stringify(result.recordset), msg: 'There is no actived client.'});
        }
    }).catch(err => {
        console.log('=== get clients by ids - catch err ===', err);
        sql.close();
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
    });
}

sql.on('error', err => {
    console.log('=== sql connect err ===', err);
    sql.close();
    res.status(500).send({status: 2, msg: 'Failed to connect server'});
})