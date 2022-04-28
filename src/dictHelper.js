    
!function(){
  
  
    let Client = require('node-rest-client').Client; 
    let utils = require('./utils.js')
    let dict = null
    let _available = false
    //--------------------------------------------------
    let useDict = exports.useDict = (config,url,callback)=>{
        // see if local dict 
        url = url || "http://localhost:49322"
        utils.testConnection(url,(err,available) =>{
            _available = available
            dict = {err,available,host:url,name:"/dict",url}
            if(callback){
                callback(err,available,url)
            }
        } )
    } 
    //-------------------------------------------------------------
    let dictUrl = (method,type,id,parent,ext) =>{
        let url = ""
        url += ! utils.isEmpty(type)?( utils.isEmpty(url) ? "?type="+type:"&type="+type):""
        url += ! utils.isEmpty(id)?( utils.isEmpty(url) ? "?id="+id:"&id="+id):""
        url += ! utils.isEmpty(parent)?( utils.isEmpty(url) ? "?parent="+parent:"&parent="+parent):""
        url += ! utils.isEmpty(ext)?( utils.isEmpty(url) ? "?ext="+ext:"&ext="+ext):""
        url = dict.host+dict.name+"/"+method+"/"+url
        return url
    }
    //-----------------------------------------------------------
    let _getDict = (type,id,parent,ext,callback)=>{
        let cl = new Client()   
        let url = dictUrl('get',type,id,parent,ext)
      //  useDict({},dict.url,(err,available)=>{
        //    dict.err = err
        //    dict.available = available 
            if(_available) {
                cl.get(url, (data, response) => {    
                    if(callback){    
                        callback(data)
                    }
                })
            } else {
                callback({})
            }
     //   })
    } 
    //-----------------------------------------------------------
    let _saveDict   = exports._saveDict=exports.setDict = (type,id,parent,ext,cargo,callback)=>{
        let url = dictUrl('set',type,id,parent,ext)
        utils.testConnection(url,(err,available) =>{
            dict.err = err
            dict.available = available 
            if(dict.available) {
                let cl = new Client()   
                var args = {
                    data: {cargo },
                        headers: { "Content-Type": "application/json" }
                }
                cl.post(url, args,  (data, response) => {
                // console.log(response.headers)
                    callback(data)
                })
             } else {
                callback(null)
            }
        })
    }
    //--------------------------
    exports.saveApp = (appname,engine,data,callback)=>{
        if(dict && dict.available) {
            let url = dict.host+dict.name+`/set/js/${appname}/Application/${engine}`  
            let cl = new Client()    
            var args = {
                data: {cargo:data },
                    headers: { "Content-Type": "application/json" }
            }
            cl.post(url, args,  (data, response) => {
               // console.log(response.headers)
            })
        } else {
            if(callback){    
                callback(null)
            }
        }
    }
    //-----------------------------------------------------
    exports.getApp= (appname,engine,callback)=>{
        _getDict("js",appname,"Application",engine, (data)=>{
            callback( data)
        })
    }  
    
    //------------------------------------------------------------
    exports.saveConfig = (appname,parent,config,callback)=>{  
     
            _saveDict("json",appname,parent,"config",config,(res)=>{
                if(callback) {
                    callback(res)
                }
            })
      
    }
    //------------------------------------------------------------
    exports.getConfig = (id,parent,callback)=>{  
        _getDict("json",id,parent,"data", (data)=>{
            let json = ! utils.isEmpty(data)?JSON.parse(data):{}
            if(callback) {
                callback(json)
            }
        })
    }
    //-----------------------------------------------------------
    exports.saveModule = (id,module,callback) =>{
    
        if(! utils.isEmpty(module)) {
            _saveDict("js",id,'module',"",module,(res)=>{
                if(callback){
                    callback(res)
                }
            })
        }
       
    }
    //-----------------------------------------------------
    exports.getModule = (id,parent,callback)=>{
        _getDict("js",id,parent,"", (data)=>{
            let out =  utils.isEmpty(data)&&data[0] ?data[0].cargo:{}
            if(callback){
                
                callback(out)
            }
        })
    }  
    //-----------------------------------------------------
    exports.getFlows= (id,callback)=>{
       
            _getDict("flow","","","", (data)=>{
                if(callback){
                    callback(data)
                }
            })
       
    } 
    //-----------------------------------------------------
    exports.getejs = (id,parent,callback)=>{
      
            _getDict("ejs",id,parent,"", (data)=>{
                if(callback){
                    callback(data.toString('utf-8'))
                }
            })
       
    }  
     
    //-----------------------------------------------------------
    let saveFunc = (id,func,callback) =>{
        if(! utils.isEmpty(func)) {
            _saveDict("js",id,'function',"",func,(res)=>{
                if(callback){
                    callback(res)
                }
            })
        } else {
            if(callback){ callback(null) }
        }
    }
    //-----------------------------------------------------
    let getFunc = exports.getFunc= (id,callback)=>{
        _getDict("js",id,"function","", (data)=>{
            if(callback){
                callback(data)
            }
        })
    }  
    //----------------------------------------------
    let getFunction = exports.getFunction = (funcname,parameters,callback)=>{
        getFunc(funcname,(data)=>{   
            if(! utils.isEmpty(data)){
                let block = data.toString()
                let func = utils.eval(block,parameters,true)
                callback(func[funcname])
            } else {
                let fn = utils.eval(`typeof ${funcname} === 'function'`,{},true )
                if (! utils.isEmpty(fn) ){
                    let fn = Function(funcname)
                    callback(fn)
                } else {
                    callback(null)
                }
            }
        })
    }
    //-------------------------------------------------------------------
    let saveFuncs = exports.saveFuncs = (funcs,callback) =>{  //
        let save = (array,index,callback) =>{
            if(array.length > index){
                let func = array[index]
                let s = `exports.${func.name}=${func.toString()}`
                saveFunc(func.name,s,(result)=>{
                    save(array,index+1,callback)
                })
            } else {
               callback("")
            }
        }
        save(funcs,0,(err)=>{
            console.log(err)
        })
    } 
    //-----------------------------------------------------------
    exports.saveRoute = (id,_type,routes,callback) =>{
        if(dict && dict.available) {
            let type = "js"
            let data = ""
            if(_type == "module") {
                const fs = require('fs')
                data = fs.readFileSync(routes,"utf-8")
            }
            if(_type == "func") {
                data = routes.toString()
            }
            if(_type == "list") {
                type = "json"
                data = routes
            }
            if(! utils.isEmpty(data)) {
                _saveDict(type,id,'route',_type,data,(res)=>{
                    if(callback){
                        callback(res)
                    }
                })
            }
        } else {
            if(callback){    
                callback(null)
            }
        }
    }
    //-----------------------------
    exports.getRoutes = (restSeverConfig,app,callback) =>{
        let dirname = app.get('dirname')        
        let config =  app.get('config')
        let funcs = []
        _getDict("js","",config.app,"routes",(routes)=>{    
            Object.values(routes).forEach( (elem) => {
                console.log("Dict route = ",elem.id)
                fn = utils.eval(elem.cargo,{app,__dirname,dirname,config},true)
                funcs.push(fn)
            })      
            callback(funcs)
        })
    }
    //----------------------------------------------------------------------------
    exports.getPortal = (appname,callback)=>{
        //------------------------------------------------------------
        let buildDashboard = (appname,callback) =>{
                _getDict("json",'portal',appname,"data", (dashb)=>{
                
                    dashb = !utils.isEmpty(dashb)?JSON.parse(dashb.toString("utf-8")):null
                    if(! utils.isEmpty(dashb)) {
                       
                        let script = `<script>`
                        let html = ""
                        let style = `
                        <style>
                        details > summary {
                            padding: 2px;
                            width: 100%;
                            /*background-color: #eeeeee;*/
                            background: #e6ecf3;
                            border: 1px solid #D3D3D3;
                            border-width: 1px 0 0 1px;
                            box-shadow: 1px 1px 2px #bbbbbb;
                            cursor: pointer;
                            display: inline-flexbox;
                            text-align: left;
                        }
                        details > p {
                            background-color: #eeeeee;
                            padding: 4px;
                            margin: 0;
                            box-shadow: 1px 1px 2px #bbbbbb;
                        }
                        iframe {
                            height: 100%;
                            width: 100%;
                            border: 1px solid #D3D3D3;
                            overflow: hidden!important;
                            resize: vertical!important;
                            
                        }    
                    </style>
                    `
                        dashb.forEach(elem => {
                            script += `
                            var ${elem.name} = () =>{
                                let  element= document.getElementById("${elem.name}");
                                element.setAttribute("src","${elem.src}");
                            } 
                            `
                            html += `
                            <div>
                             <details ${elem.open=='true'? "open=true" :''}  onclick="${elem.name}()">
                                <summary style=  ${elem.titleStyle?elem.titleStyle:"background:'#ff7c3'"} ><span >${elem.title}</span></summary>
                                <iframe id="${elem.name}" 
                                    ${elem.open=='true'?`src="${elem.src}"`:`/*src="${elem.src}"*/`}
                                    frameborder="1"   
                                    style=  ${elem.style?elem.style:"height:350px;width:100%"}
                                    
                                    >
                                </iframe> 
                            </details>		
                        </div>
                            `
                        });
                        script += "</script>"
                        if(callback){
                            callback( style+script+html)
                        }
                    } else {
                        if(callback){ callback(null) }
                    }
                })
           
        }
        //-------------------------------------------
        buildDashboard(appname,(data)=>{
            if(! utils.isEmpty(data)){
                if(callback){ callback(data) }
            } else {
                if(callback){ callback(null) }
            }
        })
    }  
    useDict()
}()