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
                            'GPSLocationOfSubmission, ImageOfDCN, PDFOfDCN, createdBy, created, updatedBy, updated) OUTPUT INSERTED.DcnHeaderId ' + 
                            'VALUES (@SocialSecurityNum, @ClientId, @LastSaturdayDate, @HourlyFlag, @LiveInFlag, @OvernightFlag, ' + 
                            '@WeekTotalHours, @ComplianceFlag, @CaregiverSignature, @CaregiverSignatureDate, ' + 
                            '@ClientSignature, @ClientSignatureDate, @HasPAF, @PafId, @SendToPhoneFlag, @Phone1, @Phone2, ' + 
                            '@SendToEmailFlag, @Email1, @Email2, @DateTimeOfSubmission, @GPSLocationOfSubmission, ' + 
                            '@ImageOfDCN, @PDFOfDCN, @createdBy, @created, @updatedBy, @updated)');
    }).then(result => {
        console.log('=== result DCN Header ===', result);
        if(result.rowsAffected[0] && result.recordset[0].DcnHeaderId) {
            sql.close();
            save_details(req, res, result.recordset[0].DcnHeaderId);
        } else {
            sql.close();
            res.status(500).send({status: 1, msg: 'Invalid params.', data: ''});
        }
    }).catch(err => {
        console.log('=== DCN Submitted err ===', err);
        sql.close();
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
    });
}

sql.on('error', err => {
    console.log('=== sql connect err ===', err);
    sql.close();
    res.status(500).send({status: 2, msg: 'Failed to connect server'});
})

save_details = function (req, res, DcnHeaderId) {
    console.log('****************************************');
    console.log('**** DcnHeaderId ****', DcnHeaderId);
    console.log('**** req ****', req.body);
    console.log('****************************************');
    for (var i = 0; i < 7; i++) {
        sql.connect(config).then(pool => {
            return pool.request()
                        .input('DcnId', sql.Int, DcnHeaderId)
                        .input('DayOfWeek', sql.VarChar(20), JSON.parse(req.body.DCNWeek[i]).toString())
                        .input('TimeIn1', sql.VarChar(20), JSON.parse(req.body.TimeIn1[i]).toString())
                        .input('TimeOut1', sql.VarChar(20), JSON.parse(req.body.TimeOut1[i]).toString())
                        .input('TimeIn2', sql.VarChar(20), JSON.parse(req.body.TimeIn2[i]).toString())
                        .input('TimeOut2', sql.VarChar(20), JSON.parse(req.body.TimeOut2[i]).toString())
                        .input('TimeIn3', sql.VarChar(20), JSON.parse(req.body.TimeIn3[i]).toString())
                        .input('TimeOut3', sql.VarChar(20), JSON.parse(req.body.TimeOut3[i]).toString())
                        .input('TimeIn4', sql.VarChar(20), JSON.parse(req.body.TimeIn4[i]).toString())
                        .input('TimeOut4', sql.VarChar(20), JSON.parse(req.body.TimeOut4[i]).toString())
                        .input('HoursPerDay', sql.Int, parseInt(req.body.HoursPerDay[i]))
                        .input('MobilityWalkingMovingFlag', sql.Bit, (req.body.MobilityWalkingMovingFlag[i] == 'true'))
                        .input('BathingShoweringFlag', sql.Bit, (req.body.BathingShoweringFlag[i] == 'true'))
                        .input('DressingFlag', sql.Bit, (req.body.DressingFlag[i] == 'true')) // PAF ID---
                        .input('ToiletingFlag', sql.Bit, (req.body.ToiletingFlag[i] == 'true'))
                        .input('EatingFlag', sql.Bit, (req.body.EatingFlag[i] == 'true'))
                        .input('ContinenceBladderBowelFlag', sql.Bit, (req.body.ContinenceBladderBowelFlag[i] == 'true'))
                        .input('MealPrepIncludingFlag', sql.Bit, (req.body.MealPrepIncludingFlag[i] == 'true'))
                        .input('LaundryFlag', sql.Bit, (req.body.LaundryFlag[i] == 'true'))
                        .input('LightHousekeepingIncludingFlag', sql.Bit, (req.body.LightHousekeepingIncludingFlag[i] == 'true'))
                        .input('PersonalCareHours', sql.Int, new Date())
                        .input('HomemakingHours', sql.Int, req.body.GPSLocationOfSubmission.toString() ? req.body.GPSLocationOfSubmission.toString() : '') // GPS ---
                        .input('CompanionHours', sql.Int, '/public/images/' + req.body.DCNImageFileName + '.png') // ImageOfDCN
                        .input('RespiteHours', sql.Int, req.body.PDFOfDCN.toString() ? req.body.PDFOfDCN.toString() : '') // PDFOfDCN --- 
                        .input('AttendantHours', sql.Int, req.body.author.toString())
                        .input('createdBy', sql.VarChar(1000), req.body.author.toString())
                        .input('created', sql.DateTime, new Date())
                        .input('updatedBy', sql.VarChar(1000), req.body.author.toString())
                        .input('updated', sql.DateTime, new Date())
                        .query('INSERT INTO DcnSubmittedHeader (DcnId, DayOfWeek, LastSaturdayDate, ' + 
                                'HourlyFlag, LiveInFlag, OvernightFlag, WeekTotalHours, ComplianceFlag, CaregiverSignature, ' + 
                                'CaregiverSignatureDate, ClientSignature, ClientSignatureDate, HasPAF, PafId, SendToPhoneFlag, ' + 
                                'Phone1, Phone2, SendToEmailFlag, Email1, Email2, DateTimeOfSubmission, ' + 
                                'GPSLocationOfSubmission, ImageOfDCN, PDFOfDCN, createdBy, created, updatedBy, updated) OUTPUT INSERTED.DcnHeaderId ' + 
                                'VALUES (@DcnId, @DayOfWeek, @LastSaturdayDate, @HourlyFlag, @LiveInFlag, @OvernightFlag, ' + 
                                '@WeekTotalHours, @ComplianceFlag, @CaregiverSignature, @CaregiverSignatureDate, ' + 
                                '@ClientSignature, @ClientSignatureDate, @HasPAF, @PafId, @SendToPhoneFlag, @Phone1, @Phone2, ' + 
                                '@SendToEmailFlag, @Email1, @Email2, @DateTimeOfSubmission, @GPSLocationOfSubmission, ' + 
                                '@ImageOfDCN, @PDFOfDCN, @createdBy, @created, @updatedBy, @updated)');
        }).then(result => {
            console.log('=== result DCN Detail ===', result);
            
            
        }).catch(err => {
            console.log('=== DCN Submitted err ===', err);
            res.status(500).send({status: 2, msg: 'Failed to connect server'});
            sql.close();
        });
    }
}