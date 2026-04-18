// Constants & State
const DAYS = ["SUN","MON","TUE","WED","THU","FRI"];
const DAY_NAMES = {SUN:"Sunday", MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday"};
const DAY_MAP = {0:"SUN", 1:"MON", 2:"TUE", 3:"WED", 4:"THU", 5:"FRI", 6:"SAT"};

// === LOCALSTORAGE STATE MANAGEMENT ===
const STATE_KEY = 'digital_dean_v1';
function loadState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; }
    catch(e) { return {}; }
}
function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify({
        activeTab, selectedRoomDay, selectedStudentDay, selectedSyncDay,
        studentCourse, syncCourseA, syncCourseB,
        studentYear: document.getElementById('studentYearSelect')?.value || '',
        studentGroup: document.getElementById('studentGroupInput')?.value || '',
        syncYearA: document.getElementById('syncYearA')?.value || '1',
        syncGroupA: document.getElementById('syncGroupA')?.value || '',
        syncYearB: document.getElementById('syncYearB')?.value || '1',
        syncGroupB: document.getElementById('syncGroupB')?.value || '',
        lastVisited: new Date().toISOString(),
    }));
}

const _saved = loadState();
const _todayCode = DAY_MAP[new Date().getDay()] || "SUN";
const _defaultDay = _todayCode === "SAT" ? "SUN" : _todayCode;

let activeTab = _saved.activeTab || "rooms-view";
let selectedRoomDay = _saved.selectedRoomDay || _defaultDay;
let selectedStudentDay = _saved.selectedStudentDay || _defaultDay;
let selectedSyncDay = _saved.selectedSyncDay || _defaultDay;
let studentCourse = _saved.studentCourse || 'computing';
let syncCourseA = _saved.syncCourseA || 'computing';
let syncCourseB = _saved.syncCourseB || 'computing';

// === COURSE SELECTOR LOGIC ===
function updateYearOptions(selectId, course) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const currentVal = sel.value;
    if (course === 'bba') {
        sel.innerHTML = '<option value="" disabled>Select Year</option><option value="1">Year 1</option><option value="2">Year 2</option>';
    } else {
        sel.innerHTML = '<option value="" disabled>Select Year</option><option value="1">Level / Year 1</option><option value="2">Level / Year 2</option><option value="3">Level / Year 3</option>';
    }
    // Try to restore previous value if still valid
    const opts = Array.from(sel.options).map(o => o.value);
    if (opts.includes(currentVal)) sel.value = currentVal;
    else sel.value = '';
}

function updateGroupPlaceholder(inputId, course) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.placeholder = course === 'bba' ? 'Group (e.g. B1, B2)' : 'Group (e.g. C7)';
}

function setStudentCourse(course) {
    studentCourse = course;
    // Toggle button styles
    const compBtn = document.getElementById('studentCourseComputing');
    const bbaBtn = document.getElementById('studentCourseBBA');
    if (course === 'computing') {
        compBtn.classList.add('active', 'bg-primary/20', 'text-white', 'border-primary/30');
        compBtn.classList.remove('text-slate-400', 'border-transparent');
        bbaBtn.classList.remove('active', 'bg-primary/20', 'text-white', 'border-primary/30');
        bbaBtn.classList.add('text-slate-400', 'border-transparent');
    } else {
        bbaBtn.classList.add('active', 'bg-primary/20', 'text-white', 'border-primary/30');
        bbaBtn.classList.remove('text-slate-400', 'border-transparent');
        compBtn.classList.remove('active', 'bg-primary/20', 'text-white', 'border-primary/30');
        compBtn.classList.add('text-slate-400', 'border-transparent');
    }
    updateYearOptions('studentYearSelect', course);
    updateGroupPlaceholder('studentGroupInput', course);
    renderStudent();
    saveState();
    checkNotifications();
}

function setSyncCourse(target, course) {
    const isPrimary = target === 'A';
    if (isPrimary) syncCourseA = course; else syncCourseB = course;
    
    const btnClass = isPrimary ? '.sync-course-btn-a' : '.sync-course-btn-b';
    const activeColor = isPrimary ? 'bg-primary/20' : 'bg-success/20';
    const activeBorder = isPrimary ? 'border-primary/30' : 'border-success/30';
    
    document.querySelectorAll(btnClass).forEach(btn => {
        if (btn.dataset.course === course) {
            btn.classList.add('active', activeColor, 'text-white', activeBorder);
            btn.classList.remove('text-slate-400', 'border-transparent');
        } else {
            btn.classList.remove('active', activeColor, 'text-white', activeBorder);
            btn.classList.add('text-slate-400', 'border-transparent');
        }
    });
    
    updateYearOptions(isPrimary ? 'syncYearA' : 'syncYearB', course);
    updateGroupPlaceholder(isPrimary ? 'syncGroupA' : 'syncGroupB', course);
    renderSync();
    saveState();
}

function filterScheduleByCourse(course) {
    if (course === 'bba') return SCHEDULE.filter(e => e.course === 'BBA');
    return SCHEDULE.filter(e => !e.course);
}

const ALL_ROOMS = [...new Set(SCHEDULE.map(e => e.room))].sort();

// DOM Elements
const elDrawer = document.getElementById('drawerPanel');
const elOverlay = document.getElementById('drawerOverlay');
const elDrawerTitle = document.getElementById('drawerTitle');
const elDrawerSubtitle = document.getElementById('drawerSubtitle');
const elDrawerContent = document.getElementById('drawerContent');
const elTooltip = document.getElementById('mapTooltip');
const elMtTitle = document.getElementById('mt-title');
const elMtBadge = document.getElementById('mt-badge');
const elMtDesc = document.getElementById('mt-desc');

// Drawer Management
function openDrawer(roomName, isFreeNow, dayCode) {
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    elOverlay.classList.add('active');
    elDrawer.classList.add('open');
    
    elDrawerTitle.textContent = roomName;
    
    const now = new Date();
    const isToday = (dayCode === DAY_MAP[now.getDay()]);

    if (isToday) {
        elDrawerSubtitle.innerHTML = isFreeNow 
            ? '<span class="text-success flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-success"></span> Available Right Now</span>' 
            : '<span class="text-danger flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-danger"></span> Currently Occupied</span>';
    } else {
        elDrawerSubtitle.innerHTML = `<span class="text-primary">${DAY_NAMES[dayCode]} Schedule Overview</span>`;
    }

    renderTimelineInDrawer(roomName, dayCode);
}

function closeDrawer() {
    document.body.style.overflow = ""; // Restore background scrolling
    elOverlay.classList.remove('active');
    elDrawer.classList.remove('open');
}

elOverlay.addEventListener('click', closeDrawer);
document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);

// Helpers
function parseTime(s) {
    const parts = s.split(/\s+/);
    if(parts.length < 2) return 0;
    const [time, period] = parts;
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
}

function formatTime(mins) {
    let h = Math.floor(mins / 60), m = mins % 60;
    const p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + " " + p;
}

function formatDuration(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h > 0 && m > 0) return h + "h " + m + "m";
    if (h > 0) return h + "h";
    return m + "m";
}

function getBlockForRoom(room) {
    const item = SCHEDULE.find(e => e.room === room);
    return item ? item.block : "Nepal";
}

// Nav Tab Switching Logic
document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        // Reset Styles
        document.querySelectorAll(".nav-tab").forEach(t => {
            t.classList.remove("active", "bg-primary/20", "border-primary/30", "text-white", "shadow-[0_0_15px_rgba(212,175,55,0.15)]");
            t.classList.add("text-slate-400", "border-transparent");
        });
        document.querySelectorAll(".view-section").forEach(v => v.classList.remove("active"));
        
        // Activate selected
        const btn = e.currentTarget;
        btn.classList.remove("text-slate-400", "border-transparent");
        btn.classList.add("active", "bg-primary/20", "border-primary/30", "text-white", "shadow-[0_0_15px_rgba(212,175,55,0.15)]");

        const targetId = btn.getAttribute("data-target");
        document.getElementById(targetId).classList.add("active");
        activeTab = targetId;
        saveState();

        if (targetId === "rooms-view") renderRooms();
        if (targetId === "schedule-view") renderStudent();
        if (targetId === "map-view") renderMap();
        if (targetId === "sync-view") renderSync();
    });
});

// Pill Builders
function buildDayTabs(containerId, activeDay, callback) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    DAYS.forEach(d => {
        const isActive = d === activeDay;
        const btn = document.createElement("button");
        btn.className = `flex-none px-4 py-2 rounded-full font-label text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-primary text-black font-bold shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-outline hover:text-white hover:bg-white/5'}`;
        btn.textContent = d;
        btn.onclick = () => { 
            callback(d); 
            buildDayTabs(containerId, d, callback); 
        };
        container.appendChild(btn);
    });
}

// --- RENDER DRAWER TIMELINE ---
function renderTimelineInDrawer(room, dayCode) {
    const entries = SCHEDULE.filter(e => e.day === dayCode && e.room === room)
        .sort((a,b) => parseTime(a.start) - parseTime(b.start));
    
    let html = '';
    if(entries.length === 0){
        html = `
        <div class="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-2xl glass-panel mt-10">
            <span class="material-symbols-outlined text-4xl text-primary/40 mb-4">weekend</span>
            <p class="font-headline text-xl text-white">All Clear</p>
            <p class="text-xs text-outline font-label uppercase tracking-widest mt-2">No schedules found for this day.</p>
        </div>`;
    } else {
        html += `<div class="relative pl-6 border-l border-white/5 mt-6 pb-12 space-y-8">`;
        
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const isToday = (dayCode === DAY_MAP[now.getDay()]);
        let cursor = 7 * 60; // 7 AM
        const END_OF_DAY = 17 * 60; // 5 PM

        entries.forEach((e, idx) => {
            const s = parseTime(e.start), en = parseTime(e.end);
            
            // Add free block if gap exists
            if (s > cursor) {
                html += `
                <div class="relative group">
                    <div class="absolute -left-[29px] top-4 w-3 h-3 rounded-full border-2 border-success bg-[#111115] z-10"></div>
                    <div class="glass-panel p-5 rounded-2xl border-l-2 border-l-success border-t-white/5 border-r-white/5 border-b-white/5">
                        <span class="text-success font-label text-[10px] uppercase font-bold tracking-widest block mb-1">Free Session</span>
                        <span class="text-white text-sm block">${formatTime(cursor)} - ${formatTime(s)}</span>
                        <span class="text-outline text-xs mt-2 block">Duration: ${formatDuration(s-cursor)}</span>
                    </div>
                </div>`;
            }

            const isCurrent = isToday && (nowMins >= s && nowMins < en);
            const glowClass = isCurrent ? "shadow-[0_0_20px_rgba(212,175,55,0.15)] border-l-primary" : "border-l-outline-variant";
            const dotClass = isCurrent ? "border-primary shadow-[0_0_8px_#d4af37]" : "border-outline-variant";

            html += `
            <div class="relative group">
                <div class="absolute -left-[29px] top-4 w-3 h-3 rounded-full border-2 ${dotClass} bg-[#111115] z-10"></div>
                <div class="glass-panel p-6 rounded-2xl border-l-2 ${glowClass} border-t-white/5 border-r-white/5 border-b-white/5 pr-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-primary font-label text-[10px] uppercase font-bold tracking-widest border border-primary/30 px-2 py-0.5 rounded">${e.type}</span>
                        <span class="text-white text-xs font-semibold bg-white/5 px-2 py-1 rounded">${e.start} - ${e.end}</span>
                    </div>
                    <h4 class="font-headline text-lg italic text-white my-3 leading-snug">${e.module}</h4>
                    <div class="flex flex-col gap-1 mt-4">
                        <span class="text-outline text-xs font-label uppercase flex items-center gap-2"><span class="material-symbols-outlined text-sm">person</span> ${e.lecturer}</span>
                        <span class="text-outline text-xs font-label uppercase flex items-center gap-2"><span class="material-symbols-outlined text-sm">groups</span> Level ${e.year} | Group ${e.group}</span>
                    </div>
                </div>
            </div>`;
            
            cursor = Math.max(cursor, en);
        });

        if (cursor < END_OF_DAY) {
            html += `
            <div class="relative group">
                <div class="absolute -left-[29px] top-4 w-3 h-3 rounded-full border-2 border-success bg-[#111115] z-10"></div>
                <div class="glass-panel p-5 rounded-2xl border-l-2 border-l-success border-t-white/5 border-r-white/5 border-b-white/5">
                    <span class="text-success font-label text-[10px] uppercase font-bold tracking-widest block mb-1">Free Session</span>
                    <span class="text-white text-sm block">${formatTime(cursor)} - 05:00 PM</span>
                    <span class="text-outline text-xs mt-2 block">Available until EOD</span>
                </div>
            </div>`;
        }
        html += `</div>`;
    }
    elDrawerContent.innerHTML = html;
}

// --- RENDER ROOMS ---
function renderRooms() {
    const query = document.getElementById("globalSearch").value.toLowerCase().trim();
    const statusFilter = document.getElementById("roomStatusFilter").value;
    const container = document.getElementById("roomListContainer");
    const meta = document.getElementById("roomResultsMeta");
    container.innerHTML = "";

    const now = new Date();
    const todayCode = DAY_MAP[now.getDay()];
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const isToday = (selectedRoomDay === todayCode);

    let filteredRooms = ALL_ROOMS.filter(r => r.toLowerCase().includes(query));
    let html = "";
    let count = 0;

    filteredRooms.forEach(room => {
        const entries = SCHEDULE.filter(e => e.day === selectedRoomDay && e.room === room)
            .sort((a,b) => parseTime(a.start) - parseTime(b.start));
        
        let isFree = true;
        let currentOccupant = null;
        let timelineBrief = "All day available";

        if (isToday) {
            const occ = entries.filter(e => { const s=parseTime(e.start), en=parseTime(e.end); return nowMins>=s && nowMins<en; });
            if (occ.length > 0) {
                isFree = false;
                currentOccupant = occ[0];
            }
        }
        
        if (statusFilter === "free" && !isFree && isToday) return;
        if (statusFilter === "occupied" && isFree && isToday) return;

        count++;
        
        const badgeClass = isToday 
            ? (isFree ? "bg-success/20 border-success/30 text-success" : "bg-danger/20 border-danger/30 text-danger") 
            : "bg-primary/10 border-primary/20 text-primary";
        const badgeText = isToday ? (isFree ? "Available Now" : "Occupied") : `${entries.length} Sessions`;
        
        // Extract a cool block name or prefix
        const blockPrefix = room.split("-")[0] || "RM";

        html += `
        <div data-room="${room}" data-free="${isFree}" class="animate-fade-up glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-primary/40 hover:-translate-y-1 transition-all duration-300" style="animation-delay: ${Math.min(count * 0.05, 0.5)}s">
            <div class="absolute -right-4 -top-4 text-7xl font-headline text-white/[0.02] italic pointer-events-none transition-transform group-hover:scale-110">${blockPrefix}</div>
            
            <div class="flex justify-between items-start mb-6 relative z-10">
                <h3 class="font-headline text-xl text-white italic drop-shadow-md pr-2 leading-tight">${room}</h3>
                <span class="flex-none font-label text-[9px] uppercase tracking-widest border px-2 py-1 rounded ${badgeClass}">${badgeText}</span>
            </div>
            
            <div class="relative z-10">
                ${!isFree && currentOccupant ? `
                    <p class="text-xs text-outline font-label uppercase tracking-widest mb-1">Current Session</p>
                    <p class="text-sm text-white font-medium truncate">${currentOccupant.module}</p>
                    <p class="text-[10px] text-primary mt-1">${currentOccupant.start} - ${currentOccupant.end}</p>
                ` : `
                    <p class="text-xs text-outline font-label uppercase tracking-widest mb-1">Status</p>
                    <p class="text-sm text-success font-medium">Ready for Use</p>
                    <p class="text-[10px] text-outline mt-1 font-label uppercase">No ongoing sessions</p>
                `}
            </div>
            
            <div class="mt-6 flex justify-end relative z-10">
                <div class="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all">
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </div>
        </div>`;
    });

    if (count === 0) {
        container.innerHTML = `
        <div class="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl">
            <span class="material-symbols-outlined text-4xl text-outline-variant mb-4">search_off</span>
            <p class="text-white font-headline text-2xl italic">No sanctuaries found</p>
            <p class="text-outline text-sm mt-2 font-label uppercase tracking-widest">Adjust filters or search parameters</p>
        </div>`;
    } else {
        container.innerHTML = html;
        // Attach Drawer events
        container.querySelectorAll('.glass-panel').forEach(card => {
            card.addEventListener('click', () => {
                const r = card.getAttribute('data-room');
                const f = card.getAttribute('data-free') === 'true';
                openDrawer(r, f, selectedRoomDay);
            });
        });
    }
    meta.innerHTML = `Cataloging <strong>${count}</strong> spaces on <strong>${DAY_NAMES[selectedRoomDay]}</strong>`;
}

// --- RENDER MY SCHEDULE HORIZONTAL/MASONRY ---
function renderStudent() {
    const yearStr = document.getElementById("studentYearSelect").value;
    const groupStr = document.getElementById("studentGroupInput").value.toUpperCase().trim();
    const container = document.getElementById("studentTimelineContainer");
    const notice = document.getElementById("studentNoticeArea");
    const meta = document.getElementById("studentResultsMeta");

    container.innerHTML = "";
    notice.innerHTML = "";
    meta.innerHTML = "";

    if (!yearStr || !groupStr) {
        container.innerHTML = `
        <div class="py-24 text-center border border-dashed border-white/10 rounded-3xl animate-fade-up">
            <span class="material-symbols-outlined text-5xl text-outline-variant mb-4 hover:rotate-12 transition-transform">fingerprint</span>
            <p class="font-headline text-3xl italic text-white mb-2">Identify Yourself</p>
            <p class="font-label text-xs uppercase tracking-widest text-primary/60">Select Year and enter Group to access chronological directives.</p>
        </div>`;
        return;
    }

    const year = parseInt(yearStr);
    const courseData = filterScheduleByCourse(studentCourse);
    const myClasses = courseData.filter(e => e.year === year && e.day === selectedStudentDay && e.group.split('+').includes(groupStr))
        .sort((a,b) => parseTime(a.start) - parseTime(b.start));

    if (myClasses.length === 0) {
        container.innerHTML = `
        <div class="py-24 text-center border border-dashed border-success/30 rounded-3xl glass-panel animate-fade-up">
            <span class="material-symbols-outlined text-5xl text-success/60 mb-4 scale-110">celebration</span>
            <p class="font-headline text-3xl italic text-success mb-2">Liberation Day</p>
            <p class="font-label text-xs uppercase tracking-widest text-outline">You have zero obligations on ${DAY_NAMES[selectedStudentDay]}.</p>
        </div>`;
        return;
    }

    meta.innerHTML = `Displaying trajectory for <strong>${DAY_NAMES[selectedStudentDay]}</strong>`;

    const now = new Date();
    const todayCode = DAY_MAP[now.getDay()];
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const isToday = (selectedStudentDay === todayCode);
    
    let lastClassEnded = false;
    if (isToday) {
        const lastClassEndMins = parseTime(myClasses[myClasses.length-1].end);
        if (nowMins >= lastClassEndMins) {
            lastClassEnded = true;
            notice.innerHTML = `<div class="bg-success/10 border border-success/20 text-success text-center py-4 rounded-xl font-label text-xs uppercase tracking-[0.1em] font-bold shadow-[0_0_15px_rgba(107,168,122,0.1)]">All sessions have successfully concluded.</div>`;
        }
    }

    let html = `<div class="absolute left-[39px] top-6 bottom-6 w-[2px] bg-white/5 hidden md:block z-0"></div>`;
    
    myClasses.forEach((e, idx) => {
        const s = parseTime(e.start), en = parseTime(e.end);
        const isPast = isToday && nowMins >= en;
        const isCurrent = isToday && (nowMins >= s && nowMins < en);
        const isNext = isToday && !isPast && !isCurrent && (nowMins < s);
        
        let extraStyle = isPast ? "opacity: 0.5; filter: grayscale(1);" : "";
        const ringColor = isCurrent ? "border-primary glow-gold bg-primary" : (isPast ? "border-outline-variant bg-surface" : "border-white bg-[#111115]");
        
        html += `
        <div class="relative flex flex-col md:flex-row gap-6 md:gap-12 animate-fade-up group" style="animation-delay: ${idx * 0.1}s; ${extraStyle}">
            <!-- Timeline Dot & Time -->
            <div class="flex md:flex-col items-center md:items-end md:w-32 flex-none z-10 pt-1 md:pt-6 gap-4 md:gap-2">
                <div class="w-8 h-8 rounded-full border-4 ${ringColor} flex items-center justify-center shrink-0 shadow-lg md:hidden"></div>
                <div class="font-label text-xs uppercase tracking-widest text-${isCurrent ? 'primary' : 'outline'} font-bold">
                    ${e.start}
                </div>
            </div>
            
            <!-- Center Dot for Desktop -->
            <div class="w-8 h-8 rounded-full border-4 ${ringColor} hidden md:flex items-center justify-center z-10 mt-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]"></div>
            
            <!-- Class Card -->
            <div class="glass-panel p-6 md:p-8 rounded-2xl border ${isCurrent ? 'border-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border-white/5'} flex-1 hover:border-primary/20 transition-all cursor-pointer" onclick="openDrawer('${e.room}', false, '${selectedStudentDay}')">
                <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-primary/20 text-primary border border-primary/20 rounded px-2 py-0.5 text-[9px] font-label uppercase tracking-widest font-bold">${e.type}</span>
                        <span class="text-white text-xs font-semibold bg-white/5 px-2 py-1 rounded">${formatDuration(en-s)}</span>
                    </div>
                    ${isCurrent ? '<span class="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-success animate-pulse"><span class="w-1.5 h-1.5 bg-success rounded-full"></span> Ongoing</span>' : ''}
                </div>
                
                <h3 class="font-headline text-2xl md:text-3xl italic text-white mb-6 leading-tight">${e.module}</h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-white/5 rounded-lg text-outline border border-white/5"><span class="material-symbols-outlined text-sm">pin_drop</span></div>
                        <div>
                            <p class="text-[9px] uppercase tracking-widest text-outline">Location</p>
                            <p class="text-sm font-semibold text-white">${e.room}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-white/5 rounded-lg text-outline border border-white/5"><span class="material-symbols-outlined text-sm">person_raised_hand</span></div>
                        <div>
                            <p class="text-[9px] uppercase tracking-widest text-outline">Faculty</p>
                            <p class="text-sm font-semibold text-white">${e.lecturer}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// --- RENDER CAMPUS MAP ---
function renderMap() {
    const nepalTop = document.getElementById('map-nepal-top');
    const nepalGround = document.getElementById('map-nepal-ground');
    const ukFirst = document.getElementById('map-uk-first');
    
    if (nepalTop) nepalTop.innerHTML = "";
    if (nepalGround) nepalGround.innerHTML = "";
    if (ukFirst) ukFirst.innerHTML = "";

    const now = new Date();
    const todayCode = DAY_MAP[now.getDay()];
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // Floor Categorization logic
    const TOP_FLOOR_TARGETS = ["ANNAPURNA", "MACHHAPUCHHRE", "MACHHAPUCHREE", "NILGIRI", "MANASLU"];

    ALL_ROOMS.forEach(room => {
        const block = getBlockForRoom(room);
        
        const entries = SCHEDULE.filter(e => e.day === todayCode && e.room === room)
            .sort((a,b) => parseTime(a.start) - parseTime(b.start));
        
        let isFree = true;
        let currentOccupant = null;
        let nextOccupant = null;

        const occ = entries.filter(e => { const s=parseTime(e.start), en=parseTime(e.end); return nowMins>=s && nowMins<en; });
        if (occ.length > 0) {
            isFree = false;
            currentOccupant = occ[0];
        } else {
            nextOccupant = entries.find(e => parseTime(e.start) > nowMins);
        }

        const stateClass = isFree 
            ? "bg-success/5 border-success/30 hover:bg-success/10 hover:border-success shadow-[inset_0_0_20px_rgba(107,168,122,0.05)]" 
            : "bg-danger/10 border-danger/40 hover:bg-danger/20 hover:border-danger shadow-[0_0_15px_rgba(207,102,121,0.2)]";

        const animClass = isFree ? "" : "animate-[pulse_3s_ease-in-out_infinite]";
        
        const roomPrefix = room.split('-')[0].trim() || room;

        const roomEl = document.createElement('div');
        roomEl.className = `relative h-28 rounded-2xl border ${stateClass} ${animClass} flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 group overflow-hidden box-border`;

        roomEl.innerHTML = `
            <span class="font-headline text-2xl italic text-white z-10 pointer-events-none">${roomPrefix}</span>
            <span class="font-label text-[9px] uppercase tracking-widest text-${isFree ? 'success' : 'danger'} font-bold z-10 pointer-events-none mt-1">
                ${isFree ? 'Available' : 'Occupied'}
            </span>
            <div class="absolute inset-0 bg-gradient-to-t from-${isFree ? 'success' : 'danger'}/20 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
        `;

        roomEl.addEventListener('click', () => {
            openDrawer(room, isFree, todayCode);
            elTooltip.classList.remove('visible');
        });

        roomEl.addEventListener('mouseenter', () => {
            elMtTitle.textContent = room;
            if (!isFree) {
                elMtBadge.className = "font-label text-[9px] uppercase tracking-widest px-2 py-0.5 rounded inline-block mb-2 bg-danger/20 text-danger border border-danger/30";
                elMtBadge.textContent = "Occupied Now";
                elMtDesc.innerHTML = `<span class="text-white">${currentOccupant.module}</span><br/>Ends at <span class="text-white">${currentOccupant.end}</span><br/><span class="opacity-70 lowercase">grp. ${currentOccupant.group} | yr. ${currentOccupant.year}</span>`;
            } else if (nextOccupant) {
                elMtBadge.className = "font-label text-[9px] uppercase tracking-widest px-2 py-0.5 rounded inline-block mb-2 bg-success/20 text-success border border-success/30";
                elMtBadge.textContent = "Available";
                elMtDesc.innerHTML = `Next class at <span class="text-white">${nextOccupant.start}</span><br/><span class="opacity-70">${nextOccupant.module}</span>`;
            } else {
                elMtBadge.className = "font-label text-[9px] uppercase tracking-widest px-2 py-0.5 rounded inline-block mb-2 bg-success/20 text-success border border-success/30";
                elMtBadge.textContent = "Available";
                elMtDesc.textContent = "No more classes today. Completely available.";
            }
            elTooltip.classList.add('visible');
        });

        roomEl.addEventListener('mousemove', (e) => {
            let x = e.clientX + 15;
            let y = e.clientY + 15;
            if (x + elTooltip.offsetWidth > window.innerWidth) x = e.clientX - elTooltip.offsetWidth - 15;
            if (y + elTooltip.offsetHeight > window.innerHeight) y = e.clientY - elTooltip.offsetHeight - 15;
            elTooltip.style.left = x + 'px';
            elTooltip.style.top = y + 'px';
        });

        roomEl.addEventListener('mouseleave', () => {
            elTooltip.classList.remove('visible');
        });

        if (block.toUpperCase() === "UK") {
            if (ukFirst) ukFirst.appendChild(roomEl);
        } else {
            const isTopFloor = TOP_FLOOR_TARGETS.some(name => room.toUpperCase().includes(name));
            if (isTopFloor) {
                if (nepalTop) nepalTop.appendChild(roomEl);
            } else {
                if (nepalGround) nepalGround.appendChild(roomEl);
            }
        }
    });
}

// --- RENDER SOCIAL SYNC ENGINE ---
function getFreeBlocks(groupStr, year, dayCode, course) {
    const courseData = filterScheduleByCourse(course || 'computing');
    const classes = courseData.filter(e => e.year === year && e.day === dayCode && e.group.split('+').includes(groupStr))
        .sort((a,b) => parseTime(a.start) - parseTime(b.start));
    
    const freeBlocks = [];
    let cursor = 7 * 60; // 7:00 AM (earliest realistic)
    const END_OF_DAY = 17 * 60; // 5:00 PM
    
    classes.forEach(c => {
        const s = parseTime(c.start);
        const e = parseTime(c.end);
        if (s > cursor) {
            freeBlocks.push({ start: cursor, end: s });
        }
        cursor = Math.max(cursor, e);
    });
    
    if (cursor < END_OF_DAY) {
        freeBlocks.push({ start: cursor, end: END_OF_DAY });
    }
    return freeBlocks;
}

function renderSync() {
    const yA = parseInt(document.getElementById("syncYearA").value);
    const gA = document.getElementById("syncGroupA").value.toUpperCase().trim();
    const yB = parseInt(document.getElementById("syncYearB").value);
    const gB = document.getElementById("syncGroupB").value.toUpperCase().trim();
    const container = document.getElementById("syncResultsArea");

    if (!gA || !gB) {
        container.innerHTML = `
        <div class="py-12 flex flex-col items-center border border-dashed border-white/10 rounded-3xl mt-4">
            <span class="material-symbols-outlined text-4xl text-outline-variant mb-2">sync_problem</span>
            <p class="font-headline italic text-xl text-white">Missing Parameters</p>
            <p class="text-xs text-outline font-label uppercase tracking-widest mt-2">Identify targets to execute</p>
        </div>`;
        return;
    }

    const freeA = getFreeBlocks(gA, yA, selectedSyncDay, syncCourseA);
    const freeB = getFreeBlocks(gB, yB, selectedSyncDay, syncCourseB);
    
    // Find mathematical intersections
    const overlaps = [];
    freeA.forEach(a => {
        freeB.forEach(b => {
            const maxStart = Math.max(a.start, b.start);
            const minEnd = Math.min(a.end, b.end);
            if (maxStart < minEnd) {
                overlaps.push({ start: maxStart, end: minEnd });
            }
        });
    });

    if (overlaps.length === 0) {
        container.innerHTML = `
        <div class="py-12 flex flex-col items-center border border-dashed border-danger/30 rounded-3xl bg-danger/5 mt-4">
            <span class="material-symbols-outlined text-4xl text-danger/60 mb-2">link_off</span>
            <p class="font-headline italic text-xl text-danger">No Mutual Intersections</p>
            <p class="text-[10px] text-danger/70 font-label uppercase tracking-widest mt-2">Trajectories simply do not align today.</p>
        </div>`;
        return;
    }
    
    const now = new Date();
    const todayCode = DAY_MAP[now.getDay()];
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let html = `<div class="text-center font-label text-xs uppercase tracking-[0.2em] text-outline mb-4 border-b border-white/5 pb-2">Located ${overlaps.length} Matching Temporal Windows</div>`;
    
    overlaps.forEach((o, i) => {
        const isToday = (selectedSyncDay === todayCode);
        const isPast = isToday && nowMins >= o.end;
        const isCurrent = isToday && nowMins >= o.start && nowMins < o.end;
        
        const stateUI = isPast ? "opacity-50 grayscale" : "";
        const glowUI = isCurrent ? "border-success shadow-[0_0_20px_rgba(107,168,122,0.15)] bg-success/5" : "border-white/10 hover:border-primary/30";

        html += `
        <div class="glass-panel p-6 rounded-2xl border transition-all ${glowUI} ${stateUI} flex justify-between items-center group cursor-default" style="animation: fadeUp 0.4s ease backwards; animation-delay: ${i * 0.15}s;">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">all_match</span>
                </div>
                <div>
                    <h4 class="font-headline text-2xl text-white italic tracking-wide">${formatTime(o.start)} <span class="text-outline text-lg">—</span> ${formatTime(o.end)}</h4>
                    <p class="text-[10px] font-label uppercase tracking-[0.15em] text-outline mt-1 font-semibold flex items-center gap-2">
                    <span class="material-symbols-outlined text-[12px]">schedule</span> ${formatDuration(o.end - o.start)}
                    </p>
                </div>
            </div>
            ${isCurrent ? '<span class="flex-none bg-success/20 text-success border border-success/30 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest animate-pulse flex items-center gap-2"><span class="w-1.5 h-1.5 bg-success rounded-full block"></span> Happening Now</span>' : ''}
        </div>`;
    });
    
    container.innerHTML = html;
}

// Input Events
document.getElementById("globalSearch").addEventListener("input", () => {
    activeTab = "rooms-view";
    document.querySelector('[data-target="rooms-view"]').click();
    renderRooms();
});
document.getElementById("roomStatusFilter").addEventListener("change", () => { renderRooms(); saveState(); });
document.getElementById("studentYearSelect").addEventListener("change", () => { renderStudent(); saveState(); checkNotifications(); });
document.getElementById("studentGroupInput").addEventListener("input", () => { renderStudent(); saveState(); checkNotifications(); });

['syncYearA', 'syncGroupA', 'syncYearB', 'syncGroupB'].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
        if (activeTab === "sync-view") renderSync();
        saveState();
    });
});

// ================================================
// PHASE 4: NOTIFICATION SYSTEM
// ================================================
let notifLog = [];

function checkNotifications() {
    const year = parseInt(document.getElementById('studentYearSelect').value);
    const group = document.getElementById('studentGroupInput').value.toUpperCase().trim();
    if (!year || !group) return;

    const now = new Date();
    const todayCode = DAY_MAP[now.getDay()];
    if (todayCode === 'SAT') return;
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const courseData = filterScheduleByCourse(studentCourse);
    const todayClasses = courseData.filter(e =>
        e.year === year && e.day === todayCode && e.group.split('+').includes(group)
    ).sort((a, b) => parseTime(a.start) - parseTime(b.start));

    todayClasses.forEach(cls => {
        const startMins = parseTime(cls.start);
        const endMins   = parseTime(cls.end);
        const minsUntil = startMins - nowMins;

        // Alert: class starting within 30 min
        if (minsUntil > 0 && minsUntil <= 30) {
            const id = `soon_${cls.day}_${cls.code}_${cls.start}_${group}`;
            if (!notifLog.find(n => n.id === id)) {
                const n = { id, type: 'soon', text: cls.module, subtext: `Starts in ${minsUntil} min · ${cls.room}`, time: now.toISOString(), dismissed: false };
                notifLog.unshift(n);
                showToast('soon', n.text, n.subtext);
            }
        }
        // Alert: class just started (within last 3 min)
        if (nowMins >= startMins && nowMins < startMins + 3) {
            const id = `started_${cls.day}_${cls.code}_${cls.start}_${group}`;
            if (!notifLog.find(n => n.id === id)) {
                const n = { id, type: 'now', text: `${cls.module} has started!`, subtext: `${cls.room} · Until ${cls.end}`, time: now.toISOString(), dismissed: false };
                notifLog.unshift(n);
                showToast('now', n.text, n.subtext);
            }
        }
    });
    notifLog = notifLog.slice(0, 20);
    updateBellBadge();
    renderNotifPanel();
}

function showToast(type, text, subtext) {
    const container = document.getElementById('toastContainer');
    const borderColor = { soon: 'rgba(212,175,55,0.7)', now: 'rgba(107,168,122,0.7)' };
    const iconColor   = { soon: 'text-primary',         now: 'text-success' };
    const icon        = { soon: 'schedule',              now: 'notifications_active' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText += `border-left: 3px solid ${borderColor[type] || 'rgba(153,144,124,0.5)'};`;
    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-sm mt-0.5 flex-none ${iconColor[type] || 'text-outline'}">${icon[type] || 'info'}</span>
            <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-semibold leading-snug">${text}</p>
                <p class="text-outline text-[11px] font-label uppercase tracking-wide mt-0.5">${subtext}</p>
            </div>
            <button class="flex-none text-outline hover:text-white transition-colors ml-1" onclick="this.closest('.toast').remove()">
                <span class="material-symbols-outlined text-xs">close</span>
            </button>
        </div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 8000);
}

function updateBellBadge() {
    document.getElementById('bellBadge')?.classList.toggle('hidden', !notifLog.some(n => !n.dismissed));
}

function renderNotifPanel() {
    const list = document.getElementById('notifList');
    if (!list) return;
    if (notifLog.length === 0) {
        list.innerHTML = '<p class="text-outline text-xs font-label uppercase tracking-widest text-center py-8">No alerts yet</p>';
        return;
    }
    const iconMap  = { soon: 'schedule', now: 'notifications_active' };
    const colorMap = { soon: 'text-primary/70', now: 'text-success' };
    list.innerHTML = notifLog.map(n => `
        <div class="flex items-start gap-3 p-3 rounded-xl transition-all ${n.dismissed ? 'opacity-40' : 'bg-white/5 border border-white/5'}">
            <span class="material-symbols-outlined text-xs flex-none mt-1 ${colorMap[n.type] || 'text-outline'}">${iconMap[n.type] || 'info'}</span>
            <div class="flex-1 min-w-0">
                <p class="text-white text-xs font-semibold leading-snug">${n.text}</p>
                <p class="text-outline text-[10px] font-label uppercase tracking-wide mt-0.5">${n.subtext}</p>
                <p class="text-outline/40 text-[9px] font-label mt-1">${new Date(n.time).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
        </div>`).join('');
}

// Bell toggle
document.getElementById('bellBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        notifLog.forEach(n => n.dismissed = true);
        updateBellBadge();
        renderNotifPanel();
    }
});
document.getElementById('clearNotifsBtn').addEventListener('click', () => {
    notifLog = []; renderNotifPanel(); updateBellBadge();
});
document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('bellWrapper');
    if (wrapper && !wrapper.contains(e.target)) document.getElementById('notifPanel')?.classList.remove('open');
});

// ================================================
// INITIALIZERS
// ================================================
function updateClock() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const dh = h % 12 || 12;
    document.getElementById("liveTime").textContent = String(dh).padStart(2,"0") + ":" + String(m).padStart(2,"0");
    document.getElementById("liveAmPm").textContent = ampm;
    document.getElementById("liveDate").textContent = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ================================================
// TODAY'S SUMMARY DASHBOARD
// ================================================
function updateTodaySummary() {
    const section = document.getElementById('todaySummarySection');
    if (!section) return;

    const yearStr = document.getElementById('studentYearSelect')?.value;
    const groupStr = (document.getElementById('studentGroupInput')?.value || '').toUpperCase().trim();

    // Hide if no credentials saved
    if (!yearStr || !groupStr) {
        section.classList.add('hidden');
        return;
    }

    const now = new Date();
    const todayCode = DAY_MAP[now.getDay()];

    // Hide on Saturday
    if (todayCode === 'SAT') {
        section.classList.add('hidden');
        return;
    }

    const year = parseInt(yearStr);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const courseData = filterScheduleByCourse(studentCourse);
    const todayClasses = courseData.filter(e =>
        e.year === year && e.day === todayCode && e.group.split('+').includes(groupStr)
    ).sort((a, b) => parseTime(a.start) - parseTime(b.start));

    // Hide if no classes today
    if (todayClasses.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');

    // --- Class count ---
    const totalClasses = todayClasses.length;
    const completedClasses = todayClasses.filter(e => nowMins >= parseTime(e.end)).length;
    const elCount = document.getElementById('summaryClassCount');
    if (elCount) elCount.textContent = `${completedClasses}/${totalClasses} classes`;

    // --- Next class / current class ---
    const elNext = document.getElementById('summaryNextClass');
    const elDetail = document.getElementById('summaryDetailText');
    const currentClass = todayClasses.find(e => nowMins >= parseTime(e.start) && nowMins < parseTime(e.end));
    const nextClass = todayClasses.find(e => parseTime(e.start) > nowMins);
    const allDone = completedClasses === totalClasses;

    if (allDone) {
        if (elNext) elNext.textContent = 'All done';
        if (elDetail) elDetail.textContent = 'No more classes today';
    } else if (currentClass) {
        const endsIn = parseTime(currentClass.end) - nowMins;
        if (elNext) elNext.textContent = `Ends in ${endsIn} min`;
        if (elDetail) elDetail.innerHTML = `In class: <span class="text-white font-semibold">${currentClass.module}</span> <span class="text-primary">@ ${currentClass.room.split('-')[0].trim()}</span>`;
    } else if (nextClass) {
        const startsIn = parseTime(nextClass.start) - nowMins;
        if (startsIn < 60) {
            if (elNext) elNext.textContent = `Next in ${startsIn} min`;
        } else {
            const h = Math.floor(startsIn / 60);
            const m = startsIn % 60;
            if (elNext) elNext.textContent = `Next in ${h}h ${m > 0 ? m + 'm' : ''}`;
        }
        if (elDetail) elDetail.innerHTML = `Next: <span class="text-white font-semibold">${nextClass.module}</span> <span class="text-primary">@ ${nextClass.room.split('-')[0].trim()}</span>`;
    }

    // --- Total free time remaining today ---
    const END_OF_DAY = 17 * 60;
    let freeMinutes = 0;
    let cursor = Math.max(nowMins, 7 * 60);

    // Only count future free time
    const futureClasses = todayClasses.filter(e => parseTime(e.end) > nowMins);
    futureClasses.forEach(e => {
        const s = parseTime(e.start);
        const en = parseTime(e.end);
        const effectiveStart = Math.max(s, cursor);
        if (effectiveStart > cursor) {
            freeMinutes += effectiveStart - cursor;
        }
        cursor = Math.max(cursor, en);
    });
    if (cursor < END_OF_DAY) {
        freeMinutes += END_OF_DAY - cursor;
    }

    const elFree = document.getElementById('summaryFreeTime');
    if (elFree) elFree.textContent = formatDuration(freeMinutes);
}

// Restore saved course selections (must happen before year options update)
if (_saved.studentCourse) setStudentCourse(_saved.studentCourse);
if (_saved.syncCourseA) setSyncCourse('A', _saved.syncCourseA);
if (_saved.syncCourseB) setSyncCourse('B', _saved.syncCourseB);

// Restore saved form values
if (_saved.studentYear)  document.getElementById('studentYearSelect').value = _saved.studentYear;
if (_saved.studentGroup) document.getElementById('studentGroupInput').value  = _saved.studentGroup;
if (_saved.syncYearA)    document.getElementById('syncYearA').value           = _saved.syncYearA;
if (_saved.syncGroupA)   document.getElementById('syncGroupA').value          = _saved.syncGroupA;
if (_saved.syncYearB)    document.getElementById('syncYearB').value           = _saved.syncYearB;
if (_saved.syncGroupB)   document.getElementById('syncGroupB').value          = _saved.syncGroupB;

// Show last visited timestamp
if (_saved.lastVisited) {
    const lastEl = document.getElementById('lastVisitedEl');
    if (lastEl) {
        const d = new Date(_saved.lastVisited);
        lastEl.textContent = 'Last visit: ' + d.toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' · ' + d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
        lastEl.classList.remove('hidden');
        lastEl.classList.add('md:block');
    }
}

buildDayTabs("roomDayTabs",     selectedRoomDay,     (d) => { selectedRoomDay    = d; renderRooms();   saveState(); });
buildDayTabs("studentDayTabs",  selectedStudentDay,  (d) => { selectedStudentDay = d; renderStudent(); saveState(); });
buildDayTabs("syncDayTabs",     selectedSyncDay,     (d) => { selectedSyncDay    = d; renderSync();    saveState(); });

// Restore active tab from localStorage
if (activeTab !== 'rooms-view') {
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active', 'bg-primary/20', 'border-primary/30', 'text-white', 'shadow-[0_0_15px_rgba(212,175,55,0.15)]');
        t.classList.add('text-slate-400', 'border-transparent');
    });
    const savedBtn = document.querySelector(`[data-target="${activeTab}"]`);
    if (savedBtn) {
        savedBtn.classList.remove('text-slate-400', 'border-transparent');
        savedBtn.classList.add('active', 'bg-primary/20', 'border-primary/30', 'text-white', 'shadow-[0_0_15px_rgba(212,175,55,0.15)]');
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById(activeTab)?.classList.add('active');
    }
}

renderRooms();
renderMap();
updateClock();
updateTodaySummary();
checkNotifications();

// Render the restored active view's content
if (activeTab === 'schedule-view') renderStudent();
else if (activeTab === 'sync-view') renderSync();

setInterval(() => { updateClock(); updateTodaySummary(); }, 1000);
setInterval(() => {
    if (activeTab === "rooms-view")    renderRooms();
    else if (activeTab === "schedule-view") renderStudent();
    else if (activeTab === "map-view")  renderMap();
    else if (activeTab === "sync-view") renderSync();
    checkNotifications();
}, 60000);
