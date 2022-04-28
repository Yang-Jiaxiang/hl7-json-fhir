
/// stubs for REST server app framework name = restServer
//  run() called to run
//  beforeInitApp
//  initApp  // setup configuration for app
//  afterinitApp
//
var dictMgr,utils,isEmpty = null 
module.exports = ( config,dirname) => {
     //------------------------------------------------------------
     let callRoutes = (app) => {
        let dirname = app.get('dirname')
        let configServer = app.get('configServer')
        let routes = configServer.routes
        Object.keys(routes).forEach( (elem) => { 
            if(routes[elem].use){
                console.log("route - "+elem)
                let mod = require(`${dirname}/routes/${elem}`)
                mod.run(app)
            }
        })
    }
    let startApplication = module.startApplication = (dirname,serverConfig,callback)=>{
        let Calldefault  = (callback)=>{
            beforeInitApp(serverConfig,(app)=>{
                initApp(dirname,serverConfig,(app)=>{
                    afterInitApp(serverConfig,app,(app)=>{
                        if(typeof setExit == 'function'){
                            setExit()
                        }
                        if(callback){
                            callback(app)
                        }
                    })
                })
            })
        }
        dictMgr.getFunction("beforeInitApp",{serverConfig},(func)=>{
            if(typeof func == "function") { 
                func(serverConfig,(app)=>{ 
                    initApp(dirname,serverConfig,(app)=>{
                        afterInitApp(serverConfig,app,(app)=>{
                            if(typeof setExit == 'function'){
                                setExit()
                            }
                            if(callback){
                                callback(app)
                            }
                        })
                    })
                })
            } else {
                Calldefault((app)=>{
                    if(callback) callback(app);
                })
            }
        })
    }
    //----------------------
    let beforeInitApp  = (serverConfig,callback)=>{
        callback(null)
    }
    //--------
    let initApp = (dirname,serverConfig,callback)=>{
        let apptype = serverConfig.application  && serverConfig.application.type?serverConfig.application.type:"express"
        let appname = serverConfig.application && serverConfig.application.name ?serverConfig.application.name:"appExpress"
     
        dictMgr.getApp(appname,apptype,(data)=>{         
            if( ! utils.isEmpty(data)){     
                let block = data[0].cargo
                let app,viewEngine = null
                fn = utils.eval(block,{app,viewEngine,dirname,isEmpty,config,serverConfig,dictMgr},true)
                Object.keys(fn).forEach( (element,key)=> {
                    app = fn[element](dirname,serverConfig,(app)=>{
                        if(callback){
                            callback(app)
                        }
                    })
                })
                console.log("Running Dynamic App ",fn)
            } else {
               //   
                defaultApp(dirname,serverConfig,(app)=>{
                    let cargo = `exports.${appname} =${defaultApp} `
                    dictMgr.saveApp(appname,apptype,cargo,()=>{
                        if(callback){
                            callback(app)
                        }
                        console.log("Running Default",app.name)
                    } )
                }) 
            }
        })
    }
    //----------------------------
    afterInitApp =   (serverConfig,app,callback)=>{
        beforeStartServer(serverConfig,app,(res)=>{
            startServer(serverConfig,app,(server)=>{
                if(typeof afterStarServert == 'function') {
                    func(serverConfig,app,server,(out)=>{
                        initRoutes(serverConfig,app,server,(out)=>{
                            callback(app)
                        })
                    })
                } else {
                    afterStartServer(serverConfig,app,server,(res)=>{
                        initRoutes(serverConfig,app,server,(out)=>{
                            callback(app)
                        })
                    })
                }
            })  
        })
    }
    //----------------------------------------------------------------
    beforeStartServer  = (serverConfig,app,callback)=> {     
        callback(null)
    }
    //--------------------------------------------------------------
    startServer=(serverConfig,app,callback) =>{
        if(serverConfig.useHTTPS){
            let https_options = serverConfig[serverConfig.server].https.options
            let runfunc = serverConfig[serverConfig.server].https.func ?serverConfig[serverConfig.server].https.func :"startHTTPS"
            dictMgr.getFunction(runfunc,{serverConfig,app},(func)=>{
                if(typeof func == "function") {
                    func(app,https_options,(server)=>{
                        if(callback){    
                            callback(server)
                        }
                    })
                }else{
                    eval(runfunc)(app,http_options,(server)=>{
                    //startHTTPS(app,https_options,(server)=>{
                        if(callback){    
                            callback(server)
                        }
                    })
                }
            })
        } else {
            let runfunc = serverConfig[serverConfig.server].http.func ?serverConfig[serverConfig.server].http.func :"startHTTP"
            let http_options = serverConfig[serverConfig.server].http.options
            dictMgr.getFunction(runfunc,{serverConfig,app},(func)=>{
                if(typeof func == "function") {
                    func(app,http_options,(server)=>{
                        if(callback){    
                            callback(server)
                        }
                    })
                } else {
                    
                    eval(runfunc)(app,http_options,(server)=>{
                  //  startHTTP(app,http_options,(server)=>{
                        if(callback){    
                            callback(server)
                        }
                    })
                }
            })
        }
    }
    //----------------------------------------------------------------
    afterStartServer = (serverConfig,app,server,callback) =>{     
        callback (serverConfig,app,server) 
    }
    //--------------------------------------------------------------
    let startHTTP=(app,options,callback) =>{
        const http = require('http');
        let port = options.port ? options.port:80000
        let server = http.createServer(app,(req,res)=>{})
        server.listen(port,()=>{
            console.log("listening on port %s",port)
            callback(server)
        });
    }
    //-------------------------------------------------------
    let startHTTPS = (app,options,callback) =>{
        const fs = require('fs')
        const https = require('https');
        let port = options.port ? options.port:80443
        var https_options = {
            key: fs.readFileSync(options.key),
            cert: fs.readFileSync(options.cert), 
            ca:fs.readFileSync(options.ca),
        };
        let server=  https.createServer(https_options,app)
        server.listen(port,()=>{
            console.log(`\n\nHTTPS  - \nlistening on port: ${port} ` );
            callback(server)
        });
    }
    //--------------------------------------------------------
    initRoutes = (serverConfig,app,server,callback)=>{
        console.log("calling InitRoutes")
        //------------------------
        dictMgr.getRoutes(serverConfig,app,(routes)=>{
            //console.log("Running Dynamic Routes")
            if(! isEmpty(routes)){
                routes.forEach((elem)=>{
                    elem.run(app)
                })
            
                callback(routes)
                
            } else {
                console.log("\nRunning Default Routes")
                callRoutes(app)
            }
        })  
    }
    //---------------------------------------------------------
    let defaultApp = (dirname,serverConfig,callback) =>{
        let viewEngine = serverConfig.viewEngine? serverConfig.viewEngine.use:"ejs"
       
        let app = serverConfig["application"] && serverConfig["application"].type?serverConfig["application"].type:"express"
        let options = serverConfig[app].options
        let express = require(app);
        let path = require('path');  
        let vEngine = require(viewEngine)
        if(! dictMgr ){
            dictMgr = require(dirname+'/src/dictHelper.js')
        }
        app = express();
        app.use( express.json(options.json ) );       // to support JSON-encoded bodies
        //app.use( express.urlencoded({limit: '100mb' })); 
        app.set('app', config.app);
        app.set('port', config.port);
        app.use( express.static(path.join(dirname, 'public')),);
        app.set('views', path.join(dirname, 'views'));
        app.set('view engine', viewEngine);
        app.set('config',config)
        app.set('configServer',serverConfig)
        app.set("dirname",dirname)
        app.set("src",path.join(dirname,'src'))
        app.set("dictMgr",dictMgr)
        app.set("ejs",vEngine)
        if(serverConfig.useCors ? serverConfig.useCors:  true){
            let cors = require('cors');
            app.use(cors());
        }
        app.use((req, res, next) => { // add getUrl to req
            req.getUrl = ()=> {
                return req.protocol + "://" + req.get('host') + req.originalUrl;
            }
            return next();
        });             
        app.all('/*', (req, res, next)=> {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            next();
        });
        callback(app)
    }
    //----------------------------------------------------------
    let setExit = ()=>{
        let exitHandler = (options, err) => {
            if (options.cleanup) { 
                console.log('Cleaning Up');
            }
            if (err) console.log(err);
            if (options.exit) {
            }
        }
        process.on('beforeExit', exitHandler.bind(null, {exit:true}));
        process.on('exit', exitHandler.bind(null,{
            cleanup:true
            }
        ));
        
        process.on('SIGINT', exitHandler.bind(null, {exit:true}));
        process.on('SIGQUIT', exitHandler.bind(null, {exit:true}));
        process.on('SIGTERM', exitHandler.bind(null, {exit:true}));
        process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
    }
    //----------------------------------------------------------
    let useCluster = (_startApp,serverConfig) =>{
        clusterOptions = config.cluster_options
        let numWorkers =  clusterOptions && clusterOptions.workers ?clusterOptions.workers:require('os').cpus().length-1;
        let cluster = require('cluster');
        if(cluster.isMaster) {
            console.log('Master cluster setting up ' + numWorkers + ' workers...');
            for(var i = 0; i < numWorkers; i++) {
                cluster.fork();
            }
            cluster.on('online', function(worker) {
                console.log('Worker ' + worker.process.pid + ' is online');
            });
            cluster.on('exit', function(worker, code, signal) {
                console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
                console.log('Starting a new worker');
                cluster.fork();
            });
        } else {
            _startApp(serverConfig)
        }
    }
    //-------------------------------------------
    module.run = (dirname,serverConfig) =>{
        dictMgr = require(dirname+'/src/dictHelper.js')
        utils = require(dirname+'/src/utils.js')
        isEmpty = utils.isEmpty
        let url = serverConfig && serverConfig.hosts.dict?serverConfig.hosts.dict:"http://localhost:49322"
        dictMgr.useDict({},url,(err,available)=>{
            if( serverConfig && serverConfig.useCluster ? serverConfig.useCluster:false) {
                useCluster(startApplication,serverConfig)
            } else {
                startApplication(dirname,serverConfig)
            }
        })
    }
    return module   
}



