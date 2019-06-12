const sql = require('mssql');
var moment = require('moment');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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

// ================================ CREATE DCN ============================ //
// ------------------------- SAVE DCN HEADER ------------------------ //
exports.save = function(req, res) {
    sql.close();
    // -- Generate DCN pdf from DCN png
    const doc = new PDFDocument();
    var pngPath = 'public/images/ImageOfDCN_' + req.body.DCNImageFileName + '.png';
    console.log('=== png path ===', pngPath);
    try {
        if (fs.existsSync(pngPath)) {
            //file exists
            var pdfPath = 'public/docs/PDFOfDCN_' + req.body.DCNImageFileName + '.pdf';
            doc.pipe(fs.createWriteStream(pdfPath));
            doc.image(pngPath, {
                fit: [470, 600],
                align: 'center',
                valign: 'center'
            });
            doc.save();
            doc.end();
        }
    } catch(err) {
        console.error('== pdf generate err ==', err);
        sql.close();
        res.status(500).send({status: 2, msg: 'Failed to connect server'});
    }
    
    // -- save the DCN Header
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('SocialSecurityNum', sql.VarChar(9), req.body.SocialSecurityNum.toString())
                    .input('ClientId', sql.Int, parseInt(req.body.ClientId))
                    .input('ClientName', sql.VarChar(20), req.body.ClientName.toString())
                    .input('LastSaturdayDate', sql.VarChar(10), req.body.LastSaturdayDate.toString())
                    .input('HourlyFlag', sql.Bit, (req.body.HourlyFlag == 'true'))
                    .input('LiveInFlag', sql.Bit, (req.body.LiveInFlag == 'true'))
                    .input('OvernightFlag', sql.Bit, (req.body.OvernightFlag == 'true'))
                    .input('WeekTotalHours', sql.Float, parseFloat(req.body.WeekTotalHours) ? parseFloat(req.body.WeekTotalHours) : 0)
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
                    .input('ImageOfDCN', sql.VarChar(200), '/public/images/ImageOfDCN_' + req.body.DCNImageFileName + '.png') // ImageOfDCN
                    .input('PDFOfDCN', sql.VarChar(200), '/public/docs/PDFOfDCN_' + req.body.DCNImageFileName + '.pdf') // PDFOfDCN --- 
                    .input('createdBy', sql.VarChar(1000), req.body.author.toString())
                    .input('created', sql.DateTime, new Date())
                    .input('updatedBy', sql.VarChar(1000), req.body.author.toString())
                    .input('updated', sql.DateTime, new Date())
                    .input('TimeInOutLength', sql.Int, parseInt(req.body.TimeInOutLength))
                    .query('INSERT INTO DcnSubmittedHeader (SocialSecurityNum, ClientId, ClientName, LastSaturdayDate, ' + 
                            'HourlyFlag, LiveInFlag, OvernightFlag, WeekTotalHours, ComplianceFlag, CaregiverSignature, ' + 
                            'CaregiverSignatureDate, ClientSignature, ClientSignatureDate, HasPAF, PafId, SendToPhoneFlag, ' + 
                            'Phone1, Phone2, SendToEmailFlag, Email1, Email2, DateTimeOfSubmission, ' + 
                            'GPSLocationOfSubmission, ImageOfDCN, PDFOfDCN, createdBy, created, updatedBy, updated, TimeInOutLength) OUTPUT INSERTED.DcnHeaderId ' + 
                            'VALUES (@SocialSecurityNum, @ClientId, @ClientName, @LastSaturdayDate, @HourlyFlag, @LiveInFlag, @OvernightFlag, ' + 
                            '@WeekTotalHours, @ComplianceFlag, @CaregiverSignature, @CaregiverSignatureDate, ' + 
                            '@ClientSignature, @ClientSignatureDate, @HasPAF, @PafId, @SendToPhoneFlag, @Phone1, @Phone2, ' + 
                            '@SendToEmailFlag, @Email1, @Email2, @DateTimeOfSubmission, @GPSLocationOfSubmission, ' + 
                            '@ImageOfDCN, @PDFOfDCN, @createdBy, @created, @updatedBy, @updated, @TimeInOutLength)');
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

// ------------------------ SAVE DCN DETAIL -------------------------- //

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
                    .input('HoursPerDay', sql.Float, req.body.HoursPerDay ? parseFloat(JSON.parse(req.body.HoursPerDay)[ii]) : 0)
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
        sql.close();
        console.log('=== DCN Detail Submitted err ===', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server in detail step'});
    });
}

// ============================ UPDATE DCN ================================= //
// -------------------------- UPDATE DCN HEADER ------------------------ //
exports.update = function(req, res) {
    sql.close();
    // -- Generate DCN pdf from DCN png
    const doc = new PDFDocument();
    var pngPath = 'public/images/ImageOfDCN_' + req.body.DCNImageFileName + '.png';
    console.log('=== oldDCNFileName ===', req.body.oldImageOfDCN.replace('/', ''));
    try {
        if (fs.existsSync(pngPath)) {
            //file exists
            var pdfPath = 'public/docs/PDFOfDCN_' + req.body.DCNImageFileName + '.pdf';
            doc.pipe(fs.createWriteStream(pdfPath));
            doc.image(pngPath, {
                fit: [470, 600],
                align: 'center',
                valign: 'center'
            });
            doc.save();
            doc.end();
            // old png delete
            var oldPng = req.body.oldImageOfDCN.replace('/', '');
            if (fs.existsSync(oldPng)) {
                fs.unlink(oldPng, function (err) {
                    if (err) throw err;
                })
            }
            // old pdf delete
            var oldPdf = 'public/docs/' + oldPng.split('/')[2].replace('.png', '.pdf').replace('ImageOfDCN', 'PDFOfDCN');
            if (fs.existsSync(oldPng)) {
                fs.unlink(oldPdf, function (err) {
                    if (err) throw err;
                })
            }
        }
    } catch(err) {
        sql.close();
        console.error('== pdf generate err ==', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server.', data: ''});
    }
    
    // -- save the DCN Header
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('DcnHeaderId', sql.Int, parseInt(req.body.DcnHeaderId))
                    .input('SocialSecurityNum', sql.VarChar(9), req.body.SocialSecurityNum.toString())
                    .input('ClientId', sql.Int, parseInt(req.body.ClientId))
                    .input('ClientName', sql.VarChar(20), req.body.ClientName.toString())
                    .input('LastSaturdayDate', sql.VarChar(10), req.body.LastSaturdayDate.toString())
                    .input('HourlyFlag', sql.Bit, (req.body.HourlyFlag == 'true'))
                    .input('LiveInFlag', sql.Bit, (req.body.LiveInFlag == 'true'))
                    .input('OvernightFlag', sql.Bit, (req.body.OvernightFlag == 'true'))
                    .input('WeekTotalHours', sql.Float, parseFloat(req.body.WeekTotalHours) ? parseFloat(req.body.WeekTotalHours) : 0)
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
                    .input('ImageOfDCN', sql.VarChar(200), '/public/images/ImageOfDCN_' + req.body.DCNImageFileName + '.png') // ImageOfDCN
                    .input('PDFOfDCN', sql.VarChar(200), '/public/docs/PDFOfDCN_' + req.body.DCNImageFileName + '.pdf') // PDFOfDCN --- 
                    .input('createdBy', sql.VarChar(1000), req.body.author.toString())
                    .input('created', sql.DateTime, new Date())
                    .input('updatedBy', sql.VarChar(1000), req.body.author.toString())
                    .input('updated', sql.DateTime, new Date())
                    .input('TimeInOutLength', sql.Int, parseInt(req.body.TimeInOutLength))
                    .query('UPDATE DcnSubmittedHeader SET SocialSecurityNum=@SocialSecurityNum, ClientId=@ClientId, ' + 
                            'ClientName=@ClientName, LastSaturdayDate=@LastSaturdayDate, HourlyFlag=@HourlyFlag, ' + 
                            'LiveInFlag=@LiveInFlag, OvernightFlag=@OvernightFlag, WeekTotalHours=@WeekTotalHours, ' + 
                            'ComplianceFlag=@ComplianceFlag, CaregiverSignature=@CaregiverSignature, CaregiverSignatureDate=@CaregiverSignatureDate, ' + 
                            'ClientSignature=@ClientSignature, ClientSignatureDate=@ClientSignatureDate, HasPAF=@HasPAF, ' + 
                            'PafId=@PafId, SendToPhoneFlag=@SendToPhoneFlag, Phone1=@Phone1, Phone2=@Phone2, SendToEmailFlag=@SendToEmailFlag, ' + 
                            'Email1=@Email1, Email2=@Email2, GPSLocationOfSubmission=@GPSLocationOfSubmission, ' + 
                            'ImageOfDCN=@ImageOfDCN, PDFOfDCN=@PDFOfDCN, updatedBy=@updatedBy, updated=@updated, TimeInOutLength=@TimeInOutLength ' + 
                            'WHERE DcnHeaderId=@DcnHeaderId');
    }).then(result => {
        console.log('=== result DCN Header ===', result);
        if(result.rowsAffected[0]) {
            sql.close();
            update_details(req, res, 0);
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

// ------------------------------ UPDATE DCN DETAIL --------------------------- //
update_details = function (req, res, index) {
    sql.close();
    console.log('****************************************');
    console.log('**** DcnHeaderId(UPDATE) ****', req.body.DcnHeaderId);
    console.log('****************************************');
    var DcnHeaderId = parseInt(req.body.DcnHeaderId);
    var DcnDetailIds = JSON.parse(req.body.DcnDetailIds);
    var ii = parseInt(index);
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('DcnId', sql.Int, DcnHeaderId)
                    .input('DcnDetailId', sql.Int, parseInt(DcnDetailIds[ii]))
                    .input('DayOfWeek', sql.VarChar(20), JSON.parse(req.body.DCNWeek)[ii] ? JSON.parse(req.body.DCNWeek)[ii].toString() : '')
                    .input('TimeIn1', sql.VarChar(20), JSON.parse(req.body.TimeIn1)[ii] ? JSON.parse(req.body.TimeIn1)[ii].toString() : '')
                    .input('TimeOut1', sql.VarChar(20), JSON.parse(req.body.TimeOut1)[ii] ? JSON.parse(req.body.TimeOut1)[ii].toString() : '')
                    .input('TimeIn2', sql.VarChar(20), JSON.parse(req.body.TimeIn2)[ii] ? JSON.parse(req.body.TimeIn2)[ii].toString() : '')
                    .input('TimeOut2', sql.VarChar(20), JSON.parse(req.body.TimeOut2)[ii] ? JSON.parse(req.body.TimeOut2)[ii].toString() : '')
                    .input('TimeIn3', sql.VarChar(20), JSON.parse(req.body.TimeIn3)[ii] ? JSON.parse(req.body.TimeIn3)[ii].toString() : '')
                    .input('TimeOut3', sql.VarChar(20), JSON.parse(req.body.TimeOut3)[ii] ? JSON.parse(req.body.TimeOut3)[ii].toString() : '')
                    .input('TimeIn4', sql.VarChar(20), JSON.parse(req.body.TimeIn4)[ii] ? JSON.parse(req.body.TimeIn4)[ii].toString() : '')
                    .input('TimeOut4', sql.VarChar(20), JSON.parse(req.body.TimeOut4)[ii] ? JSON.parse(req.body.TimeOut4)[ii].toString() : '')
                    .input('HoursPerDay', sql.Float, req.body.HoursPerDay ? parseFloat(JSON.parse(req.body.HoursPerDay)[ii]) : 0)
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
                    .query('UPDATE DcnSubmittedDetail SET DayOfWeek=@DayOfWeek, TimeIn1=@TimeIn1, TimeOut1=@TimeOut1, ' + 
                            'TimeIn2=@TimeIn2, TimeOut2=@TimeOut2, TimeIn3=@TimeIn3, TimeOut3=@TimeOut3, TimeIn4=@TimeIn4, ' + 
                            'TimeOut4=@TimeOut4, HoursPerDay=@HoursPerDay, MobilityWalkingMovingFlag=@MobilityWalkingMovingFlag, ' + 
                            'BathingShoweringFlag=@BathingShoweringFlag, DressingFlag=@DressingFlag, ToiletingFlag=@ToiletingFlag, ' + 
                            'EatingFlag=@EatingFlag, ContinenceBladderBowelFlag=@ContinenceBladderBowelFlag, MealPrepIncludingFlag=@MealPrepIncludingFlag, ' + 
                            'LaundryFlag=@LaundryFlag, LightHousekeepingIncludingFlag=@LightHousekeepingIncludingFlag, ' + 
                            'PersonalCareHours=@PersonalCareHours, HomemakingHours=@HomemakingHours, CompanionHours=@CompanionHours, ' + 
                            'RespiteHours=@RespiteHours, AttendantHours=@AttendantHours, updatedBy=@updatedBy, updated=@updated ' + 
                            'WHERE DcnId=@DcnId AND DcnDetailId=@DcnDetailId');
    }).then(result => {
        console.log('=== result DCN Detail(UPDATE) ===', result, '******', ii);
        sql.close();
        if(ii >= 6) {
            if (result.rowsAffected[0]) {
                res.status(200).send({status: 0, msg: 'Successfully saved.', data: ''});
            } else {
                res.status(400).send({status: 1, msg: 'Failed to connect database.', data: ''});
            }
        } else {
            if(result.rowsAffected[0]) {
                update_details(req, res, ii + 1);
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

// ============================== READ DCN ============================== //
// -------------------------- READ DCN ITEMS LIST ---------------------- //
exports.read = function(req, res) {
    sql.close();
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('SocialSecurityNum', sql.VarChar(9), req.body.SocialSecurityNum.toString())
                    .input('ClientId', sql.Int, parseInt(req.body.ClientId))
                    .input('LastSaturdayDate', sql.VarChar(10), req.body.LastSaturdayDate.toString())
                    .query('SELECT DcnHeaderId, ClientName, LastSaturdayDate FROM DcnSubmittedHeader WHERE SocialSecurityNum = @SocialSecurityNum AND ClientId = @ClientId AND LastSaturdayDate = @LastSaturdayDate');
    }).then(result => {
        sql.close();
        console.log('=== Getting DCN Items - Result: ===', result);
        if(result.rowsAffected[0]) {
            res.status(200).send({status: 0, msg: '', data: JSON.stringify(result.recordset)});
        } else {
            res.status(400).send({status: 1, msg: 'There is no the matched result', data: ''});
        }
    }).catch(err => {
        sql.close();
        console.log('=== Getting DCN Items - Error: ===', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server.', data: ''});
    })
}

// ----------------------- READ A DCN HEADER DATA --------------------- //
exports.read_detail = function(req, res) {
    sql.close();
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('DcnHeaderId', sql.Int, parseInt(req.body.DcnHeaderId))
                    .query('SELECT * FROM DcnSubmittedHeader WHERE DcnHeaderId = @DcnHeaderId');
    }).then(result => {
        sql.close();
        console.log('=== Getting DCN Items - Result: ===', result.rowsAffected[0]);
        if(result.rowsAffected[0]) {
            var DCNObj = result.recordset[0];
            get_DCNDetail(req, res, DCNObj);
        } else {
            res.status(400).send({status: 1, msg: 'There is no the matched result', data: ''});
        }
    }).catch(err => {
        sql.close();
        console.log('=== Getting DCN Items - Error: ===', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server.', data: ''});
    })
}

// ----------------------- GET DCN DETAIL DATA ------------------------ //
function get_DCNDetail(req, res, DCNObj) {
    sql.close();
    var DcnHeaderId = parseInt(DCNObj.DcnHeaderId);
    new sql.connect(config).then(pool => {
        return pool.request()
                    .input('DcnId', sql.Int, DcnHeaderId)
                    .query('SELECT * FROM DcnSubmittedDetail WHERE DcnId = @DcnId');
    }).then(result => {
        console.log('=== Getting DCN Items Details - Result: ===', result.rowsAffected[0]);
        if(result.rowsAffected[0]) {
            var rows = result.recordset;
            var DCNWeekArr = []; var TimeIn1Arr = []; var TimeOut1Arr = [];
            var TimeIn2Arr = []; var TimeOut2Arr = []; var TimeIn3Arr = [];
            var TimeOut3Arr = []; var TimeIn4Arr = []; var TimeOut4Arr = [];
            var HoursPerDayArr = []; var MobilityWalkingMovingFlag = [];
            var BathingShoweringFlag = []; var DressingFlag = [];
            var ToiletingFlag = []; var EatingFlag = [];
            var ContinenceBladderBowelFlag = []; var MealPrepIncludingFlag = [];
            var LaundryFlag = []; var LightHousekeepingIncludingFlag = [];
            var PersonalCareHours = 0; var HomemakingHours = 0; var CompanionHours = 0;
            var RespiteHours = 0; var AttendantHours = 0; 
            var selectedWeekArr = []; // ref
            var DcnDetailIdArr = []; // ref
            DCNObj.PersonalCareHours = PersonalCareHours; DCNObj.HomemakingHours = HomemakingHours;
            DCNObj.CompanionHours = CompanionHours; DCNObj.RespiteHours = RespiteHours;
            DCNObj.AttendantHours = AttendantHours;
            for (var i = 0; i < rows.length; i++) {
                selectedWeekArr.push(rows[i].DayOfWeek.split('-')[2]);
                DcnDetailIdArr.push(rows[i].DcnDetailId);
                DCNWeekArr.push(rows[i].DayOfWeek);
                TimeIn1Arr.push(rows[i].TimeIn1);
                TimeOut1Arr.push(rows[i].TimeOut1);
                TimeIn2Arr.push(rows[i].TimeIn2);
                TimeOut2Arr.push(rows[i].TimeOut2);
                TimeIn3Arr.push(rows[i].TimeIn3);
                TimeOut3Arr.push(rows[i].TimeOut3);
                TimeIn4Arr.push(rows[i].TimeIn4);
                TimeOut4Arr.push(rows[i].TimeOut4);
                HoursPerDayArr.push(rows[i].HoursPerDay);
                MobilityWalkingMovingFlag.push(rows[i].MobilityWalkingMovingFlag);
                BathingShoweringFlag.push(rows[i].BathingShoweringFlag);
                DressingFlag.push(rows[i].DressingFlag);
                ToiletingFlag.push(rows[i].ToiletingFlag);
                EatingFlag.push(rows[i].EatingFlag);
                ContinenceBladderBowelFlag.push(rows[i].ContinenceBladderBowelFlag);
                MealPrepIncludingFlag.push(rows[i].MealPrepIncludingFlag);
                LaundryFlag.push(rows[i].LaundryFlag);
                LightHousekeepingIncludingFlag.push(rows[i].LightHousekeepingIncludingFlag);
            }
            DCNObj.selectedWeek = selectedWeekArr;
            DCNObj.DcnDetailIds = DcnDetailIdArr;
            DCNObj.DCNWeek = DCNWeekArr;
            DCNObj.TimeIn1 = TimeIn1Arr;
            DCNObj.TimeOut1 = TimeOut1Arr;
            DCNObj.TimeIn2 = TimeIn2Arr;
            DCNObj.TimeOut2 = TimeOut2Arr;
            DCNObj.TimeIn3 = TimeIn3Arr;
            DCNObj.TimeOut3 = TimeOut3Arr;
            DCNObj.TimeIn4 = TimeIn4Arr;
            DCNObj.TimeOut4 = TimeOut4Arr;
            DCNObj.HoursPerDay = HoursPerDayArr;
            DCNObj.MobilityWalkingMovingFlag = MobilityWalkingMovingFlag;
            DCNObj.BathingShoweringFlag = BathingShoweringFlag;
            DCNObj.DressingFlag = DressingFlag;
            DCNObj.ToiletingFlag = ToiletingFlag;
            DCNObj.EatingFlag = EatingFlag;
            DCNObj.ContinenceBladderBowelFlag = ContinenceBladderBowelFlag;
            DCNObj.MealPrepIncludingFlag = MealPrepIncludingFlag;
            DCNObj.LaundryFlag = LaundryFlag;
            DCNObj.LightHousekeepingIncludingFlag = LightHousekeepingIncludingFlag;
            console.log('***************************************************');
            console.log('***** ||| DCNOBJECT: ||| *****', DCNObj);
            console.log('***************************************************');
            sql.close();
            res.status(200).send({status: 0, msg: '', data: DCNObj});
        } else {
            sql.close();
            res.status(400).send({status: 1, msg: 'Finding Data does not exist.', data: ''});
        }
    }).catch(err => {
        sql.close();
        console.log('=== Getting DCN Items Details - Error: ===', err);
        res.status(500).send({status: 2, msg: 'Failed to connect server.', data: ''});
    })
}

// =============================== ERROR HANDLER =========================== //
sql.on('error', err => {
    console.log('=== sql connect err ===', err);
    sql.close();
    res.status(500).send({status: 2, msg: 'Failed to connect server'});
})