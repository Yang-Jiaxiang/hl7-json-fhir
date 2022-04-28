
const fs = require('fs');
const path = require('path');

let config,utils,isEmpty,getParams,db = null
!function(){ 
   //==--------------------------------
   let setlocals = (app)=> {    
      dirname = app.get('dirname')
      utils = require(dirname+'/src/utils.js')
      getParams = utils.getParams
      config = app.get('config')
      isEmpty = utils.isEmpty
      db = require(dirname+'/src/hl72db.js')()
      return null
   }
   //-------------------------------------------
   loadjson = (jsonfile)=>{
      let f = fs.readFileSync(jsonfile,"utf-8")
      return (JSON.parse(f))  
   }
   //-----------------------------------------
   let walk = (dir,filter,type ,done) => {
      let results = [];
      fs.readdir(dir, (err, list) => {
      if (err) return done(err);
      var i = 0;
      (function next() {
         var file = list[i++];
         if (!file) return done(null, results);
         file = path.resolve(dir, file);
         fs.stat(file, (err, stat) =>{
            if (stat && stat.isDirectory()) {
            walk(file, filter,type,(err, res) =>{
               results = results.concat(res);
               next();
            });
            } else {
               let ext = path.extname(file)
               if(type=='readexclude'){
                  //check for results also
                  if([".DB-journal"].includes(ext)){
                     console.log("removing journal:",file)
                     fs.unlinkSync(file)
                     dbfile = file.replace("-journal","")
                     console.log("removing db:",dbfile)
                     fs.unlinkSync(dbfile)
                  }
                  if(! filter.includes(ext)){  
                     results.push({mode:"readexclude file",file,dir:dir+"\\",filename:file.replace(dir+"\\","")});
                  }
               } else if(type=='deletecons'){
                  if([".consolidated"].includes(ext)){
                     let dbfile = file+".DB"
                     if(! fs.existsSync(dbfile)) {
                        console.log("deletecons removing:",file)
                        fs.unlinkSync(file)
                     }
                  }
               } else {
                  if (filter == "*" || filter.includes(ext)) {
                     if(type=='read'){
                        results.push({mode:"read file",file,dir:dir+"\\",filename:file.replace(dir+"\\","")});
                     } 
                     if(type=='delete'){
                        if( fs.existsSync(file)) {
                           console.log("delete removing:",file)
                           fs.unlinkSync(file)
                           results.push({mode:"deleted file",file,dir:dir+"\\",filename:file.replace(dir+"\\","")});
                        }
                     }
                  }
               }
               next();
            }
         });
      })();
      });
   };
   //----------------------------------------------------
   let readFiles = (req,res) =>{
      let params = getParams(req)
      let hl7config = loadjson(dirname+'/data/hl72json.json')
      let dir = config.hl7Directory
      let filter = params.filter?params.filter:"*"
      if(fs.existsSync(dir)){
         walk(dir,filter,'read',(err, filelist) =>{
            res.send(filelist)
         })
      }else{
         res.send([{file:"directory '"+dir+"' not found"}])
      }
   }
   //----------------------------------------------------
   let fileviewer = (req,res) =>{
      res.render("filelist.ejs",{page_title:"HL7 Viewer" })
   }
   //------------------------------------------------------------------------------------------
   let hl7viewer = (req,res) =>{
      let params = getParams(req)
      let _filename = params.filename
      let _data = params.data
      parsehl7(_data,(recs)=>{
         res.render("hl7list.ejs",{page_title:"HL7 Viewer",_filename,_data:recs})
      })
   }
   //---------------------------------------------------
   let bulksave = (qrylist,callback) => {
      console.log("CallingBulk save")
      let save = (qrylist,index,callback)=>{
         if(qrylist.length < index){
            let qry = qrylist[index].qry
            let data = qrylist[index].data
            db.execute(qry,data, (err)=>{
               if(err){
                  console.log("Insert error:\n%s ",err)
               }
               save(qrylist,index+1,callback)
            })
         } else {
            callback("OK")
         }
      }
      save(qrylist,0,(result)=>{
         callback(result)
      })
   }
   //---------------------------------------
   let togrid = (req,res) =>{
      let params = getParams(req)
      let data = params.data 
      parsehl7(data,(recs)=>{
         res.send(recs)
      })
   }
   //----------------------------------------
   let parsehl7 = (msg,callback) =>{
      let recs = []
      let grp = 0
      let MSH = {}
      if(msg) {
         let amsg = msg.split("\n")
         amsg.forEach((elem,i)=>{
            elem = elem.trim()
            if(! isEmpty(elem)){
               let sep = "|"//elem[3]
               let type = elem.split(sep)
               let field = type[0].trim()
               let o = {}
               if (field == 'MSH') {
                  MSH = type[8] +"-"+type[2]+"-"+type[3]+"-"+type[4]+"-"+type[5]+"-"+type[6]
                  grp+=1
                  type.splice(1, 0, sep);
                  type.forEach((elem,i)=>{
                     if(i > 2){
                        if(elem.includes("^")){
                           elem = elem.split("^")
                        }
                     }
                     o[type[0]+"_"+(i)+""] = elem               
                  })          
               }else{
                  type.forEach((elem,i)=>{
                     elem = elem.trim()
                     if(elem.includes("^")){
                        elem = elem.split("^")
                        elem.forEach((e,ii)=>{
                           if(e.includes("~")){
                              elem[ii] = e.split("~")
                           }  
                           if(e.includes("&")){
                              elem[ii] = e.split("&")
                           }   
                        })
                     } else if(elem.includes("&")){
                        elem = elem.split("&")
                     } else if(elem.includes("~")){
                        elem = elem.split("~")
                     }
                     o[type[0]+"_"+i+""] = elem
                  })
               }
               o.type=type[0].trim() 
               o.grp = "Message_"+String(grp).padStart(3, '0')+"_"+MSH
               o.field = field
              // console.log("o=\n",o)
               recs.push(o)
            }
         })
      }
      if(callback){
         callback(recs)
      } else {
         return(recs)
      }
   }
   //----------------------------------------------------------------
   let hl72json = (req,res) =>{
      let params = getParams(req)
      let data = params.data
      if(! isEmpty(params.filename)) {
         let filename = `${params.filename}`
         fs.readFile(filename, 'utf8' , (err, _data) => {
            if (err) console.error(err)
            parsehl7(_data,(out)=>{
               res.send(out)
            })
         })
      } else { 
         if(! isEmpty(data)) {
            let out = parsehl7(data)
            res.send( out)
         } else {
            res.send({})
         }
      }
   }
   //----------------------------------------------------------------
   let convert2json = (req,res) =>{
      let params = getParams(req)
      let _data = params.data
      parsehl7(_data,(out)=>{
         res.send(out)
      })
    
   } 
   //----------------------------------------------------------------
   let convert2FHIR = (req,res) =>{
      let params = getParams(req)
      let _data = params.data
      let out=  parsehl7(_data)
      let  jsonprof = require(dirname+'/src/hl7toJson_Profiles.js');
      jsonprof.parse(out,(_out)=>{
         res.send(_out)
      })
   }
   //----------------------------------------------------------------------------------
   let rawhl7 = (req,res) =>{
      let params = getParams(req)
      let filename = `${params.filename}`
      fs.readFile(filename, 'utf8' , (err, _data) => {
         res.send(_data)
      })
   }
   //----------------------------------------------------------------------------------
   let getconfig = (req,res) =>{
      let params = req.params
      let key = params.key
      let result = config
      if(! isEmpty(key)){
         result = config[key]
      }
      if(typeof result == 'object' ){
         res.send(result)
      } else {
         res.send(""+result+"")
      }
   }
   //----------------------------------------------------------------------------------
   let gethl7Config = (req,res) =>{
      const path = require('path');
      let params = req.params
      let config = loadjson(dirname+'/data/hl72json.json')
      let key = params.key
      let result = config
      if(! isEmpty(key)){
         result = config[key]
      }
      if(typeof result == 'object' ){
         res.send(result)
      } else {
         res.send(""+result+"")
      }
   }
   //-------------------------------------------------------
   let test = (req,res) =>{
      parsehl7('MSH|^~\&|^^|MA0000^^|^^|GA0000^^|20111105122535||RSP^K11^RSP_K11|1320521135996.100000002|T|2.5.1|||||||||Z32^CDCPHINVS^^|',(recs)=>{
         res.send(recs)
      })

   }
   //-----------------------------------------------------------
   exports.run = (app) =>{
      setlocals(app)
      app.get('/',hl7viewer)   
      app.get('/hl7viewer',hl7viewer)   
      app.get('/rawhl7',rawhl7)
      app.get('/rawhl7/:filename',rawhl7)
      app.get('/gethl7Config',gethl7Config)    
      app.get('/gethl7Config/:key',gethl7Config)     
      app.get('/getconfig/:key',getconfig)
      app.post('/convert2FHIR',convert2FHIR)
      app.get('/convert2json',convert2json)
      app.post('/convert2json',convert2json)
      app.get('/hl72json',hl72json)
      app.get('/hl72json/:filename',hl72json)
      app.post('/hl72json',hl72json)
      app.post('/hl72json/:filename',hl72json)
      app.get('/readfiles',readFiles)
      app.get('/fileviewer',fileviewer)   
      app.post('/togrid',togrid)

      app.get('/test',test)

   }
}()   
//-------------------------------\

