const utils = require('./utils.js')
const config = require('../config.json').sqlite
const DICT_TABLE = 'hl7';
const DICT_DB = 'hl7.db'
let _connected = false;
let fs = require('fs') ;
var db = '';
const isEmpty =  utils.isEmpty; 
const buildWhere = utils.buildWhere
let sqlite3 = require('sqlite3').verbose();
module.exports = ()=> {
    module.connected = ()=> {
        return _connected;
    }
    //----------------------------------------------------------------------------------
    let close = module.close = (callback)=> {
        db.close((err)=>{
            if(callback){
                callback(err)
            }
        });
    }
    //---------------------------------------------------------------------------------
    let query = module.query = (qry,callback)=>{
      //  db.serialize(()=>{
            db.all(qry, (err, rows) =>{
                if (callback) {
                    callback(err,rows) ;
                }
            });         
      //  });        
    }
    //--------------------------------------------------------------------------------------
    let execute = module.execute = (qry,data,callback) => {
    //    db.serialize(() => {
            db.run(qry,data, (err) =>{
                if (callback) {
                    callback(err,[]);
                }                     
            });
     //   })
    }
    //----------------------------------------------------------------------------------
    let open = module.create = module.open = (schema,callback)=>{
        if(_connected){
           // db.close()
        }
        schema = schema ? schema : config.schema
     //   console.log("schema",schema)
        if ( fs.existsSync(schema)) {
            try {
                db = new sqlite3.Database(schema);
                _connected = true ;
                if(callback){
                    callback("connected %s",_connected)
                }
            } catch(ex){
                _connected = false ;
            }
        } else {
            db = new sqlite3.Database(schema);
          
            let qry = `CREATE TABLE hl7 ( 
                type CHAR(10) ,
                mpi CHAR(32) ,
                lname CHAR(32),
                fname CHAR(32),
                dob CHAR(16),
                gender CHAR(2),
                phoneh CHAR(32),
                phoneb CHAR(32),
                ssn CHAR(32),
                address CHAR(128),
                parent CHAR(252) ,
                cargo BLOB,
                date datetime ,
                flags INT ) ; `
            try{                
                _connected = true ;
                db.serialize(() => {                    
                    db.run(qry,(err)=>{
                        if(err) console.log("SQLITE ERROR RUN",err)
                    });    
                });
                //db.close();
            } catch(ex){
                _connected = false ;
                console.trace(ex);
            }
        }
        if(callback){
            callback( _connected)
        }
      
    }     
    if(isEmpty(db)){
       // open()
    }
    return module;
}