    const DB = 'sqlite'   
    global.TextEncoder = require("util").TextEncoder;
    global.TextDecoder = require("util").TextDecoder;
    let utils = require('./utils') ;
    const isEmpty = utils.isEmpty
    let buildWhere = utils.buildWhere
    let db = null
    let mongodb = null
    let _connected = false
    const moment = require("moment");
    module.exports = (config) => {
        let buildinsert = (olist,table)=>{
            let values = []
            let insert = []
            let vals = []
            if(isEmpty(table)){
                table = "consentFeed"
            }
            Object.keys(olist).forEach( (element,key)=> {
                if(! ["_id","id","patient","trigeringQE","collectingSource","consent","operationData","destinationQE"].includes(element)){
                     let dat = olist[element]
                    if(typeof dat == 'object'){
                        dat = JSON.stringify(dat)
                    }
                    values.push( dat)
                    vals.push("?")
                    insert.push(element)
                }
            })
            return ({qry:` INSERT INTO ${table} (${insert}) VALUES (${vals} )` ,values})
 
        }
        //--------------------------------------------
        let buildSql = (olist,table)=>{
            if(isEmpty(table)){
                table = "consentFeed"
            }
            let where = "";
            let set = ""
            let select = olist.select ?olist.select:""
            let and = {}
            let or = {} //{ $and: [{ $or: [ { type: 'new' }, { ext:'update' } ] } ]}
            let qry = olist.qry ? olist.qry:"and"
            Object.keys(olist).forEach( (element,key)=> {
                if(olist[element]){
                 
                    if(! ["select","cargo","notes","date_time","qry","_search","nd","rows","page","sord"].includes(element)){
                        let o = {}
                        o[element] = olist[element]
                        if(! and.$and) and.$and=[];
                        and.$and.push(o)
                        //---------------------------
                        if(! or.$and) or.$and=[{}];
                        if(! or.$and[0].$or) or.$and[0] = {$or:[]}
                        or.$and[0].$or.push(o)
                        where += ((where == "") ? "where " : " and " ) +` ${element} = '${olist[element]}'`;
                        set += ((set == "") ? "set " : " , " ) +` ${element} = '${olist[element]}'`;
                    }
                }
            })
            select =  select == ""? ` select * from  ${table}`:` select ${select} from  ${table}`
            let find = qry=='and'?and:or;
            return {where,set,select,and,or,find};
        }   
        //-----------------------------------------------------------------------------------
        let mongoSave = (collection,data,callback)=>{
            const mongodb = require("mongodb").MongoClient
            const mongo  = config.mongo_db && config.mongo_db.cch ?config.mongo_db.cch : {"url":"mongodb://localhost:27017/cch",  "db":"cch","collection":collection};
            let url = mongo.url
            mongodb.connect( url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
                if (err) throw err;
                client
                .db(mongo.db)
                .collection(collection)
                .insertMany(data, (err, res) => {
                    if(err) console.log(err)
                    if(callback){
                        callback(err,res);
                    }
                    client.close();
                });
            });
        }
        //-----------------------------------------------------------------------------------
        function mongoFind(collection,qry,callback) {  
            const mongodb = require("mongodb").MongoClient;
            const mongo  = config.mongo_db && config.mongo_db.cch ?config.mongo_db.cch : {"url":"mongodb://localhost:27017/cch",  "db":"cch","collection":collection};
            let url = mongo.url
            utils.testConnection(url,(err,available)=>{
                if(available == true) {
                    let results = mongodb.connect( url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
                        if (err) {           
                            console.log(err)
                            callback(err,null)
                        } else {
                            client.db(mongo.db).collection(collection).find(qry).sort({timestamp:1}).toArray((err,res)=>{          
                                if(err) console.log(err)  
                                callback(err,res)
                                client.close();
                            });
                        }
                    });
                } else {
                    callback(err,null)
                }
            })
        }
        //----------------------------------------
        function mongoUpdate(collection,qry,update,callback) {  
            
            const mongodb = require("mongodb").MongoClient;
            const mongo  = config.mongo_db && config.mongo_db.cch ?config.mongo_db.cch : {"url":"mongodb://localhost:27017/cch",  "db":"cch","collection":collection};
            let url = mongo.url
            let results = mongodb.connect( url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
            if (err) console.log("%j",err)
            client
                .db(mongo.db)
                .collection(collection)
                .updateOne(qry,update, (err, doc)=> {
                    if(err) console.log(err)
                   callback(err,doc)
                  })
            });
           
        }
        //--------------------------------------------------------------------
        let sqliteOpen  = (config,callback)=>{
            const sqlite3 = require('sqlite3');
            let fs = require('fs');
            if (! _connected ){
                //console.log(config)
                let sqlite = config.sqlite.cch
                if ( fs.existsSync(sqlite.schema)) {
                    try {
                        db = new sqlite3.Database(sqlite.schema);
                        _connected = true ;
                    } catch(ex){
                        _connected = false ;
                    
                    } finally {
                        if(callback){
                            callback(_connected)
                        }
                    }
                } else {
                    db = new sqlite3.Database(sqlite.schema);
                    let qry=""
                    if(sqlite.tables.consentFeed){
                        qry = `CREATE TABLE consentFeed ( ${sqlite.tables.consentFeed.fields} ); `
                        db.serialize( () => {                    
                            db.run(qry, (err) =>{
                                if(sqlite.tables.smpiResults){
                                    qry = `CREATE TABLE smpiResults ( ${sqlite.tables.smpiResults.fields} ); `
                                    db.serialize( () => {                    
                                        db.run(qry, (err) =>{
                                            if(err) console.log(err)
                                            if(callback){
                                                _connected = true ;
                                                callback("connected %s",_connected)
                                            }
                                        })
                                    });
                                }
                            })
                        });
                    } 
                 
                }
                console.log("db starting sqllite %j",db);
                db.on('error',(err)=>{
                    console.error(err);
                    _connected = false ;
                });
            } else {
                callback(_connected)
            }
        }     
        //----------------------------------------------------------------------------------
        let sqliteUpdate  = (data,callback) => {        
            let timestamp = moment().utcOffset(0, true).toDate()  //added for zones
            let sql = buildSql({qename:data.qename,qeoid:data.qeoid,qempi:data.qempi},"consentFeed");
            let recordStatus = data.recordStatus
            let recordStatusReason = data.recordStatusReason
            let smpiid = data.smpiid
            let qry = `UPDATE consentFeed set smpiid=?,recordStatusReason=?, recordStatus=?,timestamp=? ${sql.where} and recordStatus ='active' ` ;
            db.serialize(() => {
                //console.log("updatw qry",qry)
                db.run(qry,[smpiid,recordStatusReason,recordStatus,timestamp], (err)=> {
                    if(err) console.log("Update error:\n%s\n%j ",err);
                    if (callback) {
                        callback(err,[]);
                    }
                })
            })
        }
        //----------------------------------------------------------------------------------
        let sqliteSave = (data,callback)=>{
            sqliteOpen(config,(connected)=>{
                if(connected) {
                    insert(data,(err,result)=>{
                        if(err) console.log(err)
                        callback(err,result)
                    })
                } else {
                    callback(null)
                }
            })
        };
        //----------------------------------------------------------------------------------
        let sqliteGet =  (oParams,table,callback)=> {
                let result= 0;
            let decode = (array,index,callback) =>{  
                if(array && array.length > index) {
                    let element = array[index]
                    let o = JSON.parse(element.cargo)
                    //console.log(element)
                    element.cargo = o
                    decode(array,index+1,callback)
                }else{
                    callback(array)
                }
            }
            let get = (oList,callback) =>{
                let sql =  buildSql(oList,table)
                let order = ""
                if(isEmpty(sql.where)){
                    order = `order by timestamp desc limit 10`
                }
                let qry = ` ${sql.select} ${sql.where} ${order}` ;
               // console.log("sql=",oParams,sql,qry)
                db.serialize( (err) =>{
                    db.all(qry,(err, rows) => {
                       // console.log(rows)
                        if(err) console.log(err)
                        decode(rows,0,(out)=>{
                            if(callback){
                                callback(err,out);
                            }
                        })
                    });
                });
            }
           //----------
            sqliteOpen(config,(connected)=>{
                if(connected) {
                    get(oParams,(err,result)=>{
                        if(err) console.log(err)
                        //console.log(result)
                        callback(err,result)
                    })
                } else {
                    callback(null)
                }
            })
        };
        //----------------------------------------------------------------------------------
        let insert  = (data,callback) => {
            let d = new Date(); 
            let timestamp = moment().utcOffset(0, true).toDate()  //added for zones
        
            data.creationDate = timestamp
            data.timestamp = timestamp
            let ins = buildinsert(data,"consentFeed")
            let qry = ins.qry
            db.serialize( () => {
                db.run(qry,ins.values, (err)=> {
                        if(err) console.trace("Insert error:\n%s\n%j ",err,qry);
                    if (callback) {
                        callback(err,[]);
                    }
                })
            })
        }
        //------------------------------------------------------
        module.saveReceived = (data,callback) =>{ // for mongodb only
            let timestamp = moment().utcOffset(0, true).toDate()  //added for zones                
            let dat = data
            data.id = utils.getuuid()
            data.qeoid  = dat.trigeringQE.oid
            data.qename  = dat.trigeringQE.code
            data.qempi  = dat.trigeringQE.mpi.current.value
            data.sourceOID =  dat.collectingSource.oid
            data.sourceType =  dat.collectingSource.type
            data.sourceCode =  dat.collectingSource.code
            data.consentCode =  dat.consent.status
            data.consentSignatureDate = dat.consent.signedDate
            data.smpiid  = dat.smpiid
            data.processingStatus = "Recieved"
            data.recordStatus = ""
            data.recordStatusReason = dat.recordStatusReason
            data.triggeredBy = "QE-Enrollment"

            data.timestamp  = timestamp
            data.creationDate  = timestamp
            mongoSave('received',[data],(err,result)=>{
                callback(err,result)
            })
        }      
        //--------------------------------------------------
        module.updateReceived = (data,msg,callback) =>{ //mongo only
            if(isEmpty(msg)) msg ="PROCESSED"
            let collection = "received"
            let d = new Date();
            let timestamp = moment(d).utcOffset(0, true).toDate()  //added for zones
            let id = data.id
            let qry = {id}
            let update = {$set:{processingStatus:"PROCESSED",timestamp}}
            const mongodb = require("mongodb").MongoClient;
            const mongo  = config.mongo_db && config.mongo_db.cch ?config.mongo_db.cch : {"url":"mongodb://localhost:27017/cch",  "db":"cch","collection":collection};
            let url = mongo.url
            let results = mongodb.connect( url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
            if (err) console.log("%j",err)
            client
                .db(mongo.db)
                .collection(collection)
                .updateOne(qry,update, (err, doc)=> {
                    if(err) console.log(err)
                   callback(err,doc)
                  })
            });
        }
        //------------------------------------------------------
        module.saveNotifications = (data,callback) =>{ // for mongodb only
            let timestamp = moment().utcOffset(0, true).toDate()  //added for zones   
           // console.log("mogo niotification",data)
            if(data && data[0])  {           
                   
                    mongoSave('notifications',data,(err,result)=>{
                        callback(err,result)
                    })
            } else {
                callback({"error":"No Data"},[])
            }
        }
        //------------------------------------------------------
        module.getNotifications = (oParams,callback) =>{ // for mongodb only    
            let table = 'notifications'
            let sql =  buildSql(oParams,table)
            mongoFind(table,sql.find,(err,data)=>{
                callback(err,data)
            })
        }
        //-----------------------------------------------------
        module.save = (collection,data,callback) =>{
            if( ! isEmpty(data ) ){
             
                
                    let out= data
                    out.receivedID = data.id
                  
                    
                    out.timestamp  = timestamp
                    
/*
                    out.firstName = data[0].patient.name[0].given[0]
                    out.middleName =    data[0].patient.name[0].given[1] ?data[0].patient.name[0].given[1]:"n/a"
                    out.familyName = data[0].patient.name[0].family
                    out.dob = data[0].patient.birthDate
                    out.phone = data[0].patient.telecom[0].value
                    out.gender= data[0].patient.gender
                    out.streetline1= data[0].patient.address[0].line[0]
                    out.streetline2=  data[0].patient.address[0].line[1] ? data[0].patient.address[0].line[1]:"n/a"
                    out.city= data[0].patient.address[0].city
                    out.state= data[0].patient.address[0].state
                    out.zipCode= data[0].patient.address[0].postalCode
*/
                    buildinsert(out)
                    sqliteSave(out,(err,result)=>{
                        callback(err,result)
                    })
                
            } else {
                callback("No Data",[])
            }
        }
        //-----------------------------------------------------
        module.update = (oParams,data,callback) =>{  
            let d = new Date();
            let timestamp = moment(d).utcOffset(0, true).toDate()  //added for zones
            let out= data[0]
            out.timestamp  = timestamp
            sqliteUpdate(out,"consentFeed",(err,result)=>{
                callback(err,result)
            })
        }  
        //-----------------------------------------------------
        module.consentFeedSave = (data,callback) =>{
            if( ! isEmpty(data ) ){
                sqliteOpen(config,(connected)=>{
                    if(connected) {
                        let d = new Date(); 
                        let timestamp = moment().utcOffset(0, true).toDate()  //added for zones
                        data.receivedID = data.id
                        data.creationDate = timestamp
                        data.timestamp = timestamp
                        let ins = buildinsert(data,"consentFeed")
                        let qry = ins.qry
                        db.serialize( () => {
                            db.run(qry,ins.values, (err)=> {
                                if(err) console.trace("Insert error:\n%s\n%j ",err,qry);
                                if (callback) {
                                    callback(err,[]);
                                }
                            })
                        })
                    } else {
                        callback(null)
                    }
                })
            
            } else {
                callback("No Data",[])
            }
        }
        //-----------------------------------------------------
        module.consentFeedUpdate = (data,callback) =>{  
            let d = new Date();
            let timestamp = moment(d).utcOffset(0, true).toDate()  //added for zones
            data.timestamp = timestamp
            let sql = buildSql({qename:data.qename,qeoid:data.qeoid,qempi:data.qempi},"consentFeed");
            let recordStatus = data.recordStatus     
            let processingStatus = data.processingStatus
            let recordStatusReason = data.recordStatusReason
            let smpiid = data.smpiid
            let id = data.id
  //          let qry = `UPDATE consentFeed set smpiid=?,processingStatus=?, recordStatus=?,timestamp=? ${sql.where} and id='${id}' ` ;
            let qry = `UPDATE consentFeed set smpiid=?,recordStatusReason=?, processingStatus=?, recordStatus=?,timestamp=? where id='${id}' ` ;
            db.serialize(() => {
                //console.log("updatw qry",qry)
                db.run(qry,[smpiid,recordStatusReason,processingStatus,recordStatus,timestamp], (err)=> {
                    if(err) console.log("consentFeedUpdate error:\n%s\n%j ",err);
                    if (callback) {
                        callback(err,[]);
                    }
                })
            })
        }
      
        //-----------------------------------------------------
        module.get= (oParams,table,callback) =>{
           if(DB=='mongo'){
                let sql =  buildSql(oParams,table)
                mongoFind(table,sql.find,(err,data)=>{
                    callback(err,data)
                })
            }
            if(DB=='sqlite'){
            
                if(_connected){
                    sqliteGet(oParams,table,(err,result)=>{
                        callback(err,result)
                    })
                } else {
                    sqliteOpen(config,(err)=>{
                        sqliteGet(oParams,table,(err,result)=>{
                            callback(err,result)
                        })
                    })
                }
            }
        }
        //-----------------------------------------------------
        module.getReceived= (oParams,callback) =>{
            let collection = 'received'
            let sql =  buildSql(oParams,collection)     
            mongoFind(collection,sql.find,(err,data)=>{
                callback(err,data)
            })
        }
        //------------------------------------------------------
        module.saveTest = (data,callback) =>{ // for mongodb only
            let timestamp = moment().utcOffset(0, true).toDate()  //added for zones   
            if(data && data[0])  {           
               
                mongoSave('tests',data,(err,result)=>{
                    callback(err,result)
                })
            } else {
                callback({"error":"No Data"},[])
            }
        }
        //-----------------------------------------------------
        module.getTests= (oParams,callback) =>{
            let collection = 'tests'
            let sql =  buildSql(oParams,collection)
            mongoFind(collection,sql.find,(err,data)=>{
                callback(err,data)
            })
        }
        //--------------------------------------------
        module.smpiResultsSave = (smpidata,callback) =>{
            sqliteOpen(config,(connected)=>{
                if(connected) {
                    smpidata.cargo = JSON.stringify(smpidata,null,4)
                    db.serialize( () => {
                        db.all("select seq from sqlite_sequence where name = 'smpiResults' ",(err, rows) => {
                            if(err) console.trace("sequence error:\n%s\n%j ",err,qry);
                            smpidata.consentFeedID = rows[0].seq
                            let ins = buildinsert(smpidata,"smpiResults")
                            let qry = ins.qry
                            db.run(qry,ins.values, function(err) {    
                                if(err) console.trace("Insert error:\n%s\n%j ",err,qry);
                                if (callback) {
                                    callback(err,[]);
                                } 
                            })
                        })
                    })
                } else {
                    callback({error:"database not connected"},[])
                }
            })
        }
        //--------------------------------------------------
        module.smpiResultsUpdate = (smpidata,callback) =>{
            if(smpidata){
                sqliteOpen(config,(connected)=>{
                    if(connected) {
                        let moment = require("moment")
                        let timestamp = moment(new Date()).utcOffset(0, true).toDate()  //added for zones
                    //  let id = smpidata.id
                    // smpidata.timestamp = timestamp
                        let id = smpidata.id
                        //console.log("smpidata=",smpidata)
                        let status = 'processed'
                        let qry = `UPDATE smpiResults set status=?,timestamp=? where id='${id}' ` ;
                        db.serialize(() => {
                            db.run(qry,[status,timestamp], (err)=> {
                                if(err) console.log("updatesmpiResults error:\n%s\n%j ",err);
                                if (callback) {
                                    callback(err,[]);
                                }
                            })
                        })
                    } else {
                        callback(null,[])
                    }
                })
            } else {
                callback({error:"no data"},[])
            }
        }
        //--------------------------------------------------
        module.smpiResultsGet = (msg,callback) =>{ //mongo only
            if(isEmpty(msg)) msg ="waiting"
            sqliteOpen(config,(connected)=>{
                if(connected) {
                    let qry = ` select * from smpiResults where status = '${msg}' order by timestamp desc ` ;
                    // console.log("sql=",oParams,sql,qry)
                     db.serialize( (err) =>{
                         db.all(qry,(err, rows) => {
                           // console.log(rows)
                            if(err) console.log(err)
                            if(callback){
                                callback(err,rows);
                            }
                         });
                     });
                } else {
                    callback(null,[])
                }
            })
            
        }
//--------------------------------------------
        return module
}

