
!function(){
    let CJSON = require('circular-json') 
    let dirname = process.cwd()
    //--------------------------------------------------
        let getRoutes = (app) =>{
            
            let _res = {}
            app._router.stack.forEach(function(r){
                if (r.route && r.route.path){
                    if(! _res[r.route.path]) _res[r.route.path] = [] 
                    _res[r.route.path].push(r.route.methods) 
                }
            })
            return _res
        }
        exports.run = (app)=> {
            let utils = require("../src/utils") 
            app.get('/hosts',(req, res, next) => { 
                let hosts = utils.loadjson(dirname+"/data/hosts.json")
                let gethostsAsync = (_hosts,cb)=>{
                    let count = 0
                    let hosts  = _hosts.hosts
                    let defaultTimeout = _hosts.timeout
                    hosts.forEach( (elem,i)=> {
                        let timeout = elem.timeout?elem.timeout:defaultTimeout
                        utils.ping({url:elem.url,timeout},(result) =>{
                            count ++
                            result.name=elem.name
                            result.url=elem.url
                            hosts[i].result = result.success
                            hosts[i].description = result.error
                            if(hosts.length == count+1) {
                                cb(hosts)
                            }
                        })  
                    })
                }
                gethostsAsync(hosts,(out)=>{
                    res.send(out)
                })
            });
            app.get("/system/reboot", (req, res)=>{
                setTimeout(() => {
                    process.on("exit", () => {
                      require("child_process")
                        .spawn(
                          process.argv.shift(),
                          process.argv,
                          {
                            cwd: process.cwd(),
                            detached: true,
                            stdio: "inherit"
                          }
                        );
                    });
                    process.exit();
                }, 1000);
            })
            app.get('/hostsview',(req, res, next) => {
                res.render("hostsView")
            });
            app.get('/process/exit',(req, res, next) => {
                process.exit(0)
            });   
            app.get('/process/config',(req, res, next) => {
                res.send(process.config)
                next()
            });
            app.get('/process/memory',(req, res, next) => {
                res.send(process.memoryUsage())
                next()
            });
            app.get('/process/release',(req, res, next) => {
                res.send(process.release)
                next()
            });
            app.get('/process/arch',(req, res, next) => {
                res.send(process.arch)
                next()
            });        
            app.get('/process/connected',(req, res, next) => {
                res.send(process.connected)
                next()
            });
            app.get('/process/cpu',(req, res, next) => {
                res.send(process.cpuUsage())
                next()
            });
            app.get('/process/env',(req, res, next) => {
                res.send(JSON.stringify(process.env,null,4))
                next()
            });
            // getapp variables
            app.get('/app/routes',(req, res, next) => {
                res.send(getRoutes(req.app))
                next()
            });
            app.get('/app/locals',(req, res, next) => {
               res.set({
                'Content-Type': 'Application/json',
               }).send(CJSON.stringify(req.app.locals))
                next()
            });  
           
            app.get('/app/dirname',(req, res, next) => {
                res.send(req.app.get('dirname'))
                next()
            });
            app.get('/app/config',(req, res, next) => {
                res.send(req.app.get('config'))
                next()
            });
            app.get('/app/config/server',(req, res, next) => {
                res.send(req.app.get('configServer'))
                next()
            });
        } 
}()