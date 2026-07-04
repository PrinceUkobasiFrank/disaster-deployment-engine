// ═══════════════════════════════════════════════════════
// FEMA COMMUNITY LIFELINES DATA
// ═══════════════════════════════════════════════════════
const LIFELINES = {
    SAFETY: { name: "Safety & Security", icon: "fa-shield-halved" },
    FOOD_WATER: { name: "Food, Water, Shelter", icon: "fa-droplet" },
    HEALTH: { name: "Health & Medical", icon: "fa-heart-pulse" },
    ENERGY: { name: "Energy", icon: "fa-bolt" },
    COMMS: { name: "Communications", icon: "fa-tower-cell" },
    TRANSPORT: { name: "Transportation", icon: "fa-road" },
    HAZMAT: { name: "Hazardous Materials", icon: "fa-biohazard" }
};

const STABILIZATION = {
    RED: { label: "UNSTABILIZED", color: "var(--accent-red)", bg: "var(--accent-red-dim)", border: "rgba(239,68,68,0.2)" },
    YELLOW: { label: "STABILIZING", color: "var(--accent-yellow)", bg: "var(--accent-yellow-dim)", border: "rgba(234,179,8,0.2)" },
    GREEN: { label: "STABLE", color: "var(--accent-green)", bg: "var(--accent-green-dim)", border: "rgba(16,185,129,0.2)" }
};

// ═══════════════════════════════════════════════════════
// INCIDENT DATASET WITH LIFELINES & ASSETS
// ═══════════════════════════════════════════════════════
const incidents = [
    {
        id: "ZA-904",
        lat: -29.8587, lng: 31.0218,
        region: "KwaZulu-Natal Coastal Strip",
        city: "Durban", country: "South Africa",
        type: "Flash Flooding Infrastructure Collapse",
        desc: "Severe weather front downing transit lanes. Over 400 displacement instances recorded within sector grid. Infrastructure damage critical. Immediate evacuation corridors required.",
        needs: "Search & Rescue hulls, thermal blankets, field medical rations, potable water purification units.",
        time: "3 mins ago", status: "critical", priority: "CRITICAL", mode: "disaster",
        lifeline: "FOOD_WATER", stabilization: "RED",
        asset: {
            name: "S&R Helicopter MH-60", type: "ROTARY WING — SAR-04",
            icon: "fa-helicopter", status: "deployed",
            eta: "45m", fuel: "62%", load: "2.1T",
            origin: "DUR", dest: "KZN-NORTH", progress: 78,
            route: [[-29.8587, 31.0218], [-29.6, 31.2]]
        },
        cot: {
            uid: "gotg.za.904.flood.2024", type: "a-f-G-U-C",
            lat: -29.8587, lon: 31.0218, hae: 45.2,
            time: "2024-05-22T14:32:17Z", start: "2024-05-22T14:30:00Z", stale: "2024-05-22T15:30:00Z",
            detail: { contact: { callsign: "GOTG-SAR-04" }, color: { argb: "-65536" } }
        }
    },
    {
        id: "SD-112",
        lat: 15.5007, lng: 32.5599,
        region: "Sudan Relief Zone Sector B",
        city: "Khartoum", country: "Sudan",
        type: "Severe Displaced Famine Scenario",
        desc: "High volume refugee arrival cluster experiencing severe deep hydration deficits. Malnutrition rates exceeding emergency thresholds. Camp capacity at 340%.",
        needs: "Solar-activated pump components, high-protein clinical nourishment packs, mobile clinic units.",
        time: "14 mins ago", status: "warning", priority: "HIGH", mode: "disaster",
        lifeline: "HEALTH", stabilization: "YELLOW",
        asset: {
            name: "Solar Pump Array SP-12", type: "WATER INFRA — PUMP-12",
            icon: "fa-faucet", status: "deployed",
            eta: "Active", fuel: "Solar", load: "N/A",
            origin: "KRT", dest: "CAMP-B", progress: 100,
            route: [[15.5007, 32.5599], [15.52, 32.58]]
        },
        cot: {
            uid: "gotg.sd.112.famine.2024", type: "a-h-G-U-C",
            lat: 15.5007, lon: 32.5599, hae: 385.0,
            time: "2024-05-22T14:21:03Z", start: "2024-05-22T14:15:00Z", stale: "2024-05-22T16:15:00Z",
            detail: { contact: { callsign: "GOTG-PUMP-12" }, color: { argb: "-256" } }
        }
    },
    {
        id: "ET-331",
        lat: 9.1450, lng: 40.4897,
        region: "Oromia Highland Corridor",
        city: "Addis Ababa", country: "Ethiopia",
        type: "Drought & Water Security Crisis",
        desc: "Extended dry season causing borehole failure across 12 communities. Livestock mortality at 60%. Emergency water trucking routes compromised by terrain.",
        needs: "Deep-drilling rigs, water tanker convoy escort, veterinary rapid response team.",
        time: "42 mins ago", status: "warning", priority: "HIGH", mode: "disaster",
        lifeline: "FOOD_WATER", stabilization: "YELLOW",
        asset: {
            name: "Drilling Rig DR-800", type: "HEAVY EQUIP — RIG-03",
            icon: "fa-truck-monster", status: "in-transit",
            eta: "6h 12m", fuel: "89%", load: "28T",
            origin: "ADD", dest: "OROMIA-12", progress: 34,
            route: [[9.1450, 40.4897], [9.3, 40.6]]
        },
        cot: {
            uid: "gotg.et.331.drought.2024", type: "a-h-G-U-C",
            lat: 9.1450, lon: 40.4897, hae: 2355.0,
            time: "2024-05-22T13:53:41Z", start: "2024-05-22T13:45:00Z", stale: "2024-05-22T15:45:00Z",
            detail: { contact: { callsign: "GOTG-RIG-03" }, color: { argb: "-256" } }
        }
    },
    {
        id: "NG-205",
        lat: 6.5244, lng: 3.3792,
        region: "Lagos Metropolitan Zone",
        city: "Lagos", country: "Nigeria",
        type: "Supply Chain — Medical Cargo In-Transit",
        desc: "Pharmaceutical cold-chain shipment en route from EU hub. ETA 18 hours. Temperature monitoring active. Customs clearance pending at Murtala Muhammed Int'l.",
        needs: "Cold storage transfer, customs expedite liaison, ground transport to central medical depot.",
        time: "1 hr ago", status: "active", priority: "MEDIUM", mode: "air",
        lifeline: "HEALTH", stabilization: "GREEN",
        asset: {
            name: "DHL / Boeing 777F", type: "CARGO AIRCRAFT — FLIGHT GTI871",
            icon: "fa-plane", status: "in-transit",
            eta: "18h 24m", fuel: "74%", load: "12.4T",
            origin: "AMS", dest: "LOS", progress: 42,
            route: [[6.5244, 3.3792], [52.3, 4.7]]
        },
        cot: {
            uid: "gotg.ng.205.medical.2024", type: "a-f-G-U-C",
            lat: 6.5244, lon: 3.3792, hae: 11200.0,
            time: "2024-05-22T13:15:22Z", start: "2024-05-22T13:00:00Z", stale: "2024-05-22T19:00:00Z",
            detail: { contact: { callsign: "GTI871" }, color: { argb: "-16711936" } }
        }
    },
    {
        id: "KE-778",
        lat: -1.2921, lng: 36.8219,
        region: "Nairobi Eastern Logistics Hub",
        city: "Nairobi", country: "Kenya",
        type: "Supply Chain — Food Security Dispatch",
        desc: "High-energy biscuit and therapeutic food shipment dispatched from Mombasa port. 40ft container, customs released. Awaiting last-mile distribution coordination.",
        needs: "Warehouse space allocation, distribution fleet deployment, community liaison officers.",
        time: "2 hrs ago", status: "active", priority: "MEDIUM", mode: "land",
        lifeline: "FOOD_WATER", stabilization: "GREEN",
        asset: {
            name: "Convoy Truck T-440", type: "GROUND TRANSPORT — CONVOY-07",
            icon: "fa-truck", status: "in-transit",
            eta: "4h 30m", fuel: "81%", load: "18.7T",
            origin: "MBA", dest: "NBO-EAST", progress: 67,
            route: [[-1.2921, 36.8219], [-1.4, 36.9]]
        },
        cot: {
            uid: "gotg.ke.778.food.2024", type: "a-f-G-U-C",
            lat: -1.2921, lon: 36.8219, hae: 1624.0,
            time: "2024-05-22T12:30:45Z", start: "2024-05-22T12:15:00Z", stale: "2024-05-22T18:15:00Z",
            detail: { contact: { callsign: "GOTG-CONVOY-07" }, color: { argb: "-16711936" } }
        }
    }
];

// Command Hub location (for trajectory lines)
const COMMAND_HUB = { lat: -1.2921, lng: 36.8219, name: "NBO-CMD" };
