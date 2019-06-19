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
        if(result.rowsAffected[0] > 0) {
            // var ids = '';
            // for (var i=0; i<result.recordset.length; i++) {
            //     if (!ids.includes(', ' + result.recordset[i].ClientId)) {
            //         ids += ', ' + result.recordset[i].ClientId;
            //     }
            // }
            // ids = ids.replace(', ', '');
            // get_clients_by_ids(req, res, ids);
            var ids = [];
            for (var i=0; i<result.recordset.length; i++) {
                if (!ids.includes(result.recordset[i].ClientId)) {
                    ids.push(result.recordset[i].ClientId);
                }
            }
            var data = [];
            get_clients_by_ids(req, res, ids, 0, data);
        } else {
            res.status(400).send({status: 1, data: JSON.stringify(result.recordset), msg: 'There is no actived client.'});
        }
    }).catch(err => {
        console.log('=== get clients ids - catch err ===', err);
        sql.close();
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
    });
}

get_clients_by_ids = function (req, res, ids, index, data) {
    console.log('=== unique client ids ===', ids);
    var _i = parseInt(index);
    var _data = data;
    sql.connect(config).then(pool => {
        return pool.request()
                    .input('status', sql.NVarChar, 'A')
                    .input('id', sql.Int, parseInt(ids[_i]))
                    .query('SELECT ClientId, FirstName, LastName FROM client WHERE Status = @status AND ClientId = @id');
    }).then(result => {
        sql.close();
        console.log('=== get clients by id - result ===', result.rowsAffected);
        if(result.recordset.length > 0) {
            _data.push(result.recordset[0]);
        }
        if (_i < ids.length) {
            get_clients_by_ids(req, res, ids, _i + 1, _data);
        } else {
            if (_data.length > 0) {
                res.status(200).send({status: 0, data: JSON.stringify(_data), msg: ''});
            } else {
                res.status(400).send({status: 1, data: JSON.stringify(result.recordset), msg: 'There is no actived client.'});
            }
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