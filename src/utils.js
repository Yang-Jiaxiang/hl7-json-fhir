
!function(){

    String.prototype.replaceAll = function(str1, str2, ignore) {
        return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
    } 
    //---------------------------------------------------------------------------------
    String.prototype.capitalize = function(str){
        str = String(str);
        return str[0].toUpperCase() + str.substr(1, str.length);
    };
    //----------------------------------------------------------------------------------
     String.prototype.truncate = function(max) {
        return this.length > max ? this.substr(0, max-1) + '...' : this;
    } 
    //----------------------------------------------------------------------------------
    exports.truncate = function(str, max) {
        return str.truncate(max);
      }
    //----------------------------------------------------------------------------------
    exports.clone = function(o) { 
      return (JSON.parse(JSON.stringify(o)))
    }
    //---------------------------------------------------------------------------------
    exports.getuuid = (type) =>{
        let uuid = require('uuid')
        return uuid.v4()
    }
    //----------------------------------------------------------------------------------
    let isEmpty = exports.isEmpty = function(str) { // check if string is null or empty usually missing parameter
        if ( str == undefined ) {
            return true;
        } else if ( str == null ) {
            return true;
        } else if (typeof str == 'string' ){
                return typeof str == 'string' && !str.trim() || str == 'undefined' || str == 'null' || str === '[]'|| str === '{}';
        } else if (Array.isArray(str) ) {
            return str.length == 0;
        } else if ( typeof str == 'object' ) {
            return Object.keys(str).length == 0;
        } else {
            return str == null || str == undefined;    
        } 
    }
    //------------------------------------------
    let isObject = exports.isObject = (o) =>{
        return typeof o == 'object'
    } 
    //------------------------------------------
    let isFunction = exports.isFunction = (o) =>{
        return typeof o == 'function'
    } 
    //------------------------------------------
    let isArray = exports.isArray = (o) =>{
        return Array.isArray(o)
    } 
    //-----------------------------------------------
    exports.bufferToStream = (binary) =>  {
        let { Readable } = require('stream');
        let readableInstanceStream = new Readable({
            read() {
            this.push(binary);
            this.push(null);
          }
        });
        return readableInstanceStream;
    }
    //-------------------------------------------
    exports.loadjson = (jsonfile)=>{
        fs = require("fs")
        let f = fs.readFileSync(jsonfile,"utf-8")
        return (JSON.parse(f))  
    }
    //-------------------------------------------
    exports.loadfile = (file)=>{
        fs = require("fs")
        let f = fs.readFileSync(file,"utf-8")
        return (f)  
    }
    //----------------------------------------------------------
    exports.getParams = (req,callback)=>{
        let _params = {}
        let query = req.query
        let params = req.params
        let body = req.body
        Object.keys(query).forEach( (element,key)=> {
            _params[element] = query[element] 
        })
        Object.keys(params).forEach( (element,key)=> {
            _params[element] = params[element] 
        }) 
        Object.keys(body).forEach( (element,key)=> {
            _params[element] = body[element] 
        }) 
        return callback ? callback(_params) : _params    
    }
     //-------------------------------------------------------------
     exports.buildWhere = (olist)=>{
        let where = "";
        Object.keys(olist).forEach( (element,key)=> {
            if(olist[element]){
                where += ((where == "") ? "where " : " and " ) +` ${element} = '${olist[element]}'`;
            }
        })
        return where;   
    }   
    //---------------------------------------------------------------
     exports.buildWhereDict = (type,id,parent,ext)=>{
        if (typeof type == 'object'){
            let o = type;
            id = o.id;
            parent = o.parent;
            ext = o.ext ;
            type = o.type;
        }
        let where = "";
        if ( ! isEmpty(type) ) {
            if( typeof type == 'string' ){
                where += ((where == "") ? "where " : " and " ) +` type = '${type}'`;
            }
        }
        if ( ! isEmpty(id)  ) {
            if( typeof id == 'string' ){
                where += ((where == "") ? "where " : " and " ) +`id = '${id}'`;
            }
        }
        if (! isEmpty(parent)) {
            if( typeof parent == 'string' ){
                where += ((where == "") ? "where " : " and " ) +` parent = '${parent}'`
            }
        }
        if (! isEmpty(ext)) {
            if( typeof ext == 'string' ){
                where += ((where == "") ? "where " : " and " ) +` ext = '${ext}'`;
            }
        } 
        return where;   
    }
    //------------------
    let ping = exports.ping = (options,callback)=> {
        let net = require('net');
        let _options = options || {}; 
        let url = _options.url 
        let host = _options.host || 'localhost';
        let port = _options.port ||url && url.toUpperCase().includes("HTTPS://")?433:80;
        let timeout = _options.timeout || 5000;
        if(! isEmpty(url)){
            if(! url.toUpperCase().includes("://")){
                url = "http://"+url
            }
           let _url = new URL(url)
            host = _url.hostname
            port = _url.port?_url.port: url.toUpperCase().includes("HTTPS://")?433:80;
        }
        let start = process.hrtime();
        let result = {host, port}
        let  _getElapsedTime = (startAt) => {
            let elapsed = process.hrtime(startAt);
            let ms = (elapsed[0] * 1e3) + (elapsed[1] * 1e-6)// cover to milliseconds
            return ms.toFixed(3)
        }
        let socket = new net.Socket();
        socket.connect(parseInt(port), host, () => {
            result.time = _getElapsedTime(start);
            result.success = true;
            socket.destroy();
            callback(result)
        });
        socket.on('error', (e) => {
            result.time = _getElapsedTime(start);
            result.success = false;
            result.error = e.message;
            socket.destroy();
            callback(result)
        });
        socket.setTimeout(timeout, () => {
            result.time = _getElapsedTime(start);
            result.success = false;
            result.error = 'Request Timeout';
            socket.destroy();
            callback(result)
        });
     }
     //-----------------------------------------------------------------
    exports.testping = (hosts,callback)=>{
        let pingtest = (list,index,out,callback)=>{
            if(list.length > index){
                elem= list[index]
                let url = elem[1].url
                let dict = elem[1].name
                let options = {url, timeout: 1500}
                ping(options,(result)=>{
                    out.push({name:dict,url,result})
                    pingtest(list,index+1,out,callback)
                });
              
            } else {
                callback(out)
            }
        }
        pingtest(Object.entries(hosts),0,[],(out)=>{   
            callback(out)
        })
    }
    //------------------------------------------------------
    exports.testConnection = (url,callback) =>{
        const tcpp = require('tcp-ping')
        surl = require('url');
        tcpp.probe(surl.parse(url).hostname,  surl.parse(url).port, (err, available) =>{
      //  tcpp.ping({address:surl.parse(url).hostname,  port:surl.parse(url).port}, (err, available) =>{
            if(err) console.log(err)
                callback(err,available)
        });
    }
    //-----------------------------------------------------------------------------------------
    let fillcolList = function(fields,callback) { // for autofil of jqgrid from mysql
        let colModel = [];       
        fields.forEach((elem,i)=>{
            let colobj = {} ;
            colobj["label"] = elem.name;
            colobj["name"] = elem.name;
            colobj["width"] = Math.min(elem.length,250);
            colobj["editable"] = true;
            colobj["search"] = true;        
            colModel.push(colobj)      
        })
        if(callback){
            callback(colModel)
        }
    }
    //-----------------------------------------------------------------------------------
    let Tags = exports.Tags = function(str,sub1,sub2){
        if (isEmpty(sub1)){
            sub1 = "<{"
        }
        if (isEmpty(sub2)){
            sub2 = "}>"
        }
        let a = [];
        if (typeof str == 'string') {
            let aData = str.split(/(?:\r\n|\r|\n)/g);  //get lines
            aData.forEach((value,i)=>{
                let x = value.indexOf(sub1,0);
                let y = value.indexOf(sub2,0);
                if (x !== -1 ){
                    let tag = value.substr(x,y-x);
                    let etag = value.substr(y,sub2.length)
                    let token = tag+etag;
                    let name = token.replace(sub1,"").trim() ;
                    name = name.replace(sub2,"").trim() ;
                    a.push({token,name});            
                }        
            });
        }
        return a;
    };
    //-----------------------------------------------------------------------------------
    exports.scriptTags = function(str,sub1,sub2){
        if (isEmpty(sub1)){
            sub1 = "<script "
        }
        if (isEmpty(sub2)){
            sub2 = "</script>"
        }
        let a = [];
        if (typeof str == 'string') {
            let aData = str.split(/(?:\r\n|\r|\n)/g);  //get lines
            aData.forEach((value,i)=>{
                let x = value.indexOf(sub1,0);
                let y = value.indexOf(sub2,0);
                if (x !== -1 ){
                    let tag = value.substr(x,y-x);
                    let etag = value.substr(y,sub2.length)
                    let token = tag+etag;
                    if( token.includes('src=')  &&  token.includes(".js") ){     
                        let x =  tag.split('"');
                        x.forEach((src,i)=>{
                            if (src.includes(".js")){
                                a.push({name:src.trim(),token:token})
                            }
                        });       
                    }
                }        
            });
        }
        return a;
    };
    //-----------------------------------------------------------------------------
    exports.stylesheetTags = function(str,sub1,sub2){
        if (isEmpty(sub1)){
            sub1 = "<link"
        }
        if (isEmpty(sub2)){
            sub2 = ">"
        }
        let a = [];
        if (typeof str == 'string') {
            let aData = str.split(/(?:\r\n|\r|\n)/g);  //get lines
            aData.forEach((value,i)=>{
                let x = value.indexOf(sub1,0);
                let y = value.indexOf(sub2,0);
                if (x !== -1 ){
                    let tag = value.substr(x,y-x);
                    let etag = value.substr(y,sub2.length)
                    let token = tag+etag;
                    if( token.includes('rel="stylesheet"')  &&  token.includes("href=") ){     
                        let x =  tag.split('"');
                        x.forEach((src,i)=>{
                            if (src.includes(".css")){
                                a.push({name:src.trim(),token:token})
                            }
                        });       
                    }
                }        
            });
        }
        return a;
    };
    //----------------------------------------------------------------------------
    exports.token = token = function(str,sub1,sub2){
        let result = "";
        let x = str.indexOf(sub1,0);
        let y = str.indexOf(sub2,x);
        if (x !== -1 && y !== -1) {
            //result = str.substr(x,y-x)+str.substr(y,sub2.length)
            //result = str.substr(x+sub1.length ,y-x)+str.substr(y,sub2.length)
            result = str.substr(x+sub1.length,y-x-sub2.length+2) 
        }
        return result;
    }
    //-----------------------------------------------------------------------------------
    exports.gettoken = (str,sub1,sub2) => {
        let a = [];
        let x = str.indexOf(sub1,0);
        let y = str.indexOf(sub2,0);
        while (x !== -1 && y !== -1) {
            let tag = str.substr(x,y-x);
            let etag = str.substr(y,sub2.length)
            let value = str.substr(x+sub1.length,y-x-sub1.length);
            let o = {x,y,value,token:tag+etag};
            a.push(o)
            x = str.indexOf(sub1,x+1);
            y = str.indexOf(sub2,y+1);            
        }
        return a;
    }
    //-----------------------------------------------------------------------------------
    let genToken = exports.genToken = function(len) {    
        let crypto = require('crypto');
        len = len || 20;
        if (crypto.randomBytes) {
            return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').substring(0, len);
        } else {
            for (var i = 0, salt = ''; i < len; i++) {
            salt += saltChars.charAt(Math.floor(Math.random() * saltCharsCount));
            }
            return salt;
        }
    }
    //----------------------------------------------------------------------
    let merge = exports.merge =(a, b) => {
        if (!a || !b) return a
        var keys = Object.keys(b)
        for (var k, i = 0, n = keys.length; i < n; i++) {
          k = keys[i]
          a[k] = b[k]
        }
        return a
      }
    //-----------------------------------------------------------------------
    exports.eval = (content, filename, scope, includeGlobals) => {
        let vm = require('vm')
        let isBuffer = Buffer.isBuffer
        var requireLike = require('require-like')
            if (typeof filename !== 'string') {
              if (typeof filename === 'object') {
                includeGlobals = scope
                scope = filename
                filename = ''
              } else if (typeof filename === 'boolean') {
                includeGlobals = filename
                scope = {}
                filename = ''
              }
            }
            // Expose standard Node globals
            var sandbox = {}
            var exports = {}
            var _filename = filename || module.parent.filename;
          
            if (includeGlobals) {
              merge(sandbox, global)
              // console is non-enumerable in node v10 and above
              sandbox.console = global.console
              // process is non-enumerable in node v12 and above
              sandbox.process = global.process
              sandbox.URL = global.URL
              sandbox.require = requireLike(_filename)
            }
          
            if (typeof scope === 'object') {
              merge(sandbox, scope)
            }
          
            sandbox.exports = exports
            sandbox.module = {
              exports: exports,
              filename: _filename,
              id: _filename,
              parent: module.main,
              require: sandbox.require || requireLike(_filename)
            }
            sandbox.global = sandbox
          
            var options = {
              filename: filename,
              displayErrors: false
            }
          
            if (isBuffer(content)) {
              content = content.toString()
            }
          
            // Evalutate the content with the given scope
            if (typeof content === 'string') {
              var stringScript = content.replace(/^\#\!.*/, '')
              var script = new vm.Script(stringScript, options)
              script.runInNewContext(sandbox, options)
            } else {
              content.runInNewContext(sandbox, options)
            }
            return sandbox.module.exports
    }
  

}()
