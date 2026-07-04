// ── USSD ─────────────────────────────────────────────────────
let uCurrentRoute='dialer', uDialedString='';
let uUserData={role:'',incidentType:'',location:'',suppliesNeeded:''};
const uMenus={
    root:"Gift of the Givers
Emergency Response Hub

1. Report Active Disaster
2. Field Volunteer Sign-in
3. Request Aid / Supplies
4. Check Active Drop-off Zones",
    disasterType:"Select Disaster Type:

1. Flood / Storm Damage
2. Fire Outbreak
3. Water / Drought Crisis
4. Structural Collapse",
    disasterLoc:"Enter Location details:
(e.g., Town, Street or Ward Name)",
    disasterConfirm:"Submit Report?

1. Confirm & Send Dispatch
2. Cancel",
    volunteerID:"Enter your Registered 4-Digit Field ID:",
    volunteerStatus:"Welcome back.
Set your Active Status:

1. Available for Dispatch
2. On-Site (Working)
3. Off-Duty",
    aidType:"What resources are critically required?

1. Fresh Water / Borehole Access
2. Food Parcels / Blankets
3. Medical Assistance Team
4. Baby Care Packs",
    aidLoc:"Enter Delivery/Distribution Location:",
    aidConfirm:"Submit Aid Request?

1. Confirm Request
2. Cancel",
    zones:"Active Collection Hubs:

1. Kuruman Community Hall
2. Butterworth Sports Complex
3. Diakonia Centre, Durban

0. Back",
    success:"Thank you. Your request has been logged and sent to our Command Centre. A response team will contact you via SMS.",
    cancelled:"Session ended. No data was submitted."
};

function uPressKey(k){ uDialedString+=k; document.getElementById('ussdDialerNumber').innerText=uDialedString; }
function uBackspace(){ if(uDialedString.length>0){ uDialedString=uDialedString.slice(0,-1); document.getElementById('ussdDialerNumber').innerText=uDialedString; } }
function uTriggerUSSD(){
    if(uDialedString==='*3664#'){
        document.getElementById('ussdDialerScreen').style.display='none';
        document.getElementById('ussdBox').style.display='flex';
        uLogAction('Session started. Dialed *3664#'); uRenderMenu('root');
    } else if(!uDialedString){ showToast('Dial *3664# first'); }
    else { showToast('Try *3664#'); uDialedString=''; document.getElementById('ussdDialerNumber').innerText=''; }
}
function uRenderMenu(key){
    uCurrentRoute=key;
    document.getElementById('ussdText').innerText=uMenus[key];
    document.getElementById('ussdUserInput').value='';
    const end=key==='success'||key==='cancelled';
    document.getElementById('ussdUserInput').style.display=end?'none':'block';
    document.getElementById('ussdSendBtn').style.display=end?'none':'block';
    document.getElementById('ussdCancelBtn').innerText=end?'Exit':'Cancel';
    if(!end) document.getElementById('ussdUserInput').focus();
}
function uLogAction(msg){ const lb=document.getElementById('ussdLogBox'); lb.innerHTML+='<br>> '+msg; lb.scrollTop=lb.scrollHeight; }
function uProcessInput(){
    const input=document.getElementById('ussdUserInput').value.trim();
    if(!input) return;
    uLogAction('Input: "'+input+'"');
    switch(uCurrentRoute){
        case 'root':
            if(input==='1'){uUserData.role='Reporter';uRenderMenu('disasterType');}
            else if(input==='2'){uUserData.role='Volunteer';uRenderMenu('volunteerID');}
            else if(input==='3'){uUserData.role='Aid';uRenderMenu('aidType');}
            else if(input==='4'){uRenderMenu('zones');}
            else showToast('Choose 1–4');
            break;
        case 'disasterType':
            const dt=['Flooding','Fire Outbreak','Drought','Building Collapse'];
            const di=parseInt(input)-1;
            if(di>=0&&di<4){uUserData.incidentType=dt[di];uRenderMenu('disasterLoc');}
            else showToast('Choose 1–4'); break;
        case 'disasterLoc': uUserData.location=input; uRenderMenu('disasterConfirm'); break;
        case 'disasterConfirm':
            if(input==='1'){uLogAction('DISPATCH: '+uUserData.incidentType+' @ '+uUserData.location); uRenderMenu('success');}
            else uRenderMenu('cancelled'); break;
        case 'volunteerID': uLogAction('ID validated: '+input); uRenderMenu('volunteerStatus'); break;
        case 'volunteerStatus':
            if(['1','2','3'].includes(input)){uLogAction('Status updated.'); uRenderMenu('success');}
            else uRenderMenu('cancelled'); break;
        case 'aidType':
            const at=['Water Access','Rations & Blankets','Medical Unit','Infant Packs'];
            const ai=parseInt(input)-1;
            if(ai>=0&&ai<4){uUserData.suppliesNeeded=at[ai];uRenderMenu('aidLoc');}
            else showToast('Choose 1–4'); break;
        case 'aidLoc': uUserData.location=input; uRenderMenu('aidConfirm'); break;
        case 'aidConfirm':
            if(input==='1'){uLogAction('SUPPLY: '+uUserData.suppliesNeeded+' → '+uUserData.location); uRenderMenu('success');}
            else uRenderMenu('cancelled'); break;
        case 'zones':
            if(input==='0') uRenderMenu('root'); else uRenderMenu('success'); break;
    }
}
function uExitUSSD(){ if(uCurrentRoute==='success'||uCurrentRoute==='cancelled') uResetSession(); else{uLogAction('Cancelled.'); uRenderMenu('cancelled');} }
function uResetSession(){
    uDialedString=''; uCurrentRoute='dialer';
    uUserData={role:'',incidentType:'',location:'',suppliesNeeded:''};
    document.getElementById('ussdDialerNumber').innerText='';
    document.getElementById('ussdBox').style.display='none';
    document.getElementById('ussdDialerScreen').style.display='flex';
    document.getElementById('ussdLogBox').innerHTML='> Ready. Dial *3664# to begin.';
}
document.addEventListener('DOMContentLoaded',()=>{
    const inp=document.getElementById('ussdUserInput');
    if(inp) inp.addEventListener('keypress',e=>{ if(e.key==='Enter'){e.preventDefault();uProcessInput();} });
});