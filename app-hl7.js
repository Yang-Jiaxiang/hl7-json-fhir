    /*
    app stub for reading from data dictionary
    if dictionary not available or down
    will run default code

    */
    
    const dirname = __dirname 
    const dictMgr = require('./src/dictHelper.js')
    const utils = require('./src/utils.js')
    let config = require("./config.json")
    let serverConfig = require("./data/serverConfig.json")
    const _app = "HL7View"
    //----------------------------------------
    let getConfig = (_dirname,configname,cb)=>{
        dictMgr.getConfig(configname,_app,(config)=>{
            if (utils.isEmpty(config)) {
                let fname = _dirname+configname+".json"
                config = utils.loadjson(fname)
            }
            cb(config)
        })
    }
    let url = config && config.hosts.dict ? config.hosts.dict: "http://localhost:49322"
    dictMgr.useDict({},url,(err,available)=>{
        console.log( available?"Using Dict "+url :"Dict Unavailable "+url)  
        getConfig("./","config",(_config)=>{
            config = _config
            let serverName = serverConfig.server ?serverConfig.server:"restServer"
            dictMgr.getModule(serverName,_app,(data)=>{
                if(! utils.isEmpty(data)) {
                    let app,viewEngine = null
                    fn = utils.eval(data,{serverConfig,config,dirname,app,viewEngine},true)
                    console.log("Running Dynamic Server -",serverName)
                    _server = fn(config,dirname)
                    _server.run(dirname,serverConfig)     
                } else {
                    try{
                        let server = require(`./src/${serverName}.js`)(config,dirname)
                        server.run(dirname,serverConfig)
                        console.log("Running Default Server '%s'",serverName)
                    } catch(e){
                        console.log("error in starting app %s",e)
                    }
                }
            })
            if(config.openBrowser && config.openBrowser.use) {
                let open = require('open')
                open(config.openBrowser.link, {app: config.openBrowser.browser});
            }
        })
      
    })
    
  

  
  



   


