

const isEmpty  = require("./utils").isEmpty;

exports.parse = (msg,callback) =>{
    let PID = ''   
    let ROL = ''
    let PD1 = '' 
    let PV1 = '' 
    let MSH = '' 
    let ORC = ""
    let EVN = ''        
    let OBR = ''    
    let DG1 = ''
    let NK = []  
    let IN = []
    let OBX = []
    let NTE = []    
    let AL = []
    let mshcount = 0
    let mshprofile = {
        "resourceType": "Bundle",
        "text":"HL7 v2 Segments",
        "fhir_comments": [
            `Generated using NYeC HL7 viewer  ${new Date()}`
        ],
        experimental:true,
        publisher:"NYeC",
        "entry": []
    }
    //----------------------------------------------------
    let setSegments = (mshprofile,seg,resType) =>{
        if(! isEmpty(seg)) {
            if(Array.isArray(seg)){
                if(seg.length > 1){
                    let profile =   {"resourceType" :"Bundle",
                        "type":resType,
                        count:seg.length,
                        entry:seg
                    }  
                    mshprofile.entry.push(profile)
                }else {
                    mshprofile.entry.push(seg[0])
                }
            } else {
                mshprofile.entry.push(seg)
            }
        }
    }   
    //--------------------------------
    let resetSegments = () =>{
        PID = ''   
        ROL = ''
        PD1 = '' 
        PV1 = '' 
        MSH = '' 
        ORC = ""
        EVN = ''        
        OBR = ''    
        DG1 = ''
        NK = []  
        IN = []
        OBX = []
        NTE = []    
        AL = []
        mshcount = 0
    }
    //--------------------------------
    if(msg) {
        let contact = []
        let mshstart = true
        msg.forEach((elem,i) => {
            msg[i].grp = "MSH"+mshstart
            if (elem.type == "MSH"){
                mshcount +=1
                MSH =elem
                mshprofile = mshBundle(MSH)
                if( mshstart != true ){
                    resetSegments()
                }
                mshstart = false
               // console.log(mshprofile)
            }          
            if (elem.type == "EVN"){
                EVN=elem       
            }        
            if (elem.type == "PID"){
                PID=elem       
            }           
            if (elem.type == "ROL"){
                ROL=elem
            }      
            if (elem.type == "DG1"){
                let condition = DG1_fhir(elem) 
                mshprofile.entry.push(condition)
            }      
            if (elem.type == "PD1"){
                PD1=elem
            }
            if (elem.type == "PV1"){
                PV1=elem
            }
            if (elem.type == "OBR"){
                OBR = elem
            }
            if (elem.type == "ORC"){
                ORC = elem 
            }
            if (elem.type == "AL1"){
                let al = AL1_fhir(elem) 
                AL.push(al)
            }
            if (elem.type == "IN1"){
                IN.push( IN1_fhir(elem) )
            }
            if (elem.type == "NTE"){
                let nte = NTE_fhir(elem) 
                NTE.push(nte)
            }
            if (elem.type == "OBX"){
                let observation = OBX_fhir(elem,PID,PV1,ROL,EVN) 
                OBX.push(observation)
            }
            if (elem.type == "NK1"){
                let profile = NK1_fhir(elem)
                NK.push(profile)
            }
            if(i >= msg.length-1 ){
                setSegments(mshprofile,PID_fhir(PID,NK,PD1))
                setSegments(mshprofile,PV1_fhir(PV1,PID,ROL,EVN) )
                setSegments(mshprofile,ORC_fhir(ORC,PID,PV1) )
                setSegments(mshprofile,OBR_fhir(OBR)  )
  
                setSegments(mshprofile,OBX,"Observations")
                setSegments(mshprofile,NTE,"Notes")
                setSegments(mshprofile,AL,"AllergyReactions")
                setSegments(mshprofile,IN,"Payors")

            }
          
        });
    }
    if(callback){
        callback(mshprofile)
    }
} 
//-------------------------------------------------------------
let PID_fhir =(PID,NK,PD1) =>{
    let profile = null
    if( ! isEmpty(PID) ) {
        let telecom =[]
        let phoneh = XTN_fhir(PID.PID_13)
        let phoneb = XTN_fhir(PID.PID_14)       
        let phonee = XTN_fhir(PID.PID_40)
        if(! isEmpty(phoneh)) telecom.push(phoneh)
        if(! isEmpty(phoneb)) telecom.push(phoneb)
        if(! isEmpty(phonee)) telecom.push(phonee)
        
        profile  = {resource: {"resourceType" :"Patient"}}
        if(! isEmpty(PID.PID_3 )){
            profile.resource.identifier = CX_fhir(PID.PID_3,PID.PID_2)
            profile.resource.link = PID.PID_3
        }          
        if(! isEmpty(PID.PID_5 )){
            profile.resource.name = [XPN_fhir(PID.PID_5),XPN_fhir(PID.PID_9)]
        }  
        if(! isEmpty(telecom)){
            profile.resource.telecom = telecom
        }
        if(! isEmpty(PID.PID_8 )){
            profile.resource.gender =  CE_fhir( PID.PID_8)
        }  
        if(! isEmpty(PID.PID_7 )){
            profile.resource.birthDate =  CE_fhir( PID.PID_7)
        }  
        let deceased = []
        let dec =   PID.PID_30
        let dectime =   PID.PID_29
        if(! isEmpty(dec)) deceased.push(dec)
        if(! isEmpty(dectime)) deceased.push(dectime)
        if( ! isEmpty(deceased)){
            profile.resource.deceased =deceased
        }
        if(! isEmpty(PID.PID_11 )){
            profile.resource.address =  XAD_fhir( PID.PID_11)
        } 
        if(! isEmpty(PID.PID_16 )){
            profile.resource.maritalStatus =  CE_fhir( PID.PID_16)
        }
        let birth = []
        let b_1 =   PID.PID_24
        let b_2 =   PID.PID_25
        if(! isEmpty(b_1)) birth.push(b_1)
        if(! isEmpty(b_2)) birth.push(b_2)
        if( ! isEmpty(birth)){
            profile.resource.mulitpleBirth  =birth
        }
        if(! isEmpty(NK)){
            profile.resource.contact =NK
        }
        let animal = {}
        if(! isEmpty(PID.PID_35 )){
           animal.species = CWE_fhir(PID.PID_35)
        } 
        if(! isEmpty(PID.PID_36 )){
            animal.code = CWE_fhir(PID.PID_36)
         }      
         if(! isEmpty(PID.PID_37 )){
            animal.breed = CWE_fhir(PID.PID_37)
         } 
         if(! isEmpty(animal)){
            profile.resource.animal = animal
         }
         if(! isEmpty(PID.PID_15 )){
            profile.resource.communication =   PID.PID_15
        } 
        if(! isEmpty(PD1)){
            if(! isEmpty(PD1.PD1_4)){
                profile.resource.careProvider =   PD1.PD1_4
            }
        }
    }
    return profile
}
//-----------------------------------------------------------------
let mshBundle = (MSH)=>{
    let profile =     {}
    if(MSH){
        profile =     {
            "resourceType": "Bundle",
            "id" :`message-${MSH.MSH_9 && MSH.MSH_9[0] ? MSH.MSH_9[0] : MSH.MSH_9 }-to-bundle`,
            "fhir_comments": [
                `Generated using NYeC HL7 viewer  ${new Date()}`
            ],
            experimental:true,
            publisher:"NYeC",
            "entry": [
                {
                    "resource": {
                    "resourceType": "Composition",
                    "type": {
                        "coding": [
                            {
                                "code": `${MSH.MSH_9 && MSH.MSH_9[0] ? MSH.MSH_9[0] : MSH.MSH_9 }`
                            }
                        ]
                    },
                    "date": `${MSH.MSH_7}`
                    }
                },
                {
                    "resource": {
                        "resourceType": "MessageHeader",
                        "eventCoding": {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0003",
                            "code": `${MSH.MSH_9 && MSH.MSH_9[0] ? MSH.MSH_9[0] : MSH.MSH_9 }`,
                            "display": `${MSH.MSH_9 && MSH.MSH_9[0] ? MSH.MSH_9[0] : MSH.MSH_9 } ${ MSH.MSH_9 && MSH.MSH_9[1] ? MSH.MSH_9[1] : MSH.MSH_9  }`
                        },
                        "enterer": {
                            "display": `${MSH.MSH_3}`
                        },
                        "author": {
                            "display": `${MSH.MSH_4}`
                        },
                        "source": {
                            "software": `${MSH.MSH_5}`,
                            "version": `${MSH.MSH_12}`,
                            "endpoint": `${MSH.MSH_6}`
                        },
                        "reason": {
                            "coding": [
                                {
                                    "code": `${MSH.MSH_10}`
                                }
                            ]
                        }
                    }
                },
           
            ]
        }
    }    
    return profile
}
//----------------------------------------------------------------
let DG1_fhir = (DG1) => {
    let profile = null
    if( ! isEmpty(DG1) ) {
        profile  =  {resource:{"resourceType" :"Condition" }}
        if(DG1.DG1_2) {
            profile.resource.diagnosisCoinMethod = DG1.DG1_2
        } 
        if(DG1.DG1_3) {
            profile.resource.diagnosisCode= DG1.DG1_3
        } 
        if(DG1.DG1_3) {
            profile.resource.code = CWE_fhir(DG1.DG1_3)
        } 
        if(DG1.DG1_4) {
            if(! profile.resource.code) profile.resource.code = {}
            profile.resource.code.text = DG1.DG1_4
        }      
        if(DG1.DG1_5) {
            profile.resource.onsetDataTime = DG1.DG1_5
        } 
        if(DG1.DG1_6) {
            profile.resource.diagnosisType = DG1.DG1_6
        } 
        if(DG1.DG1_16) {
            profile.resource.asserter = XCN_fhir(DG1.DG1_16)
        }
        if(DG1.DG1_19) {
            profile.resource.recordedDate = DG1.DG1_19
        }
        if(DG1.DG1_20) {
            profile.resource.identifier = DG1.DG1_20
        }
        if(DG1.DG1_21) {
            profile.resource.verificationStatus = DG1.DG1_21
        } 
    }
    
    return profile
}
//----------------------------------------------------------------
let ORC_fhir = (ORC,PID,PV1) => {
    let profile = null
    if( ! isEmpty(ORC) ) {
        profile  =  {resource:{"resourceType" :"Order" }}
        if(ORC.ORC_1) {
            profile.resource.control = ORC.ORC_1        
        }   
        if(ORC.ORC_2) {
            profile.resource.identifier = ORC.ORC_2        
        }        
        if(ORC.ORC_5) {
            profile.resource.status = ORC.ORC_5       
        }  
        if(ORC.ORC_6) {
            profile.resource.responseFlag = ORC.ORC_6       
        }          
         if(ORC.ORC_9) {
            profile.resource.transactionDate = ORC.ORC_9      
        }  
        if(ORC.ORC_10) {
            profile.resource.enteredBy = XCN_fhir(ORC.ORC_10 )
        }  
        if(ORC.ORC_12) {
            profile.resource.source = XCN_fhir(ORC.ORC_12)
        }
        if(ORC.ORC_13) {
            profile.resource.location = PL_fhir(ORC.ORC_13)
        }
        if(ORC.ORC_9) {
            profile.resource.source = ORC.ORC_9
        }
        if(ORC.ORC_16) {
            profile.resource.source = CWE_fhir(ORC.ORC_16)
        }
        if(!isEmpty(PID)){
            profile.resource.subject = PID
        }
        if(!isEmpty(PV1)){
            profile.resource.encounter = PV1
        }
    }
    return profile
}
//----------------------------------------------------------------
let OBR_fhir = (OBR) => {
    let profile = null
    if( ! isEmpty(OBR) ) {
        profile  =  {resource:{"resourceType" :"ServiceRequest"}}
        if(OBR.OBR_2) {
            profile.resource.identifier = OBR.OBR_2
        }
        if(OBR.OBR_3) {
            if( !  profile.resource.identifier)  profile.resource.identifier = ""
            profile.resource.identifier += ( " - "+OBR.OBR_3)
        }
        if(OBR.OBR_4) {
            profile.resource.code = CWE_fhir(OBR.OBR_4)
        }
        if(OBR.OBR_5) {
            profile.resource.priority = OBR.OBR_5
        }
        if(OBR.OBR_6) {
            profile.resource.occuranceDateTime = OBR.OBR_6
        }
        let time = {}
        if(OBR.OBR_7) {
            time.start = OBR.OBR_7
        }
        if(OBR.OBR_7) {
            time.end = OBR.OBR_8
        }
        if(! isEmpty(time)){
            profile.resource.observationDateTime = time
        }
        ///////////
        let specimen = {}
        if(OBR.OBR_9) {
            if(! specimen.collection) specimen.collection ={}
            specimen.collection.quantity = OBR.OBR_9
        }
        if(OBR.OBR_10) {
            if(! specimen.collection) specimen.collection ={}
            specimen.collection.collector = XCN_fhir(OBR.OBR_10)
        }    
    
        if(OBR.OBR_11) {
            specimen.intent = OBR.OBR_11
        }
        if(OBR.OBR_14) {
            specimen.recievedTime = OBR.OBR_14
        }
        if(OBR.OBR_15) {
            specimen.source = OBR.OBR_15
        }
        if(OBR.OBR_39) {
            specimen.note = CWE_fhir(OBR.OBR_39)
        }
        if(! isEmpty(specimen)) {
            profile.resource.specimen = specimen
        }
        /////////////
        if(OBR.OBR_16) {
            profile.resource.practitioner = XCN_fhir(OBR.OBR_16)
        }
        if(OBR.OBR_17) {
            profile.resource.callBackNumber = XTN_fhir(OBR.OBR_17)
        }
        if(OBR.OBR_27) {
            profile.resource.quantity =OBR.OBR_27
        }
        if(OBR.OBR_29) {
            profile.resource.basedOn = CE_fhir(OBR.OBR_29)
        }
        if(OBR.OBR_31) {
            profile.resource.reasonCode = CWE_fhir(OBR.OBR_31)
        }
        if(OBR.OBR_47) {
            profile.resource.orderDetail = CWE_fhir(OBR.OBR_47)
        }
      
    }
    return profile
}
//----------------------------------------------------------------
let IN2_fhir = (IN1,IN2) => {
    let profile = null
    if( ! isEmpty(OBR) ) {
        profile  =  {resource:{"resourceType" :"Insurance" }}
        if(IN1.IN1_1) {
            profile.resource.identifier = IN1.IN1_1
        }
    }
    return profile
}
//----------------------------------------------------------------
let IN1_fhir = (IN1,IN2) => {
    let profile = null
    if( ! isEmpty(IN1) ) {
        profile  =  {resource:{"resourceType" :"Coverage" }}
        if(IN1.IN1_2) {
            profile.resource.identifier = CWE_fhir(IN1.IN1_2)
        }
        if(IN1.IN1_3) {
            profile.resource.payor = CX_fhir(IN1.IN1_3)
        }      
        if(IN1.IN1_4) {
            profile.resource.payorsName = XON_fhir(IN1.IN1_4)
        }
        if(IN1.IN1_5) {
            profile.resource.insuranceAddress = XAD_fhir(IN1.IN1_5)
        }
        if(IN1.IN1_6) {
            profile.resource.insuranceContact = XPN_fhir(IN1.IN1_6)
        }
        if(IN1.IN1_7) {
            profile.resource.insurancePhoneNumber = XTN_fhir(IN1.IN1_7)
        }
        if(IN1.IN1_8) {
            profile.resource.groupNumber = IN1.IN1_8
        }
        if(IN1.IN1_9) {
            profile.resource.groupName = XON_fhir(IN1.IN1_9)
        }
        if(IN1.IN1_10) {
            profile.resource.groupEmployeeID = CX_fhir(IN1.IN1_10)
        }
        if(IN1.IN1_11) {
            profile.resource.groupEmployeeName = XON_fhir(IN1.IN1_11)
        }
        if(IN1.IN1_12) {
            profile.resource.effectiveDate = IN1.IN1_12
        }
        if(IN1.IN1_13) {
            profile.resource.expirationDate = IN1.IN1_13
        }
        if(IN1.IN1_15) {
            profile.resource.type = CWE_fhir(IN1.IN1_15)
        }
        if(IN1.IN1_16) {
            profile.resource.name = XPN_fhir(IN1.IN1_16)
        }
        if(IN1.IN1_18) {
            profile.resource.dateBirth = IN1.IN1_18
        }
        if(IN1.IN1_19) {
            profile.resource.address = XAD_fhir(IN1.IN1_19)
        }
       
    }
    return profile
}
//----------------------------------------------------------------
let AL1_fhir = (AL1) => {
    let profile = null
    if( ! isEmpty(AL1) ) {
        profile  =  {resource:{"resourceType" :"AllergyIntolerence" }}
        if(AL1.AL1_2) {
            profile.resource.category = CWE_fhir(AL1.AL1_2)
        }
        if(AL1.AL1_3) {
            profile.resource.code = CWE_fhir(AL1.AL1_3)
        }
        if(AL1.AL1_4) {
            profile.resource.severityCode = CWE_fhir(AL1.AL1_4)
        }
        if(AL1.AL1_5) {
            profile.resource.reactionCode = AL1.AL1_5
        }
        if(AL1.AL1_6) {
            profile.resource.identificationDate = AL1.AL1_6
        }
    }
    return profile
}
//----------------------------------------------------------------
let NTE_fhir = (NTE) => {
    let profile = null
    if( ! isEmpty(NTE) ) {
        profile  =  {resource:{"resourceType" :"Note" }}
        if(NTE.NTE_1) {
            profile.resource.identifier = NTE.NTE_1
        }
        if(NTE.NTE_2) {
            profile.resource.source = NTE.NTE_2
        }
        if(NTE.NTE_3) {
            profile.resource.comment = NTE.NTE_3
        }
        if(NTE.NTE_4) {
            profile.resource.commentType = CWE_fhir(NTE.NTE_4)
        }
        if(NTE.NTE_5) {
            profile.resource.enteredBy = XCN_fhir(NTE.NTE_5)
        }
        if(NTE.NTE_6) {
            profile.resource.startDate = NTE.NTE_6
        }
        if(NTE.NTE_7) {
            profile.resource.endDate = NTE.NTE_7
        }
    }
    return profile
}
//----------------------------------------------------------------
let NK1_fhir = (NK1)=>{
    let phoneh = XTN_fhir(NK1.NK1_5 )
    let phoneb = XTN_fhir(NK1.NK1_6 )
    let telecom =null
    if(! isEmpty(phoneh) && ! isEmpty(phoneb)){
        telecom = [phoneh,phoneb]
    } else if(! isEmpty(phoneh)){
        telecom = [phoneh]
    } else if(! isEmpty(phoneb)){
        telecom = [phoneb]
    }
    let profile = null
    if( ! isEmpty(NK1) ) {
        profile  = {resource: {"resourceType" :"Contact" }}
       
        if(NK1.NK1_2 ){
            profile.resource.name = XPN_fhir(NK1.NK1_2 )
        } 
        if(NK1.NK1_3 ){
            profile.resource.relationship = CE_fhir(NK1.NK1_3)
        } 
        if(NK1.NK1_4 ){
            profile.resource.address = XAD_fhir(NK1.NK1_4)
        } 
        if(telecom ){  //nk1_5 and 6
            profile.resource.telecom = telecom
        } 
        if(NK1.NK1_7){
            profile.resource.relationship =  CE_fhir(NK1.NK1_7)
        }   
        if(NK1.NK1_8 ){
            profile.resource.period ={}
            profile.resource.period.start = NK1.NK1_8 
        }
        if(NK1.NK1_9 ){
            if( ! profile.resource.period) {
                profile.resource.period ={}
            }
            profile.resource.period.end = NK1.NK1_9 
        }
        if(NK1.NK1_15){
            profile.resource.gender =  CE_fhir(NK1.NK1_15)
        } 
        if(NK1.NK1_13){
            profile.resource.organization = XON_fhir(NK1.NK1_13)
        } 
        if(NK1.NK1_14){
            profile.resource.birthTime = CE_fhir(NK1.NK1_14)
        } 
        if(NK1.NK1_15){
            profile.resource.gender = CE_fhir(NK1.NK1_15)
        } 
        if(NK1.NK1_16){
            profile.resource.maritalStatus = CE_fhir(NK1.NK1_16)
        } 
        if(NK1.NK1_20){
            profile.resource.communication = CE_fhir(NK1.NK1_20)
        } 
        if(NK1.NK1_25){
            profile.resource.religion = CE_fhir(NK1.NK1_25)
        }     
        if(NK1.NK1_26){
            profile.resource.mothersMaidenName = XPN_fhir(NK1.NK1_26)
        } 
        if(NK1.NK1_27){
            profile.resource.nationality = CE_fhir(NK1.NK1_27)
        }   
        if(NK1.NK1_28){
            profile.resource.ethnicGroup = CE_fhir(NK1.NK1_28)
        }   
        if(NK1.NK1_30){
            if( ! profile.resource.organization)  profile.resource.organization = {contact:{}}
            profile.resource.organization.contact.name = XPN_fhir(NK1.NK1_30)
        }  
        if(NK1.NK1_31){
            if( ! profile.resource.organization)  profile.resource.organization = {contact:{}}
            profile.resource.organization.contact.telecom = XTN_fhir(NK1.NK1_31)
        }  
        if(NK1.NK1_32){
            if( ! profile.resource.organization)  profile.resource.organization = {contact:{}}
            profile.resource.organization.contact.address = XTN_fhir(NK1.NK1_32)
        }  
        if(NK1.NK1_40){
            if( ! profile.resource.telecom)  profile.resource.telecom = []
            profile.resource.telecom.push( XTN_fhir(NK1.NK1_40))
        }    
        if(NK1.NK1_41){
            if( ! profile.resource.telecom)  profile.resource.telecom = []
            profile.resource.telecom.push( XTN_fhir(NK1.NK1_41))
        }  
    }   
    return profile
}
//----------------------------------------------------------------
let OBX_fhir = (OBX,PID,PV1,ROL,EVN) => {
    let profile = null
    if( ! isEmpty(OBX) ) {
        profile  =  {resource:{"resourceType" :"Observation"}}
        if(OBX.OBX_21) {
            profile.resource.identifier = OBX.OBX_21
        }
        if(OBX.OBX_11) {
            profile.resource.status = OBX.OBX_11
        }
        if(OBX.OBX_3) {
            profile.resource.code = CWE_fhir(OBX.OBX_3)
        }
       
        if(PID ){
            if( PID.PID_3){
                profile.resource.subject = PID.PID_3
            }
        }
        if(OBX.OBX_3) {
            profile.resource.focus = CWE_fhir(OBX.OBX_3)
        }
        if(PV1 ){
            profile.resource.encounter = PV1_fhir(PV1,PID,ROL,EVN) 
        }
        if(OBX.OBX_14) {
            if(! profile.resource.effective) profile.resource.effective = []
            profile.resource.effective.push( OBX.OBX_14)
        }   
        if(OBX.OBX_19) {
            if(! profile.resource.effective) profile.resource.effective = []
            profile.resource.effective.push( OBX.OBX_19)
        }
        if(OBX.OBX_19) {
            profile.resource.issued = OBX.OBX_19
        }
        if(OBX.OBX_15) {
            profile.resource.performer = OBX.OBX_15
        }
        if(OBX.OBX_2) {
            if(! profile.resource.value) profile.resource.value = []
            let value = OBX.OBX_2
            profile.resource.value.push(value)
        }
        if(OBX.OBX_5) {
            if(! profile.resource.value) profile.resource.value = []
            let value = OBX.OBX_5
            profile.resource.value.push(value)
        }
        if(OBX.OBX_6) {
            if(! profile.resource.value) profile.resource.value = []
            let value = CWE_fhir(OBX.OBX_6)
            profile.resource.value.push(value)
        }
        if(OBX.OBX_8) {
            profile.resource.interpretation = CWE_fhir(OBX.OBX_8)
        }
        if(OBX.OBX_20) {
            profile.resource.bodySite = CWE_fhir(OBX.OBX_20)
        }
        if(OBX.OBX_17) {
            profile.resource.method = CWE_fhir(OBX.OBX_17)
        }
        if(OBX.OBX_17) {
            profile.resource.device = CWE_fhir(OBX.OBX_17)
        }
        if(OBX.OBX_7) {
            if(! profile.resource.referenceRange) profile.resource.referenceRange = {}
            profile.resource.referenceRange.low = OBX.OBX_7
            profile.resource.referenceRange.high = OBX.OBX_7
            profile.resource.referenceRange.text = OBX.OBX_7
        }    
        if(OBX.OBX_10) {
            if(! profile.resource.referenceRange) profile.resource.referenceRange ={}
            profile.resource.referenceRange.type = OBX.OBX_10
            profile.resource.referenceRange.appliesTo = OBX.OBX_10
        }
        if(OBX.OBX_4) {
            profile.resource.hasMember = OBX.OBX_4
        }   
        if(OBX.OBX_4) {
            profile.resource.derivedFrom = OBX.OBX_4
        }
        if(OBX.OBX_3) {
            if(! profile.resource.component) profile.resource.component = {}
            profile.resource.component.type = OBX.OBX_3
        }
        let values = []
        if(OBX.OBX_2) {
            if(! profile.resource.component) profile.resource.component = {}
            let value = OBX.OBX_2
            values.push(value)
        }
        if(OBX.OBX_5) {
            if(! profile.resource.component) profile.resource.component = {}
            let value = OBX.OBX_5
            values.push(value)
        }
        if(OBX.OBX_6) {
            if(! profile.resource.component) profile.resource.component = {}
            let value = CWE_fhir(OBX.OBX_6)
            values.push(value)
        }
        if(! isEmpty(values)){
            if(! profile.resource.component) profile.resource.component = {}
            profile.resource.component.value = values
        }
        if(OBX.OBX_8) {
            if(! profile.resource.component) profile.resource.component = {}
            profile.resource.component.interpretation =CWE_fhir(OBX.OBX_8)
         
        }
        if(OBX.OBX_7) {
            if(! profile.resource.component) profile.resource.component = {}
            profile.resource.component.referenceRange = OBX.OBX_7
        }
    }
    return profile
}
//----------------------------------------------------------------
let PV1_fhir = (PV1,PID,ROL,EVN) => {
    let profile = null
    if( ! isEmpty(PV1) ) {
        profile  =  {resource:{"resourceType" :"Encounter" }}
        if(PV1.PV1_19) {
            profile.resource.identifier = CX_fhir(PV1.PV1_19)
        }
        if(PV1.PV1_24) {
            profile.resource.status = CWE_fhir(PV1.PV1_24)
        }
        if(PV1.PV1_2) {
            profile.resource.class = CWE_fhir(PV1.PV1_2)
        }
        if(PV1.PV1_4) {
            profile.resource.type = CWE_fhir(PV1.PV1_4)
        }
        if(PV1.PV1_10) {
            profile.resource.serviceType = CWE_fhir(PV1.PV1_10)
        }
        if(PV1.PV1_25) {
            profile.resource.priority = PV1.PV1_25
        }       
        if(PID){
            profile.resource.subject = PID.PID_3    
        } 
        if(PV1.PV1_53) {
            if(! profile.resource.episodeOfCare){
                profile.resource.episodeOfCare = {}
            }
            profile.resource.episodeOfCare.start = PV1.PV1_53
        }    
        if(PV1.PV1_54) {
            if(! profile.resource.episodeOfCare){
                profile.resource.episodeOfCare = {}
            }
            profile.resource.episodeOfCare.end  = PV1.PV1_54
        }
        if(ROL){
            profile.resource.participant = {}
            profile.resource.participant.type = CWE_fhir(ROL.ROL_3)
            if(ROL.ROL_5 ) {
                if(! profile.resource.participant.period) {
                    profile.resource.participant.period = {}
                }
                profile.resource.participant.period.start = ROL.ROL_5 
            }
            if(ROL.ROL_6) {
                if(! profile.resource.participant.period) {
                    profile.resource.participant.period = {}
                }
                profile.resource.participant.period.end = ROL.ROL_6
            }
            profile.resource.participant.individual = XON_fhir(ROL.ROL_4)
        }
        if(PV1.PV1_44) {
            if(! profile.resource.period){
                profile.resource.period = {}
            }
            profile.resource.period.start  = PV1.PV1_44
        }   
        if(PV1.PV1_45) {
            if(! profile.resource.period){
                profile.resource.period = {}
            }
            profile.resource.period.end = PV1.PV1_45
        }  
        if( PV1.PV1_44 &&  PV1.PV1_45 ) {
            profile.resource.length =  PV1.PV1_45 - PV1.PV1_44
        }
        if (EVN) {
            profile.resource.reasonCode = EVN.EVN_4
            profile.resource.reasonReference = EVN.EVN_4
        }
        // hospitization
        if(PV1.PV1_5) {
            if(! profile.resource.hospitalization) profile.resource.hospitalization = {}
            profile.resource.hospitalization.preAdmissionIdentifier = PV1.PV1_5   
        }
        if(PV1.PV1_14) {
            if(! profile.resource.hospitalization) profile.resource.hospitalization = {}
            profile.resource.hospitalization.origin = PV1.PV1_14
        }
        if(PV1.PV1_13) {
            if(! profile.resource.hospitalization) profile.resource.hospitalization = {}
             profile.resource.hospitalization.reAdmission = PV1.PV1_13  
        }
        if(PV1.PV1_38) {
            if(! profile.resource.hospitalization) profile.resource.hospitalization = {}
            profile.resource.hospitalization.dietPreference = PV1.PV1_38  
        }
        if(PV1.PV1_16) {
            if(! profile.hospitalization) profile.resource.hospitalization = {}
            profile.resource.hospitalization.specialCourtesy = PV1.PV1_16  
        }
        if(PV1.PV1_15) {
            if(! profile.resource.hospitalization) profile.resource.hospitalization = {}    
            profile.resource.hospitalization.specialArrangement = PV1.PV1_15  
        }
        if(PV1.PV1_37) {
            if(! profile.resource.hospitalization) profile.resource.hospitalization = {}    
            profile.resource.hospitalization.destination = PV1.PV1_37  
        }  
        if(PV1.PV1_36) {
            if(! profile.hospitalization) profile.hospitalization = {}    
            profile.resource.hospitalization.dischargeDisposition = CWE_fhir(PV1.PV1_36)  
        }
        //location/s
        let locations = []
        if(PV1.PV1_3) {  //assigned location
            let loc  = PL_fhir(PV1.PV1_3  )
            if(loc){
                locations.push(loc)
            }
        }
        if(PV1.PV1_6) {  
            let loc  = PL_fhir(PV1.PV1_6  )
            if(loc){
                locations.push(loc)
            }
        }
        if(PV1.PV1_11) { 
            let loc  = PL_fhir(PV1.PV1_11  )
            if(loc){
                locations.push(loc)
            }
        }
        if(PV1.PV1_42) { 
            let loc  = PL_fhir(PV1.PV1_42  )
            if(loc){
                locations.push(loc)
            }
        } 
        if(PV1.PV1_43) {  
            let loc  = PL_fhir(PV1.PV1_43  )
            if(loc){
                locations.push(loc)
            }
        }
        if( ! isEmpty(locations)){
            profile.resource.location = locations
        }
        //-----------------
        // profile.serviceProvider = 
        let providers = []
        if(PV1.PV1_7) { 
            let provider  = XCN_fhir(PV1.PV1_7  )
            if(provider){
                providers.push(provider)
            }
        }
        if(PV1.PV1_8) { 
            let provider  = XCN_fhir(PV1.PV1_8  )
            if(provider){
                providers.push(provider)
            }
        }
        if(PV1.PV1_9) { 
            let provider  = XCN_fhir(PV1.PV1_9 )
            if(provider){
                providers.push(provider)
            }
        }
        if(PV1.PV1_17) { 
            let provider  = XCN_fhir(PV1.PV1_17 )
            if(provider){
                providers.push(provider)
            }
        }
        if( ! isEmpty(providers)){
            profile.resource.serviceProvider = providers
        }
        //--------
    }
    return profile
}
//------------------------------------------------------------------




//  Lookups =========================================================

let AUI_fhir = (AUI)=>{
    let profile = null
    if( ! isEmpty(AUI) ) {
        profile  = {}
        if(Array.isArray(XPN) ) {
            if(! isEmpty(AUI[0] )){
                profile.authorizationNumber = AUI[0]
            }     
            if(! isEmpty(AUI[1] )){
                profile.date = AUI[1]
            } 
            if(! isEmpty(AUI[2] )){
                profile.source = AUI[2]
            } 
        }else{
            profile.value = AUI
        }   
    }   
    return profile
}
//----------------------------------------------
let XPN_fhir = (XPN)=>{
    let profile = null
    if( ! isEmpty(XPN) ) {
        profile  = {}
        if(Array.isArray(XPN) ) {
           
            if(! isEmpty(XPN[0] )){
                profile.family = XPN[0]
            }     
            if(! isEmpty(XPN[1] )){
                profile.given = XPN[1]
            } 
            if(! isEmpty(XPN[2] )){

                profile.middle = XPN[2]
            } 
            if(! isEmpty(XPN[3] )){ 
                profile.suffix = XPN[1]
            } 
            if(! isEmpty(XPN[4] )){
                profile.prefix = XPN[1]
            } 
            if(! isEmpty(XPN[6] )){
                profile.use = XPN[6]
            } 
            if(! isEmpty(XPN[11] )){
                profile.period ={}
                profile.start = XPN[11]
            }
            if(! isEmpty(XPN[12] )){
                if( ! profile.period) {
                    profile.period ={}
                }
                profile.period.end = XPN[12]
            }
        }else{
            profile.value = XPN
        }   
    }   
    return profile
}
//----------------------------------------------
let CX_fhir = (CX,CX2)=>{
    let profile = null
    if( ! isEmpty(CX) ) {
        profile  = {resource: {"resourceType" :"Identifier","use": "usual" }}
        if(Array.isArray(CX) ) {
            if(! isEmpty(CX[0] )){
                profile.resource.value = CX[0]
            }     
            if(! isEmpty(CX[3] )){
                profile.resource.assigner = CX[3]
            } 
            if(! isEmpty(CX[4] )){
                profile.resource.type = CX[4]
            } 
            if(! isEmpty(CX[5] )){
                profile.resource.system = CX[5]
            }            
            if(! isEmpty(CX[8] )){
                profile.resource.use = CX[8]
            }     
            if(! isEmpty(CX[6] )){
                profile.resource.period ={}
                profile.resource.period.start = CX[6]
            }
            if(! isEmpty(CX[7] )){
                if( ! profile.resource.period) {
                    profile.resource.period ={}
                }
                profile.resource.period.end = CX[7]
            }
        }else{
                profile.value = CX2? CX2 +" , " +CX: CX
        }    
    }
    return profile
}
//----------------------------------------------
let XAD_fhir = (XAD)=>{
    let profile = null
    if( ! isEmpty(XAD) ) {
        profile  =  {
                "resourceType" : "Address"
        }
        if(! isEmpty(XAD[0] )){
            profile.line = XAD[0]
        } 
        if(! isEmpty(XAD[2] )){
            profile.city = XAD[2]
        }
        if(! isEmpty(XAD[8] )){
            profile.district = XAD[8]
        } 
        if(! isEmpty(XAD[3] )){
            profile.state = XAD[3]
        }
        if(! isEmpty(XAD[4] )){
            profile.postalCode = XAD[4]
        } 
        if(! isEmpty(XAD[5] )){
            profile.country = XAD[5]
        }    
        if(! isEmpty(XAD[6] )){
            profile.type = XAD[6]
        }    
        if(! isEmpty(XAD[12] )){
            profile.period ={}
            profile.period.start = XAD[12]
        }
        if(! isEmpty(XAD[13] )){
            if( ! profile.period) {
                profile.period ={}
            }
            profile.period.end = XAD[13]
        }
        if(! isEmpty(XAD[17] )){
            profile.use = XAD[17]
        }
    }            
    return profile
}
let XTN_fhir = (XTN)=>{
    let profile =null
    if( ! isEmpty(XTN) ) {
        profile  =  {
                "resourceType" : "ContactPoint",
        }
        if(Array.isArray(XTN) ) {
            if(! isEmpty(XTN[0] )){
                profile.value = XTN[0]
            }     
            if(! isEmpty(XTN[1] )){
                profile.use = XTN[1]
            } 
            if(! isEmpty(XTN[3] )){
                profile.system = XTN[3]
            } 
            if(! isEmpty(XTN[17] )){
                profile.rank = XTN[17]
            } 
            if(! isEmpty(XTN[12] )){
                profile.period ={}
                profile.period.start = XTN[12]
            }
            if(! isEmpty(XTN[13] )){
                if( ! profile.period) {
                    profile.period ={}
                }
                profile.period.end = XTN[13]
            }
        }else{
            profile.value = XTN
        }    
    }            
    return profile
}
let EI_fhir = (CE)=>{

    let profile =null
    if( ! isEmpty(CE) ) {
        profile  =  {}
        if(Array.isArray(CE) ) {
            profile.code =[]
            coding= {}
            if(! isEmpty(CE[0] )){
                coding.identifier = CE[0]
            }       
            if(! isEmpty(CE[1] )){
                coding.code = CE[1]
            }      
            if(! isEmpty(CE[2] )){
                coding.system = CE[2]
            }    
            if(! isEmpty(CE[3] )){
                coding.systemType = CE[3]
            }    
            profile.code.push(coding)
        }else{
            profile.code = CE
        }    
    }            
    return profile
}
let CE_fhir = (CE)=>{

    let profile =null
    if( ! isEmpty(CE) ) {
        profile  =  {}
        if(Array.isArray(CE) ) {
            profile.code =[]
            coding= {}
            if(! isEmpty(CE[0] )){
                coding.code = CE[0]
            }       
            if(! isEmpty(CE[1] )){
                coding.display = CE[1]
            }      
            if(! isEmpty(CE[2] )){
                coding.system = CE[2]
            }    
            profile.code.push(coding)
        }else{
            profile.code = CE
        }    
    }            
    return profile
}
let CWE_fhir = (CWE)=>{
    let profile =null
    if( ! isEmpty(CWE) ) {
        profile  =  {
                "resourceType" : "CodeableConcept",
        }
        if(Array.isArray(CWE) ) {
            profile.coding =[]
            coding= {}
           
            if(! isEmpty(CWE[0] )){
                coding.code = CWE[0]
            }       
            if(! isEmpty(CWE[1] )){
                coding.display = CWE[1]
            }      
            if(! isEmpty(CWE[2] )){
                coding.system = CWE[2]
            }    
            profile.coding.push(coding)          
        }else{
            profile.code = CWE
        }    
    }            
    return profile
}
let XON_fhir = (XON)=>{

    let profile =null
    if( ! isEmpty(XON) ) {
        profile  =  {
                "resourceType" : "Organization",
        }
        if(Array.isArray(XON) ) {
            if(! isEmpty(XON[9] )){
                profile.identifier = XON[9]
            }     
            if(! isEmpty(XON[1] )){
                profile.type = CE_fhir(XON[1])
            }           
            if(! isEmpty(XON[0] )){
                profile.name = XON[0]
            }           
            if(! isEmpty(XON[8] )){
                profile.alias = XON[8]
            }                 
            if(! isEmpty(XON[5] )){
                profile.contact = XON[5]
            }           
            if(! isEmpty(XON[7] )){
                profile.endpoint = XON[7]
            }           
        }else{
            profile.value = XON
        }    
    }            
    return profile
}
let XCN_fhir = (XCN)=>{
    
        let profile =null
        if( ! isEmpty(XCN) ) {
            profile  =  {
                    "resourceType" : "Person",
            }
            if(Array.isArray(XCN) ) {
                if(! isEmpty(XCN[0] )){
                    profile.identifier = XCN[0]
                }     
                if(! isEmpty(XCN[1] )){
                    profile.family = CE_fhir(XCN[1])
                }           
                if(! isEmpty(XCN[2] )){
                    profile.given = XCN[2]
                }           
                if(! isEmpty(XCN[3] )){
                    profile.other = XCN[3]
                }                 
                if(! isEmpty(XCN[4] )){
                    profile.suffix = XCN[4]
                }           
                if(! isEmpty(XCN[5] )){
                    profile.prefix = XCN[5]
                }           
                if(! isEmpty(XCN[6] )){
                    profile.degree = XCN[6]
                }           
                if(! isEmpty(XCN[7] )){
                    profile.soueceTable = XCN[7]
                }           
                if(! isEmpty(XCN[8] )){
                    profile.asigningAuthority = XCN[8]
                }           
                if(! isEmpty(XCN[13] )){
                    profile.asigningFacility = XCN[13]
                }           
            }else{
                profile.value = XCN
            }    
        }            
        return profile
}
let PL_fhir = (PL)=>{
    let profile =null
    if( ! isEmpty(PL) ) {
        profile  =  {
                "resourceType" : "PersonLocation",
        }
        if(PL[0] ){
            profile.pointOfCare =PL[0]
        } 
        if(PL[1] ){
            profile.room =PL[1]
        } 
        if(PL[2] ){
            profile.bed =PL[2]
        } 
        if(PL[3] ){
            profile.facility =PL[3]
        } 
        if(PL[4] ){
            profile.locationStatus =PL[4]
        } 
        if(PL[5] ){
            profile.personLocationType =PL[5]
        } 
        if(PL[6] ){
            profile.building =PL[6]
        } 
        if(PL[7] ){
            profile.floor =PL[7]
        } 
        if(PL[8] ){
            profile.locationDescription =PL[8]
        } 
        if(PL[9] ){
            profile.LocalIdentifier =PL[9]
        } 
        if(PL[10] ){
            profile.assigningAutority =PL[10]
        } 
      
           
    }            
    return profile
}
