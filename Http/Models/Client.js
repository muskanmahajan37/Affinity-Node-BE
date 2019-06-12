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
                    .input('status', sql.NVarChar, 'A')
                    .query('SELECT ClientId, FirstName, LastName FROM client WHERE Status = @status');
    }).then(result => {
        sql.close();
        console.log('=== result ===', result);
        if(result.recordset.length > 0) {
            res.status(200).send({status: 0, data: JSON.stringify(result.recordset), msg: ''});
        } else {
            res.status(400).send({status: 1, data: JSON.stringify(result.recordset), msg: 'There is no actived client.'});
        }
    }).catch(err => {
        console.log('=== login catch err ===', err);
        sql.close();
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
    });
}

sql.on('error', err => {
    console.log('=== sql connect err ===', err);
    sql.close();
    res.status(500).send({status: 2, msg: 'Failed to connect server'});
})