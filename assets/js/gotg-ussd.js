let currentRoute = "dialer";
let dialedString = "";
let userData = { role: "", incidentType: "", location: "", suppliesNeeded: "" };

const menus = {
    root: "Gift of the Givers
Emergency Response Hub

1. Report Active Disaster
2. Field Volunteer Sign-in
3. Request Aid / Supplies
4. Check Active Drop-off Zones",

    // 1. Report Disaster Branch
    disasterType: "Select Disaster Type:

1. Flood / Storm Damage
2. Fire Outbreak
3. Water / Drought Crisis
4. Structural Collapse",
    disasterLoc: "Enter Location details:
(e.g., Town, Street or Ward Name)",
    disasterConfirm: "Submit Report?

1. Confirm & Send Dispatch
2. Cancel",

    // 2. Volunteer Branch
    volunteerID: "Enter your Registered 4-Digit Field ID:",
    volunteerStatus: "Welcome back.
Set your Active Status:

1. Available for Dispatch
2. On-Site (Working)
3. Off-Duty",

    // 3. Request Aid Branch
    aidType: "What resources are critically required?

1. Fresh Water / Borehole Access
2. Food Parcels / Blankets
3. Medical Assistance Team
4. Baby Care Packs",
    aidLoc: "Enter Delivery/Distribution Location:",
    aidConfirm: "Submit Aid Request?

1. Confirm Request
2. Cancel",

    // 4. Drop-off Zones
    zones: "Active Collection Hubs:

1. Western Cape: Cape Town Stadium
2. Gauteng: Johannesburg Office
3. KZN: Durban North Hub

0. Back",

    // End States
    success: "Thank you. Your entry has been logged securely into the Central Admin Control Dashboard. Response teams will communicate via SMS.",
    cancelled: "Session ended. No data was submitted."
};

const dialerScreen = document.getElementById("dialerScreen");
const dialerNumber = document.getElementById("dialerNumber");
const ussdBox = document.getElementById("ussdBox");
const ussdText = document.getElementById("ussdText");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const cancelBtn = document.getElementById("cancelBtn");
const logBox = document.getElementById("logBox");

function pressKey(num) {
    dialedString += num;
    dialerNumber.innerText = dialedString;
}

function backspaceKey() {
    if (dialedString.length > 0) {
        dialedString = dialedString.slice(0, -1);
        dialerNumber.innerText = dialedString;
    }
}

function triggerUSSD() {
    if (dialedString === "*3664#") {
        dialerScreen.style.display = "none";
        ussdBox.style.display = "flex";
        logBox.innerHTML = "> Session started. Dialed *3664#";
        renderMenu("root");
    } else if (dialedString === "") {
        alert("Enter the USSD channel code first.");
    } else {
        alert("Invalid MMI Code. Try dialing *3664#");
        dialedString = "";
        dialerNumber.innerText = "";
    }
}

function renderMenu(menuKey) {
    currentRoute = menuKey;
    ussdText.innerText = menus[menuKey];
    userInput.value = "";

    if(menuKey === 'success' || menuKey === 'cancelled') {
        userInput.style.display = 'none';
        sendBtn.style.display = 'none';
        cancelBtn.innerText = "Exit";
    } else {
        userInput.style.display = 'block';
        sendBtn.style.display = 'block';
        cancelBtn.innerText = "Cancel";
        userInput.focus();
    }
}

function logAction(msg) {
    logBox.innerHTML += `<br>> ${msg}`;
    logBox.scrollTop = logBox.scrollHeight;
}

function processInput() {
    const input = userInput.value.trim();
    if (!input && userInput.style.display !== 'none') return;

    logAction(`User entered: "${input}"`);

    switch (currentRoute) {
        case "root":
            if (input === "1") {
                userData.role = "Disaster Reporter";
                renderMenu("disasterType");
            } else if (input === "2") {
                userData.role = "Volunteer";
                renderMenu("volunteerID");
            } else if (input === "3") {
                userData.role = "Aid Seeker";
                renderMenu("aidType");
            } else if (input === "4") {
                renderMenu("zones");
            } else {
                alert("Invalid option. Choose 1 - 4");
            }
            break;

        case "disasterType":
            const types = ["Flooding", "Fire Outbreak", "Drought Status", "Building Collapse"];
            const idx = parseInt(input) - 1;
            if (idx >= 0 && idx < 4) {
                userData.incidentType = types[idx];
                renderMenu("disasterLoc");
            } else {
                alert("Select option 1 to 4");
            }
            break;
        case "disasterLoc":
            userData.location = input;
            renderMenu("disasterConfirm");
            break;
        case "disasterConfirm":
            if (input === "1") {
                logAction(`COMMAND HUB AUDIT: ${userData.incidentType} flagged at "${userData.location}"`);
                renderMenu("success");
            } else {
                renderMenu("cancelled");
            }
            break;

        case "volunteerID":
            logAction(`Validated ID: ${input}`);
            renderMenu("volunteerStatus");
            break;
        case "volunteerStatus":
            if (["1", "2", "3"].includes(input)) {
                logAction(`Status modification update executed.`);
                renderMenu("success");
            } else {
                renderMenu("cancelled");
            }
            break;

        case "aidType":
            const materials = ["Water Access", "Rations & Blankets", "Medical Unit", "Infant Packs"];
            const aidIdx = parseInt(input) - 1;
            if (aidIdx >= 0 && aidIdx < 4) {
                userData.suppliesNeeded = materials[aidIdx];
                renderMenu("aidLoc");
            } else {
                alert("Select option 1 to 4");
            }
            break;
        case "aidLoc":
            userData.location = input;
            renderMenu("aidConfirm");
            break;
        case "aidConfirm":
            if (input === "1") {
                logAction(`INVENTORY COMMIT: Allocation of "${userData.suppliesNeeded}" routed to "${userData.location}"`);
                renderMenu("success");
            } else {
                renderMenu("cancelled");
            }
            break;

        case "zones":
            if (input === "0") {
                renderMenu("root");
            } else {
                renderMenu("success");
            }
            break;
    }
}

function exitUSSD() {
    if (currentRoute === 'success' || currentRoute === 'cancelled') {
        resetSession();
    } else {
        logAction("Session killed by client.");
        renderMenu("cancelled");
    }
}

function resetSession() {
    dialedString = "";
    userData = { role: "", incidentType: "", location: "", suppliesNeeded: "" };
    dialerNumber.innerText = "";
    ussdBox.style.display = "none";
    dialerScreen.style.display = "flex";
    logBox.innerHTML = "> Device ready. Enter *3664# to start.";
    currentRoute = "dialer";
}

userInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        processInput();
    }
});
