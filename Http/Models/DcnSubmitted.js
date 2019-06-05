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
    sql.close();
    new sql.connect(config).then(pool => {
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
                    // .query('SELECT DcnHeaderId FROM DcnSubmittedHeader WHERE SocialSecurityNum = @SocialSecurityNum');
    }).then(result => {
        console.log('=== result DCN Header ===', result);
        if(result.rowsAffected[0] && result.recordset[0].DcnHeaderId) {
            sql.close();
            save_details(req, res, result.recordset[0].DcnHeaderId, 0);
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

save_details = function (req, res, DcnHeaderId, index) {
    sql.close();
    console.log('****************************************');
    console.log('**** DcnHeaderId ****', DcnHeaderId);
    console.log('****************************************');
    var ii = parseInt(index);
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('DcnId', sql.Int, DcnHeaderId)
                    .input('DayOfWeek', sql.VarChar(20), JSON.parse(req.body.DCNWeek)[ii] ? JSON.parse(req.body.DCNWeek)[ii].toString() : '')
                    .input('TimeIn1', sql.VarChar(20), JSON.parse(req.body.TimeIn1)[ii] ? JSON.parse(req.body.TimeIn1)[ii].toString() : '')
                    .input('TimeOut1', sql.VarChar(20), JSON.parse(req.body.TimeOut1)[ii] ? JSON.parse(req.body.TimeOut1)[ii].toString() : '')
                    .input('TimeIn2', sql.VarChar(20), JSON.parse(req.body.TimeIn2)[ii] ? JSON.parse(req.body.TimeIn2)[ii].toString() : '')
                    .input('TimeOut2', sql.VarChar(20), JSON.parse(req.body.TimeOut2)[ii] ? JSON.parse(req.body.TimeOut2)[ii].toString() : '')
                    .input('TimeIn3', sql.VarChar(20), JSON.parse(req.body.TimeIn3)[ii] ? JSON.parse(req.body.TimeIn3)[ii].toString() : '')
                    .input('TimeOut3', sql.VarChar(20), JSON.parse(req.body.TimeOut3)[ii] ? JSON.parse(req.body.TimeOut3)[ii].toString() : '')
                    .input('TimeIn4', sql.VarChar(20), JSON.parse(req.body.TimeIn4)[ii] ? JSON.parse(req.body.TimeIn4)[ii].toString() : '')
                    .input('TimeOut4', sql.VarChar(20), JSON.parse(req.body.TimeOut4)[ii] ? JSON.parse(req.body.TimeOut4)[ii].toString() : '')
                    .input('HoursPerDay', sql.Int, req.body.HoursPerDay ? parseInt(JSON.parse(req.body.HoursPerDay)[ii]) : 0)
                    .input('MobilityWalkingMovingFlag', sql.Bit, (JSON.parse(req.body.MobilityWalkingMovingFlag)[ii] == 'true'))
                    .input('BathingShoweringFlag', sql.Bit, (JSON.parse(req.body.BathingShoweringFlag)[ii] == 'true'))
                    .input('DressingFlag', sql.Bit, (JSON.parse(req.body.DressingFlag)[ii] == 'true'))
                    .input('ToiletingFlag', sql.Bit, (JSON.parse(req.body.ToiletingFlag)[ii] == 'true'))
                    .input('EatingFlag', sql.Bit, (JSON.parse(req.body.EatingFlag)[ii] == 'true'))
                    .input('ContinenceBladderBowelFlag', sql.Bit, (JSON.parse(req.body.ContinenceBladderBowelFlag)[ii] == 'true'))
                    .input('MealPrepIncludingFlag', sql.Bit, (JSON.parse(req.body.MealPrepIncludingFlag)[ii] == 'true'))
                    .input('LaundryFlag', sql.Bit, (JSON.parse(req.body.LaundryFlag)[ii] == 'true'))
                    .input('LightHousekeepingIncludingFlag', sql.Bit, (JSON.parse(req.body.LightHousekeepingIncludingFlag)[ii] == 'true'))
                    .input('PersonalCareHours', sql.Int, req.body.PersonalCareHours ? parseInt(req.body.PersonalCareHours) : 0)
                    .input('HomemakingHours', sql.Int, req.body.HomemakingHours ? parseInt(req.body.HomemakingHours) : 0)
                    .input('CompanionHours', sql.Int, req.body.CompanionHours ? parseInt(req.body.CompanionHours) : 0)
                    .input('RespiteHours', sql.Int, req.body.RespiteHours ? parseInt(req.body.RespiteHours) : 0)
                    .input('AttendantHours', sql.Int, req.body.AttendantHours ? parseInt(req.body.AttendantHours) : 0)
                    .input('createdBy', sql.VarChar(1000), req.body.author.toString())
                    .input('created', sql.DateTime, new Date())
                    .input('updatedBy', sql.VarChar(1000), req.body.author.toString())
                    .input('updated', sql.DateTime, new Date())
                    .query('INSERT INTO DcnSubmittedDetail (DcnId, DayOfWeek, TimeIn1, TimeOut1, TimeIn2, TimeOut2, ' + 
                                'TimeIn3, TimeOut3, TimeIn4, TimeOut4, HoursPerDay, MobilityWalkingMovingFlag, ' + 
                                'BathingShoweringFlag, DressingFlag, ToiletingFlag, EatingFlag, ContinenceBladderBowelFlag, ' + 
                                'MealPrepIncludingFlag, LaundryFlag, LightHousekeepingIncludingFlag, PersonalCareHours, HomemakingHours, ' + 
                                'CompanionHours, RespiteHours, AttendantHours, createdBy, created, updatedBy, ' + 
                                'updated) OUTPUT INSERTED.DcnDetailId VALUES (@DcnId, @DayOfWeek, @TimeIn1, @TimeOut1, ' + 
                                '@TimeIn2, @TimeOut2, @TimeIn3, @TimeOut3, @TimeIn4, @TimeOut4, @HoursPerDay, ' + 
                                '@MobilityWalkingMovingFlag, @BathingShoweringFlag, @DressingFlag, @ToiletingFlag, ' + 
                                '@EatingFlag, @ContinenceBladderBowelFlag, @MealPrepIncludingFlag, @LaundryFlag, ' + 
                                '@LightHousekeepingIncludingFlag, @PersonalCareHours, @HomemakingHours, @CompanionHours, ' + 
                                '@RespiteHours, @AttendantHours, @createdBy, @created, @updatedBy, @updated)');
    }).then(result => {
        console.log('=== result DCN Detail ===', result, '******', ii);
        sql.close();
        if(ii >= 6) {
            if (result.recordset[0].DcnDetailId) {
                res.status(200).send({status: 0, msg: 'Successfully saved.', data: ''});
            } else {
                res.status(400).send({status: 1, msg: 'Failed to connect database.', data: ''});
            }
        } else {
            if(result.recordset[0].DcnDetailId) {
                save_details(req, res, DcnHeaderId, ii + 1);
            } else {
                res.status(400).send({status: 1, msg: 'Failed to connect database.', data: ''});
            }
        }
    }).catch(err => {
        console.log('=== DCN Detail Submitted err ===', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server in detail step'});
        sql.close();
    });
}