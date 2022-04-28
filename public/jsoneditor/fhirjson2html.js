    //----------------------------------------------------------------------
    let insertJWTCode = (element) =>{
        console.log("jwt Element",element)
        let html = "?"
        html =   `<div><table border="1" class="table table-striped">
                        <thead>
                            <tr>`
        html += `<th scope="col">System</th>
                <th scope="col">Code</th>
                <th scope="col">Display</th>
        `
        html += ` </tr> </thead> <tbody>`;
        html += `<tr>
                        <td>${element.codeSystem?element.codeSystem:'?'}</td> 
                        <td>${element.code?element.code:'?'}</td> 
                        <td>${element.display?element.display:'?'}</td> 
                        </tr>
                    `
        html += `</tbody> </table></div>`;
        return(html)
    }
    //-----------------------------------------------
    let jwtToken2html = (token)=>{
        let html = setHtml()
        if(token){
            html +=  `<div>
                            <table border="1" class="table table-striped">
                            <thead>
                                <tr>
                                <th scope="col">Type</th>                               
                                <th scope="col">Alg</th>                               
                                <th scope="col">jit</th>
                                <th scope="col">aud</th>
                                <th scope="col">sub</th>
                                <th scope="col">iss</th>
                                <th scope="col">Subject ID</th>
                                <th scope="col">Subject Org</th>
                                <th scope="col">Subject Role</th>
                                <th scope="col">Purpose of Use</th>
                                <th scope="col">Resource ID</th>
                                <th scope="col">Name</th>
                                <th scope="col">Target System</th>
                                <th scope="col">iat</th>
                                <th scope="col">exp</th>
            `
            html += ` </tr> </thead> <tbody>`;
            html += `<tr>
                            <td>${token.decoded && token.decoded.header?token.decoded.header.alg:'?'}</td> 
                            <td>${token.decoded && token.decoded.header?token.decoded.header.typ:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.jit:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.aud:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.sub:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.iss:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.subjectID:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.subjectOrganization:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.SubjectRole:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.PurposeOfUse:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.resourceID:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.name:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.targetSystem:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.iat:'?'}</td> 
                            <td>${token.decoded && token.decoded.payload?token.decoded.payload.exp:'?'}</td> 
                            
                        </tr>
                        `
        }
        return html
            
    }
    //-------------------------------------------------------
    var fhir2html =  (data,callback)=>{
        if(typeof data =='string') {
            data = JSON.parse(data)
        }
        let entry = data.FCSResponse?data.FCSResponse.entry:data.entry
        console.log("Entry ",entry)
        if(entry) {
            fhirParseEntries(entry,(html)=>{ 
                let out = evalEntries(html,data.FCSResponse?data.FCSResponse:data,(out)=>{})
                return callback? callback(out,html):out
            })
        } else {
            console.log(data)
            if(data.token){  // jwt token
                let out = jwtToken2html(data)
               
                return callback? callback(out,data):out
            }
        }
    }
    //---------------------------------------------------------
    let fhirParseEntries = (entry,callback) =>{ //data = entries
        let jsonlist={}
        if(entry && Array.isArray(entry)){
            entry.forEach((elem,index,array) => {
                let type = elem.resource.resourceType
                if(! jsonlist[type] ) {
                    jsonlist[type]= []
                }
                jsonlist[type].push(elem)
            });
        }
        return callback? callback(jsonlist):jsonlist
    }
    //---------------------------------------------------------
    let evalEntries = (entries,entry,callback)=>{
        let html = ""
        html += fhirOperationOutcome(entry)
        html += fhirLinks(entry) 
        let getEntry = (_list) =>{ //get list for eval function
            return _list
        }
        Object.keys(entries).forEach((element, key,a) => {
            let  list =  entries[element]
            let type = list[0].resource.resourceType
            let fn = `fhir${type}`
            try{
                if( eval(`${fn}.name`)){
                    html += eval(`${fn}(getEntry(list))`)
                }
            } catch(e){
                html += `<h3><p>Error in creating table for <b> ${type}</b></p></h3>`
                html += `<div>${e}</div>`
            //    html += `<div>${JSON.stringify(list,null,4)}</div>`
           //     fhirDefault(list)
                console.log(e)
            }
        })
        if(callback){
            callback(html)
        }
        return(html)
    }   
    //-----------------------------------------------------
    let setHtml = ()=>{
        let html = `<style>    
                        h1 {text-align: left;}
                        h2 {text-align: left; background: #d3d1d4 !important;}
                        h3 { background: #f3d1d4 !important;}
                        h4 { background: #e3d184 !important;}      
                        .table {
                            border-collapse: collapse; 
                            border-spacing: 0;
                        }         
                        thead th {  background:grey; color:white}
                        tbody th {  background: lightgrey; color:darkblue}
                    </style>`
        return(html)            
    }
    //-----------------------------------------------------
    let fhirOperationOutcome = (entry) => {
        let insertIssueTable = (table) =>{
          let html = ""
            if(table && Array.isArray(table)){
                html +=  `<div>
                                <table border="1" class="table table-striped">
                                <thead>
                                    <tr>
                                    <th scope="col">severity</th>
                        <th scope="col">code</th>
                        <th scope="col">details</th>
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.severity?element.severity:'?'}</td> 
                                    <td>${element.code?element.code:'?'}</td> 
                                    <td>${element.details?element.details:'?'}</td> 
                                </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
            }
            return(html)
        }
      
        //------------
        let html = setHtml()
        if(entry.resource ){
            html += `<h2>Operation Outcome</h2>
                    <div><b>requestid:</b> ${entry.resource.requestid}</div>
                    <div><b>meta</b> ${JSON.stringify(entry.resource.meta)}</div>
                    <div><h4>Issue</h4>${insertIssueTable(entry.resource.issue)}</div> 
                    `
        }
        return(html)
    }
    //---------------------------------------------------------
    let fhirHeader = (entry)=>{
    let table = `<style>    
                    h1 {text-align: left;}
                    h2 {text-align: left; background: #d3d1d4 !important;}
                    h3 { background: #f3d1d4 !important;}
                    h4 { background: #e3d184 !important;}      
                    .table {
                        border-collapse: collapse; 
                        border-spacing: 0;
                    }         
                    thead th {  background:grey; color:white}
                    tbody th {  background: lightgrey; color:darkblue}
                </style>
                <div><p><h2>${entry[0].resource.resourceType}</h2></p><div>
            `
    return(table)              
    }     
    //---------------------------------------------------------
    let fhirLinks = (entry)=>{
        let html = "<div>"
        if(! isEmpty(entry )){
            html += `
                    <h2>Search</h2>
                    <div>fullUrl: ${entry && entry.fullUrl?entry.fullUrl: entry && entry.link?entry.link[0].url:'?'}</div>
                    <div><p> ${entry.type}: ${entry.total}</p></div>
                    <h2>Link</h2>
                    <table border="1" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Relation</th>
                            <th scope="col">Url</th>
                        </tr>
                    </thead>
                    <tbody>`;
            if (entry.link) {
                entry.link.forEach((elem,index)=>{
                    html += `
                        <tr>
                            <td>${elem.relation}</td>
                            <td>${elem.url}</td>
                        <tr>
                    `
                })
            }
            html += `</tbody></table></div>`
        }
        return(html)
    }
    //--------------------------------------------------------
    let insertPatientNameTable = (table) =>{
        let html = "?"
        if(! Array.isArray(table)){
            table = [].push(table)

        }
        console.log(table)
        if(table && Array.isArray(table)){
                html =   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
            
                html += `<th scope="col">text</th>
                        <th scope="col">family</th>
                        <th scope="col">given</th>
                        <th scope="col">prefix</th>
                        <th scope="col">suffix</th>
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.text?element.text:'?'}</td> 
                                    <td>${element.family?element.family:'?'}</td> 
                                    <td>${element.given?element.given:'?'}</td> 
                                    <td>${element.prefix?element.prefix:'?'}</td> 
                                    <td>${element.suffix?element.suffix:'?'}</td> 
                                    </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
     //--------------------------------------------------------
     let insertContactNameTable = (table) =>{

        let html = ""
       
       //if(Array.isArray(table)){
                html =   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
                html += `<th scope="col">text</th>
                        <th scope="col">family</th>
                        <th scope="col">given</th>
                        <th scope="col">prefix</th>
                        <th scope="col">suffix</th>
                `
                html += ` </tr> </thead> <tbody>`;
                let element = table
             //   table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.text?element.text:'?'}</td> 
                                    <td>${element.family?element.family:'?'}</td> 
                                    <td>${element.given?element.given:'?'}</td> 
                                    <td>${element.prefix?element.prefix:'?'}</td> 
                                    <td>${element.suffix?element.suffix:'?'}</td> 
                                    </tr>
                                `
             //   }) 
                html += `</tbody> </table></div>`;
       // }
        return(html)
    }
    //--------------------------------------------------------
    let insertPatientAddressTable = (table) =>{
        let html = "?"
        if(table && Array.isArray(table)){
                html +=   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
                html += `<th scope="col">use</th>
                        <th scope="col">line</th>
                        <th scope="col">city</th>
                        <th scope="col">State</th>
                        <th scope="col">Zip</th>
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.use?element.use:'?'}</td> 
                                    <td>${element.line?element.line:'?'}</td> 
                                    <td>${element.city?element.city:'?'}</td> 
                                    <td>${element.state?element.state:'?'}</td> 
                                    <td>${element.postalCode?element.postalCode:'?'}</td> 
                                    </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
    //--------------------------------------------------------
    let insertPatientTelecomTable = (table) =>{
        let html = "?"
        if(table && Array.isArray(table)){
                html +=   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
            
                html += `<th scope="col">System</th>
                        <th scope="col">Value</th>
                        <th scope="col">Use</th>
                        
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.system?element.system:'?'}</td> 
                                    <td>${element.value?element.value:'?'}</td> 
                                    <td>${element.use?element.use:'?'}</td> 
                                
                                    </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
      //--------------------------------------------------------
      let insertClassTable = (table) =>{
        let html = "?"
        if(table ){
                html =   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
                html += `<th scope="col">System</th>
                        <th scope="col">Code</th>
                        <th scope="col">Display</th>
                `
                html += ` </tr> </thead> <tbody>`;
             //   table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${table.system?table.system:'?'}</td> 
                                    <td>${table.code?table.code:'?'}</td> 
                                    <td>${table.display?table.display:'?'}</td> 
                                
                                    </tr>
                                `
               // }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
    //--------------------------------------------------------
    let insertCodingTable = (table) =>{
        let html = "?"
        if(table && Array.isArray(table)){
                html =   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
                html += `<th scope="col">System</th>
                        <th scope="col">Code</th>
                        <th scope="col">Display</th>
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.system?element.system:'?'}</td> 
                                    <td>${element.code?element.code:'?'}</td> 
                                    <td>${element.display?element.display:'?'}</td> 
                                
                                    </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
      
    //--------------------------------------------------------
    let insertPatientMetaTable = (element) =>{
        let html = ""
    
                html +=   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
            
                html += `<th scope="col">version</th>
                        <th scope="col">lastUpdated</th>
                        <th scope="col">source</th>
                    
                `
                html += ` </tr> </thead> <tbody>`;
        //     table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.versionId?element.versionId:'?'}</td> 
                                    <td>${element.lastUpdated?element.lastUpdated:'?'}</td> 
                                    <td>${element.source?element.source:'?'}</td> 
                                    </tr>
                                `
        //    }) 
                html += `</tbody> </table></div>`;
    
        return(html)
    }
    
    //--------------------------------------------------------
    let insertContactTable = (table) =>{
        let html = ""
        if(table && Array.isArray(table)){
                html +=   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
            
                html += `<th scope="col">relationship</th>
                        <th scope="col">name</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Address</th>
                    
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${insertRelationshipTable( element.relationship)}</td>
                                    <td>${insertContactNameTable(element.name ?element.name:[]  ) }</td>
                                    <td>${insertPatientTelecomTable(element.telecom ) }</td>
                                    <td>${insertPatientAddressTable(element.address ) }</td>
                                    </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
     
    //--------------------------------------------------------
    let insertRelationshipTable = (table) =>{
        let html = ""
        if(table){
                html +=   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
            
                html += `<th scope="col">system</th>
                        <th scope="col">code</th>
                    
                `
                html += ` </tr> </thead> <tbody>`;
                table.forEach((element, key,a) => {
                    html += `<tr>
                                    <td>${element.coding?element.coding[0].system:'?'}</td> 
                                    <td>${element.coding?element.coding[0].code:'?'}</td>                                
                                    </tr>
                                `
                }) 
                html += `</tbody> </table></div>`;
        }
        return(html)
    }
    //---------------------------------------------------------
    let fhirPatient = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)
        table += `<div><b>Count :</b> ${entry.length}   <div>
                <table border="1" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Status</th>
                            <th scope="col">ID</th>
                            <th scope="col">Identifier</th>
                            <th scope="col">name</th>
                            <th scope="col">DOB</th>
                            <th scope="col">Gender</th>
                            <th scope="col">Race/Ethnicty</th>
                            <th scope="col">Address</th>
                            <th scope="col">Marital Status</th>
                            <th scope="col">Phone</th>
                            <th scope="col">Meta</th>
                            <th scope="col">Deceased</th>
                            <th scope="col">contacts</th>
                            <th scope="col">communication</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
            entry.forEach((element, key,a) => {
             let deceased = element.resource.deceasedBoolean
                    table +=`<tr>`
                    table += `
                            <td>${element.resource.text?element.resource.text.status:"?"}</td>
                            <td>${element.resource.id}</td>
                            <td>${insertIdentifierTable( element.resource.identifier)}</td>
                            <td>${insertPatientNameTable(element.resource.name  ) }</td>
                            <td>${element.resource.birthDate?element.resource.birthDate:"?" }</td>
                            <td>${element.resource.gender?element.resource.gender:"?" }</td>
                            <td>${insertExtensionTable(element.resource.extension?element.resource.extension:'?' ) }</td>
                            <td>${insertPatientAddressTable(element.resource.address ) }</td>
                            <td>${insertCodingTable(element.resource.maritalStatus?element.resource.maritalStatus.coding:"?" ) }</td>
                            <td>${insertPatientTelecomTable(element.resource.telecom?element.resource.telecom:[] ) }</td>
                            <td>${insertPatientMetaTable(element.resource.meta?element.resource.meta:"?" ) }</td>
                            <td>${deceased}</td>
                            <td>${insertContactTable(element.resource.contact ) }</td>
                            <td>${element.resource.communication && element.resource.communication[0].language && element.resource.communication[0].language.coding  ?element.resource.communication[0].language.coding[0].code :"?" }</td>

                                `
                    table += `<tr>`
          
        })
      
        table += `</tbody></table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
  
    //---------------------------------------------------------
    let fhirEncounter = (entry,callback) =>{ //data = entries
        // add column for class
        let html = `<div>`
        html += fhirHeader(entry)
        html += `<div><b>Count :</b> ${entry.length}   <div>
                    <table border="1" class="table table-striped"> 
                    <thead>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Identifier</th>
                            <th scope="col">Status</th>         
                            <th scope="col">Class</th>
                            <th scope="col">reason</th>
                            <th scope="col">Start Time</th>
                            <th scope="col">End Time</th>
                            <th scope="col">Request</th>
                            <th scope="col">Full URL</th>
                            <th scope="col">Participant</th>
                            <th scope="col">Service Provider</th>
                            <th scope="col">meta</th>
                        </tr>
                    </thead> 
                    <tbody>`;
        entry.forEach((elem,index,array) => {
            let identifier = elem.resource.identifier
            html += `<tr>
                        <td>${elem.resource.id}</td>
                    <td>${insertIdentifierTable(elem.resource.identifier)}</td>
                
                <td>${elem.resource.status?elem.resource.status:
                        elem.resource.hospitalization && elem.resource.hospitalization.dischargeDisposition?elem.resource.hospitalization.dischargeDisposition.text:"?"}
                </td>
                <td>${insertClassTable(elem.resource.class)}</td>
                <td>${insertCodingTable(elem.resource.reasonCode ?elem.resource.reasonCode[0].coding:"?")}</td>
                <td>${elem.resource.period && elem.resource.period.start ?elem.resource.period.start:"?"}  </td>   
                <td>${elem.resource.period &&elem.resource.period.end?elem.resource.period.end:"?"}  </td>  
                <td>${elem.request && elem.request.method?elem.request.method :'?'  }:  ${elem.request && elem.request.url?elem.request.url :'?'  } </td>  
                <td>${elem.fullUrl}  </td>  

                <td>${insertParticipantTable(elem.resource.participant)}</td>

                <td>${elem.resource && elem.resource.serviceProvider?elem.resource.serviceProvider.reference :'?'  }: </td>
                <td>${elem.resource && elem.resource.meta?elem.resource.meta.source :'?'  } </td>  
    
            <tr>`;
        });
        html += `</tbody></table></div>`;
      
        if(callback){
            callback(html)
        }
        return(html)
    }
    //---------------------------------------------------------
    let fhirCondition = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)
        table += `<div><b>Count :</b> ${entry.length}   <div>
                <table border="1" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Text</th>
                            <th scope="col">Code</th>
                          
                            <th scope="col">Date Time</th>
                        </tr>
                    </thead>
                    <tbody>`;
        entry.forEach((elem,index,array) => {
            table +=`<tr>
                        <td>${elem.resource.category?elem.resource.category[0].coding[0].display:'?'}</td>
                        insertCodingTable
                        <td>${insertCodingTable(elem.resource.code && elem.resource.code.coding?elem.resource.code.coding:"?")}</td>
                        <td>${elem.resource.onsetDateTime?elem.resource.onsetDateTime:'?'}</td>
                    <tr>`;
        });
        table += `</tbody></table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
    //---------------------------------------------------------
    let fhirObservation = (entry,index,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)             
        table += `  <div><b>Count :</b> ${entry.length}   <div>
                    <table border="1" class="table table-striped"> 
                    <thead>
                        <tr>
                            <th scope="col">Status</th>
                            <th scope="col">Category</th>
                            <th scope="col">Code</th>
                    
                            <th scope="col">Date Time</th>
                        </tr>
                    </thead>
                    <tbody>`;
        entry.forEach((elem,index,array) => {
                table += `<tr>
                        <td>${elem.resource.status?elem.resource.status:'?'}</td>
                        <td>${elem.resource.category?elem.resource.category[0].text:'?'}</td>

                
                        <td>${insertCodingTable(elem.resource.code && elem.resource.code.coding?elem.resource.code.coding:"?")}</td>

                        <td>${elem.resource.effectiveDateTime?elem.resource.effectiveDateTime:'?'}</td>
                        </tr>`;
        });
        table += `</tbody></table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
   
    //---------------------------------------------------------
    let fhirProcedure = (entry,index,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)             
        table += `<div><b>Count :</b> ${entry.length}   <div>
                    <table border="1" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Identifier</th>
                            <th scope="col">ID</th>
                            <th scope="col">Status</th>
                            <th scope="col">Code</th>
                           
                            <th scope="col">Date Time</th>
                            <th scope="col">Full URL</th>
                        </tr>
                    </thead>
                    <tbody>`;
        entry.forEach((elem,index,array) => {
            table += `<tr>`
            table += `<td>${insertIdentifierTable(elem.resource.identifier)}</td>
                    <td>${elem.resource.id?elem.resource.id:'?'}</td>
                    <td>${elem.resource.status?elem.resource.status:'?'}</td>
                 
                    <td>${insertCodingTable(elem.resource.code && elem.resource.code.coding?elem.resource.code.coding:"?")}</td>

                    <td>${elem.resource.performedDateTime?elem.resource.performedDateTime:'?'}</td>
                    <td>${elem.fullUrl}</td>
                    </tr>`
        });
        table += `</tbody> </table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
    //---------------------------------------------------------
    let fhirPractitioner = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)
        table += `<div><b>Count :</b> ${entry.length}   <div>
                    <table border="1" class="table table-striped">
                     <thead>
                        <tr>
                            <th scope="col">Text</th>
                            <th scope="col">system</th>
                            <th scope="col">id</th>
                        </tr>
                    </thead>
                    <tbody>`;
        entry.forEach((elem,index,array) => {
                table += `<tr>
                            <td>${elem.resource.name[0].text}</td>
                            <td>${elem.resource.identifier[0].system}</td>
                            <td>${elem.resource.identifier[0].value}</td>
                        </tr>`;
        });
        table += `</tbody></table></div>`;
       return callback? callback(table):table
    }
    //---------------------------------------------------------
    let fhirOrganization = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)              
        table += `<div><b>Count :</b> ${entry.length}   <div>
                     <table border="1" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">id</th>
                            <th scope="col">name</th>
                            <th scope="col">oid</th>
                           
                        </tr>
                    </thead>
                    <tbody>`;
        entry.forEach((elem,index,array) => {
                
                //jsontable.push({"label":"Text","name":})
                table += `<tr>
                            <td>${elem.resource.id}</td>
                            <td>${elem.resource.name}</td>
                            <td>${elem.resource.meta.source}</td>
                            </tr>`;
        });
        table += `</tbody></table> </div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
    //---------------------------------------------------------
    let fhirMedicationRequest = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)             
        table += `<div><b>Count :</b> ${entry.length}   <div>
                    <table border="1" class="table table-striped"> 
                    <thead>
                        <tr>
                            <th scope="col">id</th>
                            <th scope="col">name</th>
                            <th scope="col">status</th>
                            <th scope="col">intent</th>
                            <th scope="col">meta</th>
                            <th scope="col">extension</th>
                            <th scope="col">identifier</th>
                            <th scope="col">medication ref</th>
                            <th scope="col">medication disp</th>
                            <th scope="col">subject ref</th>
                            <th scope="col">subject disp</th>
                            <th scope="col">dosage instruct</th>
                        
                        </tr>
                    </thead>
                <tbody>`;
        entry.forEach((elem,index,array) => {
                table += `<tr>
                    <td>${elem.resource.id?elem.resource.id:'?'}</td>
                    <td>${elem.resource.text &&elem.resource.text.status?elem.resource.text.status:"?"}</td>     
                    <td>${elem.resource.status?elem.resource.status:'?'}</td>
                    <td>${elem.resource.intent?elem.resource.intent:"?"}</td>
                    <td>${elem.resource.meta &&elem.resource.meta.language ?elem.resource.meta.language:"?"}</td>
                    <td>${insertExtensionTable(elem.resource.extension)}</td>
                    <td>${insertIdentifierTable(elem.resource.identifier)}</td>
                    <td>${elem.resource.medicationReference && elem.resource.medicationReference.reference?elem.resource.medicationReference.reference:"?"}</td>
                    <td>${elem.resource.medicationReference && elem.resource.medicationReference.display?elem.resource.medicationReference.display:"?"}</td>
              
                    <td>${elem.resource.subject && elem.resource.subject.reference?elem.resource.subject.reference:"?"}</td>
                    <td>${elem.resource.subject && elem.resource.subject.display?elem.resource.subject.display:"?"}</td>

                    <td>${insertCodingTable(elem.resource.dosageInstruction  && elem.resource.dosageInstruction.route && elem.resource.dosageInstruction.route.coding  ?elem.resource.dosageInstruction.route.coding :"?")}</td>

                <tr>`
        });
        table += `</tbody></table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
    //---------------------------------------------------------
    let fhirMedicationAdministration = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)             
        table += `<div><b>Count :</b> ${entry.length}   <div>
                    <table border="1" class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">id</th>
                            <th scope="col">name</th>
                            <th scope="col">oid</th>
                        
                        </tr>
                    </thead><tbody>`;
        entry.forEach((elem,index,array) => {
                table += `<tr>
                            <td>${elem.resource.id}</td>
                            <td>${elem.resource.name}</td>
                            <td>${elem.resource.meta.source}</td>
                        <tr>`
        });
        table += `</tbody></table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
    //---------------------------------------------------------
    let fhirImmunization = (entry,callback) =>{ //data = entries
        let table = `<div>`
        table += fhirHeader(entry)             
        table += `<div><b>Count :</b> ${entry.length}   <div>
                <table border="1" class="table table-striped"> 
                    <thead>
                        <tr>
                            <th scope="col">id</th>
                            <th scope="col">name</th>
                            <th scope="col">oid</th>
                        
                        </tr>
                    </thead>
                    <tbody>`;
        entry.forEach((elem,index,array) => {
                table += `<tr>
                            <td>${elem.resource.id}</td>
                            <td>${elem.resource.name}</td>
                            <td>${elem.resource.meta.source}</td>
                        <tr>`;
        });
        table += `</tbody></table></div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
    //---------------------------------------------------------
    let fhirDefault = (entry,callback) =>{ //data = entries
        console.log('fhirDefault')
        let table = `<div>`
        table += fhirHeader(entry)      
        entry.forEach((element, index) => {
            console.log(typeof element,element)
            Object.keys(element).forEach((elem, key,a) => {
                let o = element[elem]
                if(typeof o == 'object') {
                    Object.keys(o).forEach((el, key,a) => {
                        console.log("o.elem=",el,typeof el)
                    })
                }
                //console.log(Array.isArray( isa),`${elem} = ${element[elem]} `,element[elem])
                //if(Array.isArray(element[elem]) ) {
                //    element[keelemy].forEach((el,i,array) => {
                      //  console.log("ISARRAY\n",e)
                       
                  //  });
                //} else {
                    //console.log(`${elem} = ${element[elem]} `)
               // }
                
            })

           
            
        })       
        table += `</div>`;
        if(callback){
            callback(table)
        }
        return(table)
    }
     //--------------------------------------------------------
     let insertTable = (table) =>{//table = identifier
        //   console.log(table)
           let getheaders = (entry)=>{
               let fields = []
               table.forEach((elem,ind,ary)=>{
                   Object.keys(elem).forEach((element, key,a) => {
                     fields.push(element)
                   })
               })
               return(fields)
           }
           //----------------------------
           let headers = getheaders(table)    
           //console.log("HEADERS",headers)
           html =   `<div><table border="1" class="table table-striped">
                           <thead>
                               <tr>`
           headers.forEach((header,i)=>{
               html += `<th scope="col">${headers[i]}</th>`
           })             
           html += ` </tr> </thead> <tbody>`;
           table.forEach((elem,index,array) => {    
               html += `<tr> `
               headers.forEach((head,i) =>{
   
                   if(elem[head]){
                       if(typeof elem[head] == 'object'){
   
                           Object.keys(elem[head]).forEach((element, key,a) => {
                               console.log(element)
                               html += `<td></td> `
                           })
                           html += `<td>${JSON.stringify(elem[head])}</td> `
                       }else {
                           html += `<td>${elem[head]}</td> `
                       }
                   } else {
                     //  html += `<td></td> `
                   }
               })     
               html += `</tr>`
           })             
          
           html += `</tbody> </table></div>`;
           return(html)
       }
        //--------------------------------------------------------
        let insertIdentifierTable = (table) =>{//table = identifier
            let html = ""
            if(table && Array.isArray(table)){
                html =   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
                
                    html += `<th scope="col">System</th>
                                <th scope="col">Value</th>
                    `
                            
                html += ` </tr> </thead> <tbody>`;
                table.forEach((elem,index,array) => {    
                    
                    html += `<tr>
                            <td>${elem.system?elem.system:'?'}</td> 
                            <td>${elem.value?elem.value:'?'}<td> 
                            </tr>`
                })             
                
                html += `</tbody> </table></div>`;
            }
           return(html)
       }
         //--------------------------------------------------------
         let insertExtensionTable = (table) =>{//table = identifier
            let html = ""
            if(table && Array.isArray(table)){
                html =   `<div><table border="1" class="table table-striped">
                                <thead>
                                    <tr>`
                html += `<th scope="col">url</th>
                        <th scope="col">System </th>
                        <th scope="col">Code </th>
                        <th scope="col">Display </th>
                `
                html += ` </tr> </thead > <tbody>`;
                table.forEach((element, key,a) => {
                    console.log(element,key)
                        html += `<tr>
                                    <td>${element.url}</td> 
                                    <td>${element.system?element.systeme:(element.valueCoding && element.valueCoding.system)?element.valueCoding.system:"?"}</td> 
                                    <td>${element.valueCode?element.valueCode:(element.valueCoding && element.valueCoding.code)?element.valueCoding.code:"?"}</td> 
                                    <td>${element.valueString?element.valueString:( element.valueCoding &&element.valueCoding.display)?element.valueCoding.display:"?"}</td> 
                                
                                    </tr>
                                    `
                    }) 
                html += `</tbody> </table></div>`;
            }
           return(html)
       }

    //--------------------------------------------------------
    let insertParticipantTable = (table) =>{//table = identifier
        if(table && Array.isArray(table)){
            html =   `<div><table border="1" class="table table-striped">
                            <thead>
                                <tr>`
        
            html += `<th scope="col">Individual</th>
                    <th scope="col">Start </th>
            `
            html += ` </tr> </thead> <tbody>`;
            table.forEach((element, key,a) => {
                console.log(element,key)
                html += `<tr>
                                <td>${element.individual&&element.individual.reference?element.individual.reference:'?'}</td> 
                                <td>${element.period &&element.period.start?element.period.start:''}</td> 
                                </tr>
                            `
            }) 
            html += `</tbody> </table></div>`;
            return(html)
        }
    }


