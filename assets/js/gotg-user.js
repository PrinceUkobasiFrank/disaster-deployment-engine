// ── ROLE ──────────────────────────────────────────────────────
let currentRole = null;

function selectRole(role) {
    currentRole = role;
    document.getElementById('roleScreen').classList.add('hidden');

    const tags = { beneficiary: 'Need Help', volunteer: 'Volunteer', donor: 'Donor' };
    const labels = { beneficiary: 'Looking for Help', volunteer: 'Field Volunteer', donor: 'Donor' };
    document.getElementById('roleTag').textContent = tags[role];
    document.getElementById('profileRoleLabel').textContent = labels[role];

    document.getElementById('view-beneficiary').style.display = role === 'beneficiary' ? 'block' : 'none';
    document.getElementById('view-volunteer').style.display  = role === 'volunteer'   ? 'block' : 'none';
    document.getElementById('view-donor').style.display      = role === 'donor'       ? 'block' : 'none';

    // Show tasks tab only for volunteers
    document.getElementById('nav-tasks').style.display = role === 'volunteer' ? 'flex' : 'none';

    // Adjust report tab label
    document.getElementById('nav-report').querySelector('span').textContent = role === 'volunteer' ? 'Report' : 'Get Help';

    initMap();
    setTimeout(() => listenToCommand(), 800);
}

function goBack() {
    document.getElementById('roleScreen').classList.remove('hidden');
    currentRole = null;
    switchTab('tab-home');
}

// ── TAB SWITCHING ─────────────────────────────────────────────
const tabMap = { 'tab-home':'nav-home','tab-map':'nav-map','tab-tasks':'nav-tasks','tab-report':'nav-report','tab-profile':'nav-profile' };
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const navId = tabMap[tabId];
    if (navId) document.getElementById(navId).classList.add('active');
    document.querySelector('.content').scrollTo({ top:0, behavior:'smooth' });
    if (tabId === 'tab-map' && !mapInitialized) initMap();
}

// ── THEME ─────────────────────────────────────────────────────
let dark = false;
function toggleTheme() {
    dark = !dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    document.getElementById('themeBtn').innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

// ── TASKS ─────────────────────────────────────────────────────
function toggleTask(card) {
    const box = card.querySelector('.task-checkbox');
    const title = card.querySelector('.task-title');
    const icon  = box.querySelector('i');
    const checked = box.classList.toggle('checked');
    title.classList.toggle('completed', checked);
    icon.style.display = checked ? 'block' : 'none';
    if (checked) showToast('Task marked done — sent to Command ✓');
}

// ── MAP ───────────────────────────────────────────────────────
let userMap = null, mapInitialized = false;

function initMap() {
    if (mapInitialized) return;
    mapInitialized = true;
    userMap = L.map('userMap', { zoomControl: true, attributionControl: false }).setView([-27.452, 23.409], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom:19, subdomains:'abcd' }).addTo(userMap);

    aidLocations.forEach(loc => {
        const icon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${loc.color};box-shadow:0 0 8px ${loc.color};border:2px solid rgba(255,255,255,0.4)"></div>`,
            iconSize:[14,14], iconAnchor:[7,7]
        });
        L.marker([loc.lat, loc.lng], { icon })
         .addTo(userMap)
         .bindPopup(`<b>${loc.name}</b><br><span style="font-size:12px">${loc.desc}</span>`);
    });
    setTimeout(() => userMap.invalidateSize(), 200);
}

// ── COMMAND BROADCAST LISTENER (BroadcastChannel) ────────────
function listenToCommand() {
    if (!window.BroadcastChannel) return;
    const bc = new BroadcastChannel('gotg_command');
    bc.onmessage = (e) => {
        const msg = e.data;
        if (!msg || !msg.type) return;

        if (msg.type === 'broadcast') {
            injectCommandUpdate(msg);
            showToast('New update from Command Centre');

            // Update command alert banner
            const banner = document.getElementById('cmdAlert');
            banner.classList.remove('hidden','orange','green');
            if (msg.severity === 'urgent') banner.className = 'command-alert';
            else if (msg.severity === 'warning') banner.className = 'command-alert orange';
            else banner.className = 'command-alert green';
            banner.querySelector('.alert-text-block').innerHTML =
                `Command Centre — ${msg.title}<span>Just received · Tap to view</span>`;
        }

        if (msg.type === 'shelter_update' && msg.shelter) {
            updateShelterStatus(msg.shelter);
        }
    };
}

function injectCommandUpdate(msg) {
    const colorClass = msg.severity === 'urgent' ? 'urgent' : msg.severity === 'warning' ? 'warning' : 'info';
    const tagLabel   = msg.severity === 'urgent' ? 'Urgent' : msg.severity === 'warning' ? 'Important' : 'Update';
    const html = `
        <div class="update-card ${colorClass}" style="animation:slideUp 0.3s ease">
            <div class="cmd-badge"><i class="fa-solid fa-satellite-dish"></i> Command Centre · Live</div>
            <div class="update-tag ${colorClass}"><i class="fa-solid fa-satellite-dish"></i> ${tagLabel}</div>
            <div class="update-title">${msg.title}</div>
            <div class="update-body">${msg.body}</div>
            <div class="update-footer">
                <span class="update-time"><i class="fa-regular fa-clock"></i> Just now</span>
                ${msg.actionLabel ? `<button class="update-action" onclick="showToast('${msg.actionLabel}')">${msg.actionLabel}</button>` : ''}
            </div>
        </div>`;

    // Inject into all feeds
    ['commandFeed','commandFeedVol'].forEach(id => {
        const feed = document.getElementById(id);
        if (feed) feed.insertAdjacentHTML('afterbegin', html);
    });
}

function updateShelterStatus(shelter) {
    showToast(`Shelter update: ${shelter.name} — ${shelter.status}`);
}

// ── DONATE ───────────────────────────────────────────────────
function openDonateModal(project) {
    document.getElementById('modalProjectName').textContent = 'Fund: ' + project;
    document.getElementById('donateModal').classList.add('open');
}
function closeDonateModal() { document.getElementById('donateModal').classList.remove('open'); }
function confirmDonate() {
    const amt = document.getElementById('donateAmount').value;
    closeDonateModal();
    showToast(amt ? `R${amt} earmarked — thank you ✓` : 'Donation queued ✓');
}

// ── REPORT ───────────────────────────────────────────────────
function submitReport() {
    const type = document.getElementById('aidType').value;
    const loc  = document.getElementById('location').value;
    if (!type || !loc) { showToast('Please fill in what you need and where you are'); return; }
    showToast('Request sent to Command Centre ✓');
    ['aidType','location','headcount','desc','phone'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
}

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
// ── USSD MODAL BRIDGE ────────────────────────────────────────
function openUSSDModal() {
    document.getElementById('ussdModalOverlay').classList.add('open');
    const now = new Date();
    document.getElementById('ussdClock').textContent = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
}
function closeUSSDModal() {
    document.getElementById('ussdModalOverlay').classList.remove('open');
    if (typeof uResetSession === 'function') uResetSession();
}