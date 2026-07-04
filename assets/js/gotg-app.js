// ═══════════════════════════════════════════════════════
// BROADCASTCHANNEL — FEED GOTG-USER IN REAL TIME
// ═══════════════════════════════════════════════════════
const fieldChannel = new BroadcastChannel('gotg_field_sync');

function pushToField() {
    if (!activeIncidentId) return;
    const item = incidents.find(i => i.id === activeIncidentId);
    const payload = {
        type: 'incident_push',
        id: item.id,
        title: item.type,
        location: item.city + ', ' + item.country,
        description: item.desc,
        needs: item.needs,
        priority: item.priority,
        status: item.status,
        lat: item.lat,
        lng: item.lng,
        timestamp: new Date().toISOString()
    };
    fieldChannel.postMessage(payload);
    logFeedEntry('INCIDENT', item.id + ' — pushed to field users');
    const btn = document.getElementById('pushBtn');
    btn.classList.add('pushed');
    btn.innerHTML = '<i class="fa-solid fa-check" style="margin-right:6px"></i>Pushed';
    setTimeout(() => {
        btn.classList.remove('pushed');
        btn.innerHTML = '<i class="fa-solid fa-satellite-dish" style="margin-right:6px"></i>Push to Field';
    }, 3000);
}

function sendBroadcast() {
    const type = document.getElementById('broadcastType').value;
    const msg = document.getElementById('broadcastMsg').value.trim();
    if (!msg) return;
    const typeLabels = {
        alert: 'Emergency Alert', shelter: 'Shelter Update',
        aid: 'Aid Drop-off', road: 'Road Update', water: 'Water Update'
    };
    const payload = {
        type: 'broadcast',
        broadcastType: type,
        label: typeLabels[type],
        message: msg,
        timestamp: new Date().toISOString()
    };
    fieldChannel.postMessage(payload);
    logFeedEntry(typeLabels[type].toUpperCase(), msg.substring(0, 40) + (msg.length > 40 ? '...' : ''));
    document.getElementById('broadcastMsg').value = '';
}

function logFeedEntry(label, text) {
    const log = document.getElementById('feedLog');
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const entry = document.createElement('div');
    entry.className = 'feed-entry';
    entry.innerHTML = `<span class="feed-time">${time}</span>[${label}] ${text}`;
    log.insertBefore(entry, log.firstChild);
    if (log.children.length > 6) log.removeChild(log.lastChild);
}

// Simulate incoming USSD reports from field users appearing in command
fieldChannel.onmessage = function(e) {
    if (e.data.type === 'ussd_report') {
        logFeedEntry('USSD IN', e.data.location + ' — ' + e.data.requestType);
    }
};

// ═══════════════════════════════════════════════════════
// MAP SETUP
// ═══════════════════════════════════════════════════════
const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([5.0, 25.0], 4);

const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd'
}).addTo(map);

const satTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, opacity: 0
}).addTo(map);

let satelliteMode = false;
function toggleSatellite() {
    satelliteMode = !satelliteMode;
    if (satelliteMode) { satTiles.setOpacity(1); darkTiles.setOpacity(0.3); }
    else { satTiles.setOpacity(0); darkTiles.setOpacity(1); }
}

function resetMapView() {
    map.flyTo([5.0, 25.0], 4, { duration: 1.5 });
    closeDrawer();
}

// Marker styling
const pulseIcon = L.divIcon({ className: 'pulse-marker', iconSize: [16, 16], iconAnchor: [8, 8] });
const staticIcon = L.divIcon({
    className: 'static-marker',
    html: '<div style="width:10px;height:10px;background:#3b82f6;border-radius:50%;box-shadow:0 0 8px #3b82f6;"></div>',
    iconSize: [10, 10], iconAnchor: [5, 5]
});

// ═══════════════════════════════════════════════════════
// CURVED BEZIER TRAJECTORY LINES
// ═══════════════════════════════════════════════════════
function drawBezierCurve(start, end, color, opacity = 0.6) {
    const lat1 = start[0], lng1 = start[1];
    const lat2 = end[0], lng2 = end[1];
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const offset = 0.15;
    const controlLat = midLat + offset;
    const controlLng = midLng;

    const points = [];
    for (let t = 0; t <= 1; t += 0.02) {
        const lat = (1-t)*(1-t)*lat1 + 2*(1-t)*t*controlLat + t*t*lat2;
        const lng = (1-t)*(1-t)*lng1 + 2*(1-t)*t*controlLng + t*t*lng2;
        points.push([lat, lng]);
    }

    return L.polyline(points, {
        color: color, weight: 2, opacity: opacity,
        dashArray: '5, 5', className: 'trajectory-line'
    }).addTo(map);
}

// Animated trajectory particle
function animateTrajectory(start, end, color) {
    const lat1 = start[0], lng1 = start[1];
    const lat2 = end[0], lng2 = end[1];
    const midLat = (lat1 + lat2) / 2 + 0.15;
    const midLng = (lng1 + lng2) / 2;

    let t = 0;
    const marker = L.circleMarker([lat1, lng1], {
        radius: 3, fillColor: color, color: 'transparent', fillOpacity: 1
    }).addTo(map);

    function step() {
        t += 0.008;
        if (t > 1) { t = 0; }
        const lat = (1-t)*(1-t)*lat1 + 2*(1-t)*t*midLat + t*t*lat2;
        const lng = (1-t)*(1-t)*lng1 + 2*(1-t)*t*midLng + t*t*lng2;
        marker.setLatLng([lat, lng]);
        requestAnimationFrame(step);
    }
    step();
    return marker;
}

const activeMarkers = {};
const trajectoryLines = [];
let activeIncidentId = null;

// ═══════════════════════════════════════════════════════
// RENDER SHIPMENT CARDS WITH FEMA LIFELINES
// ═══════════════════════════════════════════════════════
function renderShipments() {
    const container = document.getElementById('shipmentList');
    container.innerHTML = '';
    document.getElementById('liveCounter').innerText = `${incidents.length} LIVE`;

    incidents.forEach(item => {
        // Map marker
        const isDisaster = item.mode === 'disaster';
        const marker = L.marker([item.lat, item.lng], { 
            icon: isDisaster ? pulseIcon : staticIcon 
        }).addTo(map);

        const label = L.divIcon({
            className: 'marker-label', html: item.id,
            iconSize: [60, 20], iconAnchor: [30, -10]
        });
        L.marker([item.lat, item.lng], { icon: label, interactive: false }).addTo(map);

        activeMarkers[item.id] = marker;
        marker.on('click', () => inspectIncident(item.id));

        // Draw trajectory to command hub
        const line = drawBezierCurve(
            [item.lat, item.lng],
            [COMMAND_HUB.lat, COMMAND_HUB.lng],
            item.stabilization === 'RED' ? '#ef4444' : 
            item.stabilization === 'YELLOW' ? '#eab308' : '#10b981'
        );
        trajectoryLines.push(line);

        // Animated particle on trajectory
        animateTrajectory([item.lat, item.lng], [COMMAND_HUB.lat, COMMAND_HUB.lng],
            item.stabilization === 'RED' ? '#ef4444' : 
            item.stabilization === 'YELLOW' ? '#eab308' : '#10b981'
        );

        // Status class
        let statusClass = 'status-active';
        if (item.status === 'critical') statusClass = 'status-critical';
        else if (item.status === 'warning') statusClass = 'status-warning';

        // Lifeline data
        const lifeline = LIFELINES[item.lifeline];
        const stab = STABILIZATION[item.stabilization];

        const card = document.createElement('div');
        card.className = 'shipment-card';
        card.dataset.id = item.id;
        card.innerHTML = `
            <div class="card-top">
                <span class="card-id">${item.id}</span>
                <span class="card-status ${statusClass}">${item.status}</span>
            </div>
            <div class="card-lifeline">
                <div class="lifeline-dot lifeline-${item.stabilization.toLowerCase()}"></div>
                <span style="color: ${stab.color}">${lifeline.name}</span>
                <span style="margin-left: auto; font-size: 10px; color: var(--text-dim); text-transform: uppercase;">${stab.label}</span>
            </div>
            <div class="card-route">
                <div class="route-point">
                    <span class="route-city">${item.city}</span>
                    <span class="route-country">${item.country}</span>
                </div>
                <i class="fa-solid fa-arrow-right route-arrow"></i>
                <div class="route-point">
                    <span class="route-city">${item.type.split(' ').slice(0,2).join(' ')}</span>
                    <span class="route-country">${item.priority} Priority</span>
                </div>
            </div>
            <div class="card-meta">
                <div class="meta-item"><i class="fa-regular fa-clock"></i>${item.time}</div>
                <div class="meta-item"><i class="fa-solid fa-tag"></i>${item.mode}</div>
                <div class="meta-item"><i class="fa-solid ${lifeline.icon}"></i>${item.lifeline}</div>
            </div>
            <div class="progress-mini">
                <div class="progress-mini-fill" style="width: ${item.asset.progress}%; background: ${stab.color};"></div>
            </div>
        `;
        card.addEventListener('click', () => inspectIncident(item.id));
        container.appendChild(card);
    });
}

// ═══════════════════════════════════════════════════════
// INSPECT / DRAWER WITH ASSET & TELEMETRY
// ═══════════════════════════════════════════════════════
function inspectIncident(id) {
    const item = incidents.find(i => i.id === id);
    if (!item) return;
    activeIncidentId = id;

    document.querySelectorAll('.shipment-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.shipment-card[data-id="${id}"]`);
    if (card) { card.classList.add('active'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

    map.flyTo([item.lat, item.lng], 8, { animate: true, duration: 1.8, easeLinearity: 0.25 });

    // Basic fields
    document.getElementById('insId').innerText = `CRITICAL LEDGER #${item.id}`;
    document.getElementById('insTitle').innerText = item.type;
    document.getElementById('insReg').innerText = `${item.city}, ${item.country} — ${item.region}`;
    document.getElementById('insType').innerText = item.type;

    const stab = STABILIZATION[item.stabilization];
    const prioEl = document.getElementById('insPriority');
    prioEl.innerText = item.priority;
    prioEl.style.color = item.priority === 'CRITICAL' ? 'var(--accent-red)' : 
                       item.priority === 'HIGH' ? 'var(--accent-orange)' : 'var(--accent-green)';

    document.getElementById('insTime').innerText = item.time;
    const statEl = document.getElementById('insStatus');
    statEl.innerText = `${item.stabilization} — ${stab.label}`;
    statEl.style.color = stab.color;
    document.getElementById('insDesc').innerText = item.desc;

    // Asset Panel
    const asset = item.asset;
    document.getElementById('assetIcon').className = `fa-solid ${asset.icon}`;
    document.getElementById('assetName').innerText = asset.name;
    document.getElementById('assetType').innerText = asset.type;
    const astStat = document.getElementById('assetStatus');
    astStat.innerText = asset.status.toUpperCase();
    astStat.className = `asset-status ${asset.status}`;
    document.getElementById('assetEta').innerText = asset.eta;
    document.getElementById('assetFuel').innerText = asset.fuel;
    document.getElementById('assetLoad').innerText = asset.load;
    document.getElementById('routeOrigin').innerText = asset.origin;
    document.getElementById('routeDest').innerText = asset.dest;
    document.getElementById('routeProgressFill').style.width = asset.progress + '%';

    // Telemetry (hidden by default)
    document.getElementById('telemetryPanel').classList.remove('active');
    document.getElementById('telemetryBtn').classList.remove('active');
    document.getElementById('telemetryBtn').innerHTML = '<i class="fa-solid fa-satellite-dish" style="margin-right:6px"></i>Inspect Telemetry';
    generateTelemetry(item);

    document.getElementById('inspectDrawer').classList.add('active');
}

// ═══════════════════════════════════════════════════════
// TELEMETRY / CoT GENERATOR
// ═══════════════════════════════════════════════════════
function generateTelemetry(item) {
    const cot = item.cot;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<<event version="2.0"
      uid="${cot.uid}"
      type="${cot.type}"
      how="m-g">
  <point lat="${cot.lat}"
         lon="${cot.lon}"
         hae="${cot.hae}"
         ce="10.0"
         le="9999999.0" />
  <detail>
    <contact callsign="${cot.detail.contact.callsign}" />
    <color argb="${cot.detail.color.argb}" />
    <precisionlocation geopointsrc="GPS" />
  </detail>
  <__group name="GOTG-RESPONSE" />
</event>`;

    const protobuf = `// TAK Protocol Version 1 — Protobuf Serialization
bf 01 bf   ; Magic header (TAK protobuf)
0a 4a      ; Event message (74 bytes)
12 20      ; UID field (32 bytes)
  ${cot.uid}
1a 08      ; Type field (8 bytes)
  ${cot.type}
22 18      ; Point message (24 bytes)
  0d ${floatToHex(cot.lat)} ; lat (float32)
  15 ${floatToHex(cot.lon)} ; lon (float32)
  1d ${floatToHex(cot.hae)} ; hae (float32)
2a 12      ; Detail message (18 bytes)
  0a 10    ; Contact callsign
    ${cot.detail.contact.callsign}`;

    // Escape HTML for display
    const escapedXml = xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/&lt;(\/?)(\w+)/g, '&lt;<span class="tag">$1$2</span>')
        .replace(/(\w+)=/g, '<span class="attr">$1</span>=')
        .replace(/"([^"]+)"/g, '"<span class="val">$1</span>"');

    const escapedProto = protobuf
        .replace(/^(bf 01 bf|0a 4a|12 20|1a 08|22 18|2a 12|0d|15|1d|0a 10)/gm, '<span class="hex">$1</span>')
        .replace(/;(.+)$/gm, '<span class="comment">;$1</span>')
        .replace(/(gotg\.\w+\.\w+\.\w+\.\d{4})/g, '<span class="val">$1</span>')
        .replace(/(a-[fh]-G-U-C)/g, '<span class="val">$1</span>')
        .replace(/(GOTG-[A-Z]+-\d{2})/g, '<span class="val">$1</span>');

    document.getElementById('telemetryCode').innerHTML = escapedXml + '

' + escapedProto;
}

function floatToHex(f) {
    const buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = f;
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

function toggleTelemetry() {
    const panel = document.getElementById('telemetryPanel');
    const btn = document.getElementById('telemetryBtn');
    panel.classList.toggle('active');
    btn.classList.toggle('active');
    if (panel.classList.contains('active')) {
        btn.innerHTML = '<i class="fa-solid fa-eye-slash" style="margin-right:6px"></i>Hide Telemetry';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-satellite-dish" style="margin-right:6px"></i>Inspect Telemetry';
    }
}

function closeDrawer() {
    document.getElementById('inspectDrawer').classList.remove('active');
    document.querySelectorAll('.shipment-card').forEach(c => c.classList.remove('active'));
    activeIncidentId = null;
}

function dispatchResources() {
    if (!activeIncidentId) return;
    const item = incidents.find(i => i.id === activeIncidentId);
    alert(`Dispatching resources to ${item.city}:
${item.needs}`);
}

// ═══════════════════════════════════════════════════════
// NAVIGATION & FILTERS
// ═══════════════════════════════════════════════════════
function setNav(el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const filter = this.innerText.toLowerCase();
        document.querySelectorAll('.shipment-card').forEach(card => {
            const id = card.dataset.id;
            const item = incidents.find(i => i.id === id);
            if (filter === 'all' || item.mode === filter || (filter === 'disaster' && item.mode === 'disaster')) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// ═══════════════════════════════════════════════════════
// REPLICATION STATUS UPDATER
// ═══════════════════════════════════════════════════════
function updateReplicationStatus() {
    const vector = [Math.floor(Math.random()*10), Math.floor(Math.random()*10), 
                   Math.floor(Math.random()*5), Math.floor(Math.random()*3), 
                   Math.floor(Math.random()*2)];
    document.getElementById('replVector').innerText = `[${vector.join(',')}]`;
    document.getElementById('replLastSync').innerText = `${Math.floor(Math.random()*30)}s ago`;
    document.getElementById('replPeers').innerText = `${5 + Math.floor(Math.random()*5)} active`;
}
setInterval(updateReplicationStatus, 8000);

// ═══════════════════════════════════════════════════════
// TACTICAL ALERT MODAL
// ═══════════════════════════════════════════════════════
const alertTarget = incidents[0];
setTimeout(() => {
    document.getElementById('qLoc').innerText = alertTarget.region;
    document.getElementById('qType').innerText = alertTarget.type;
    document.getElementById('qNeeds').innerText = alertTarget.needs;
    document.getElementById('tacticalModal').classList.add('active');
}, 4000);

function dismissAlert() {
    document.getElementById('tacticalModal').classList.remove('active');
}
function acceptAlert() {
    document.getElementById('tacticalModal').classList.remove('active');
    setTimeout(() => inspectIncident(alertTarget.id), 300);
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
renderShipments();
updateReplicationStatus();

// Ambient map drift
setInterval(() => {
    if (!activeIncidentId) {
        const center = map.getCenter();
        map.panTo([center.lat + 0.02, center.lng + 0.01], { animate: true, duration: 8 });
    }
}, 30000);
