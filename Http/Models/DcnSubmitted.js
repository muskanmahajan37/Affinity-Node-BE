const sql = require('mssql');
var moment = require('moment');

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
exports.save = function(req, res) {
    sql.connect(config).then(pool => {
        return pool.request()
                    .input('SocialSecurityNum', sql.VarChar(9), req.body.SocialSecurityNum.toString())
                    .input('ClientId', sql.Int, parseInt(req.body.ClientId))
                    .input('LastSaturdayDate', sql.VarChar(10), req.body.LastSaturdayDate.toString())
                    .input('HourlyFlag', sql.Bit, (req.body.HourlyFlag == 'true'))
                    .input('LiveInFlag', sql.Bit, (req.body.LiveInFlag == 'true'))
                    .input('OvernightFlag', sql.Bit, (req.body.OvernightFlag == 'true'))
                    .input('WeekTotalHours', sql.Int, parseInt(req.body.WeekTotalHours) ? parseInt(req.body.WeekTotalHours) : 0)
                    .input('ComplianceFlag', sql.Bit, req.body.ComplianceFlag)
                    .input('CaregiverSignature', sql.NVarChar(2147483647), req.body.CaregiverSignature.toString())
                    .input('CaregiverSignatureDate', sql.VarChar(10), req.body.CaregiverSignatureDate.toString())
                    .input('ClientSignature', sql.NVarChar(2147483647), req.body.ClientSignature.toString())
                    .input('ClientSignatureDate', sql.VarChar(10), req.body.ClientSignatureDate.toString())
                    .input('HasPAF', sql.Bit, (req.body.HasPAF == 'true'))
                    .input('PafId', sql.Int, parseInt(req.body.PafId) ? parseInt(req.body.PafId) : 0) // PAF ID---
                    .input('SendToPhoneFlag', sql.Bit, (req.body.SendToPhoneFlag == 'true'))
                    .input('Phone1', sql.VarChar(20), req.body.Phone1.toString())
                    .input('Phone2', sql.VarChar(20), req.body.Phone2.toString())
                    .input('SendToEmailFlag', sql.Bit, (req.body.SendToEmailFlag == 'true'))
                    .input('Email1', sql.VarChar(256), req.body.Email1.toString())
                    .input('Email2', sql.VarChar(256), req.body.Email2.toString())
                    .input('DateTimeOfSubmission', sql.DateTime, new Date())
                    .input('GPSLocationOfSubmission', sql.NVarChar(60), req.body.GPSLocationOfSubmission.toString() ? req.body.GPSLocationOfSubmission.toString() : '') // GPS ---
                    .input('ImageOfDCN', sql.VarChar(200), '/public/images/' + req.body.DCNImageFileName + '.png') // ImageOfDCN
                    .input('PDFOfDCN', sql.VarChar(200), req.body.PDFOfDCN.toString() ? req.body.PDFOfDCN.toString() : '') // PDFOfDCN --- 
                    .input('createdBy', sql.VarChar(1000), req.body.author.toString())
                    .input('created', sql.DateTime, new Date())
                    .input('updatedBy', sql.VarChar(1000), req.body.author.toString())
                    .input('updated', sql.DateTime, new Date())
                    .query('INSERT INTO DcnSubmittedHeader (SocialSecurityNum, ClientId, LastSaturdayDate, ' + 
                            'HourlyFlag, LiveInFlag, OvernightFlag, WeekTotalHours, ComplianceFlag, CaregiverSignature, ' + 
                            'CaregiverSignatureDate, ClientSignature, ClientSignatureDate, HasPAF, PafId, SendToPhoneFlag, ' + 
                            'Phone1, Phone2, SendToEmailFlag, Email1, Email2, DateTimeOfSubmission, ' + 
                            'GPSLocationOfSubmission, ImageOfDCN, PDFOfDCN, createdBy, created, updatedBy, updated) ' + 
                            'VALUES (@SocialSecurityNum, @ClientId, @LastSaturdayDate, @HourlyFlag, @LiveInFlag, @OvernightFlag, ' + 
                            '@WeekTotalHours, @ComplianceFlag, @CaregiverSignature, @CaregiverSignatureDate, ' + 
                            '@ClientSignature, @ClientSignatureDate, @HasPAF, @PafId, @SendToPhoneFlag, @Phone1, @Phone2, ' + 
                            '@SendToEmailFlag, @Email1, @Email2, @DateTimeOfSubmission, @GPSLocationOfSubmission, ' + 
                            '@ImageOfDCN, @PDFOfDCN, @createdBy, @created, @updatedBy, @updated)');
    }).then(result => {
        console.log('=== result ===', result);



        res.send("======== OK ========");
        sql.close();
    }).catch(err => {
        console.log('=== DCN Submitted err ===', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
        sql.close();
    });
}

sql.on('error', err => {
    console.log('=== sql connect err ===', err);
    res.status(500).send({status: 2, msg: 'Failed to connect server'});
    sql.close();
})