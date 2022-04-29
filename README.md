## hl7v2 to json and html 

hl7 to json parser and a viewer to display hl7 in a readable format

### Installation:

unzip the hl7app into a directory
should get a directory structure 

#### |-data|
#### |     |-hl72json.json  -- mapping of HL7 segments to json
#### |     |-serverConfig.json -- server configuration
#### |-hl7data   -- for testing only
#### |-public  -- files for jquery themes etc
#### |-routes|
#### |        |-hl7Routes -- REST API for hl7v2 parsing and hl7 v2 to json and
#### |        |-diagnosticRoutes  -- nodejs and system diagnostics
#### |-src  |
#### |      |-db.js  -- dtabase connections for mongo sqlite
#### |      |-dictHelper  -- connection to database dictionry if used
#### |      |-hl7tojson_Profiles.js  -- parser to convert hl7 v to json
#### |      |-restServer -- data driven rest server
#### |      |-utils.js  -- some usefull functions
#### |-views  |
#### |        |-filelist.ejs  -- viewer for files on server
#### |        |-hl7list.ejs  -- viewer for displaying parsed hl7 v2 files
#### |        |-json_viewer.ejs -- viewer and editor for json files
#### |-config.json  -- configuration ile for viewer
#### |-package.json  -- package for build and node dependencies
#### |-app-hl7.js -- data driven app stubb
#### |-README.md -- you are reading it
#### |-hl7viewer.exe  -- packaged app windows only do not need node on machine

### running 
  files needed hl7viewer.exe and config.json
  copy these to a working directory
  [local]
    if config.openBrowser.use is set to true
    run hl7viewer.exe and a browser wiil open up
    otherwise
    open a browser and enter
    http://localhost:10444/hl7viewer 
  [server]
    on server start application
    open a browser on a client and enter
    http://[server ip or name]:10444/hl7viewer 

## prerequisites
  ### install node on dev machine
    google it
  ### install nodemon
    npm install nodemon -g
  ###  install pm2 -- if you need a good proccess manager
    npm install pm2 -g
  ###  install pkg if you need to build single file executables
    npm install pkg -g

## build
  cwd to directory with code
  ### install all node_modules
    npm install
  #### build executable
    pkg .

## running
  ### run executable
    hl7viewer.exe
  ### using node
    node app-hl7.js
  ### using nodemon - this will watch any changes to files and restart
    nodemon app-hl7.js
  ### using pm2 this is the prefered way on production server
  ### it will demonize the app and keep it running forever with monitoring
  ### also it will configure startup scripts to restart app after server-restart
    pm2 start hl7viewer.exe
    or
    pm2 start app-hl7.js
    
## REST API

  [/hl72json]
  [/hl72json/:filename]
  ### hl72json read hl7 file and converts to json
  ### if no file id passed it read from the server directory set in the 
  ### config.hl7Directory
      let url = `/hl72json/`
      or
      let url = `/hl72json/?filename=${file}`
      $.ajax({
          type: "POST",
          url,
          datatype:"json",
          success: (data,textStatus,jqXHR)=>{
             // fill grid with new data
              grid.jqGrid("clearGridData");
              for(var i=0;i<=data.length;i++){
                  grid.jqGrid('addRowData',i+1,data[i]);
              }
          }
      });
 [/readfiles]
  ### read files fron config.hl7Directory on server and return in json format to show in grid
  ### this is usuall put in the url part of jqgrid
    jQuery("#fileviewer").jqGrid(
      "url":"/readfiles/",      
      "datatype":"json",
      "colModel":[
          {label:'file',name:'file', editable:false ,width:350,title: false},
          {label:'filename',name:'filename', editable:true ,width:350,title: true,hidden:false},
      ]
      ... blah blah
  [/convert2FHIR]
  ### convert hl7 v2 file to fhir
    let url = `/convert2fhir`
    let _data = editor.getSession().getValue()  // get hl7 data from editor - could be file contents
    $.ajax({
        datatype:"json",
        type: "POST",
        url,
        data: JSON.stringify({data:_data}),
        success: (data)=>{
            jsoneditor.set(data)
        }
    });  
    


     
  




