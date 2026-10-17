// ==========================================
// 1. الثوابت والإعدادات الأساسية
// ==========================================
const FIXED_TEAMS = ["JSK", "MCA", "USMA", "CRB", "USMH", "MCO", "NAHD", "ESS"];

const DEFAULT_GAMES = [
    { vs: "JSK vs MCA", time: "Time: 18:00 GMT", stad: "Stad: 5 Juillet" },
    { vs: "USMA vs CRB", time: "Time: 19:30 GMT", stad: "Stad: Nelson Mandela" },
    { vs: "ESS vs MCO", time: "Time: 21:00 GMT", stad: "Stad: 8 Mai 1945" },
    { vs: "NAHD vs USMH", time: "Time: 22:00 GMT", stad: "Stad: 20 Aout" }
];

// ==========================================
// 2. التحقق وتسجيل الدخول (سريع ومضمون)
// ==========================================
function checkSuperAdmin(username) {
    if (username.toLowerCase() === "wassim1mouh") {
        let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
        let user = users.find(u => u.username.toLowerCase() === "wassim1mouh");
        
        if (user) {
            user.role = "Owner";
        } else {
            users.push({ username: "wassim1mouh", role: "Owner", team: "الإدارة العليا" });
        }
        localStorage.setItem("naflAllUsers", JSON.stringify(users));
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("naflCurrentSession");
    if (savedUser) {
        checkSuperAdmin(savedUser);
        const loginScreen = document.getElementById("loginScreen");
        const mainApp = document.getElementById("mainApp");
        if (loginScreen) loginScreen.style.display = "none";
        if (mainApp) mainApp.style.display = "block";
        loadUserData(savedUser);
    }
    loadLeagueTable();
    loadGamesCards();
    setupTeamSelect();
});

function firstLogin() {
    const usernameInput = document.getElementById("robloxUser");
    const username = usernameInput ? usernameInput.value.trim() : "";
    
    if (!username) {
        alert("يرجى كتابة اسم حسابك في روبلوكس!");
        return;
    }

    checkSuperAdmin(username);

    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    let role = (username.toLowerCase() === "wassim1mouh") ? "Owner" : "Player";
    let team = existing ? existing.team : "بدون فريق";

    if (!existing) {
        existing = { username: username, role: role, team: team };
        users.push(existing);
    } else {
        existing.role = role; // تحديث الدور إن وجد
    }
    
    localStorage.setItem("naflAllUsers", JSON.stringify(users));
    localStorage.setItem("naflCurrentSession", username);

    const loginScreen = document.getElementById("loginScreen");
    const mainApp = document.getElementById("mainApp");
    
    if (loginScreen) loginScreen.style.display = "none";
    if (mainApp) mainApp.style.display = "block";
    
    loadUserData(username);
}

function switchTab(tabId, btn) {
    document.querySelectorAll(".section-content").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add("active");
    if (btn) btn.classList.add("active");

    if (tabId === 'teaminfo') loadTeamDetails();
    if (tabId === 'table') loadLeagueTable();
}

function loadUserData(username) {
    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase()) || { username: username, role: "Player", team: "بدون فريق" };

    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");
    const profileTeam = document.getElementById("profileTeam");

    if (profileName) profileName.innerText = user.username;
    if (profileRole) profileRole.innerText = user.role;
    if (profileTeam) profileTeam.innerText = user.team;

    const avatarImg = document.getElementById("profileAvatar");
    if (avatarImg) {
        avatarImg.src = `https://thumbnails.roblox.com/v1/users/avatar-headshot?usernames=${username}&size=150x150&format=Png&isCircular=true`;
        avatarImg.onerror = function() {
            this.src = `https://tr.rbxcdn.com/33333333333333333333333333333333/150/150/AvatarHeadshot/Png`;
        };
    }

    const adminPanel = document.getElementById("adminPanel");
    if (adminPanel) {
        if (["Owner", "Co-owner", "Staff"].includes(user.role) || user.username.toLowerCase() === "wassim1mouh") {
            adminPanel.style.display = "block";
        } else {
            adminPanel.style.display = "none";
        }
    }

    loadMyInvites(user.username);
}

// ==========================================
// 3. جدول الدوري والمباريات
// ==========================================
function loadLeagueTable() {
    const tbody = document.getElementById("leagueTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let stats = JSON.parse(localStorage.getItem("naflTeamStats") || "{}");

    let tableData = FIXED_TEAMS.map(team => {
        let t = stats[team] || { played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
        return { team: team, ...t };
    });

    tableData.sort((a, b) => b.points - a.points);

    tableData.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${row.team}</b></td>
            <td>${row.played || 0}</td>
            <td>${row.won || 0}</td>
            <td>${row.drawn || 0}</td>
            <td>${row.lost || 0}</td>
            <td style="color: #00ff87; font-weight: bold;">${row.points || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function saveTeamTableAndStats() {
    const team = document.getElementById("editTeamSelect").value;
    const played = parseInt(document.getElementById("editPlayed").value) || 0;
    const won = parseInt(document.getElementById("editWon").value) || 0;
    const drawn = parseInt(document.getElementById("editDrawn").value) || 0;
    const lost = parseInt(document.getElementById("editLost").value) || 0;
    const points = parseInt(document.getElementById("editPoints").value) || 0;
    const scored = parseInt(document.getElementById("editGoalsScored").value) || 0;
    const conceded = parseInt(document.getElementById("editGoalsConceded").value) || 0;

    let stats = JSON.parse(localStorage.getItem("naflTeamStats") || "{}");
    stats[team] = { played, won, drawn, lost, points, scored, conceded };

    localStorage.setItem("naflTeamStats", JSON.stringify(stats));
    alert(`تم بنجاح تحديث بيانات وترتيب فريق ${team}! 📊`);
    loadLeagueTable();
}

function loadGamesCards() {
    let games = JSON.parse(localStorage.getItem("naflGamesData")) || DEFAULT_GAMES;
    const container = document.getElementById("gamesContainer");
    if (!container) return;
    container.innerHTML = "";

    games.forEach((g, idx) => {
        const card = document.createElement("div");
        card.className = "game-card";
        card.innerHTML = `
            <div style="font-size:12px; color:#888; margin-bottom:5px;">مباراة #${idx + 1}</div>
            <div class="match-teams">${g.vs}</div>
            <div class="match-info">🕒 ${g.time}</div>
            <div class="match-info">🏟️ ${g.stad}</div>
        `;
        container.appendChild(card);
    });
}

function updateGameData() {
    const cardIndex = document.getElementById("gameCardSelect").value;
    const vsVal = document.getElementById("editVs").value.trim();
    const timeVal = document.getElementById("editTime").value.trim();
    const stadVal = document.getElementById("editStad").value.trim();

    if (!vsVal || !timeVal || !stadVal) {
        alert("يرجى ملء جميع الحقول!");
        return;
    }

    let games = JSON.parse(localStorage.getItem("naflGamesData")) || DEFAULT_GAMES;
    games[cardIndex] = { vs: vsVal, time: timeVal, stad: stadVal };
    
    localStorage.setItem("naflGamesData", JSON.stringify(games));
    alert("تم تحديث المباراة بنجاح! ⚽");
    loadGamesCards();
}

// ==========================================
// 4. البحث عن اللاعبين المسجلين محلياً والعروض
// ==========================================
function searchPlayers() {
    const searchInput = document.getElementById("searchPlayerInput");
    const resultsDiv = document.getElementById("searchResults");
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = "";
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (!query) return;

    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let currentUserSession = localStorage.getItem("naflCurrentSession");
    let currentUser = users.find(u => u.username === currentUserSession);

    const matched = users.filter(u => u.username.toLowerCase().includes(query));

    matched.forEach(u => {
        const div = document.createElement("div");
        div.style.cssText = "background:#262626; padding:10px; margin:8px 0; border-radius:6px; display:flex; justify-content:space-between; align-items:center;";
        
        let actionHTML = `<span class="badge">${u.role || 'Player'}</span>`;
        let canInvite = false;
        let myTeamName = "";

        if (currentUser) {
            if (["Owner", "Co-owner"].includes(currentUser.role)) {
                canInvite = true;
                myTeamName = "الإدارة العامة";
            } else if (currentUser.role && currentUser.role.startsWith("Owner ")) {
                myTeamName = currentUser.role.replace("Owner ", "");
                canInvite = true;
            }
        }

        if (canInvite && currentUser && u.username !== currentUser.username) {
            actionHTML += `<button onclick="sendOffer('${u.username}', '${myTeamName}')" style="padding:5px 10px; background:#00ff87; border:none; border-radius:4px; font-weight:bold; cursor:pointer; color:#000;">إرسال عرض (${myTeamName}) 📩</button>`;
        }

        div.innerHTML = `<div><b>👤 ${u.username}</b> <small style="color:#aaa;">(${u.team || 'بدون فريق'})</small></div> <div>${actionHTML}</div>`;
        resultsDiv.appendChild(div);
    });
}

function sendOffer(targetUser, teamName) {
    let offers = JSON.parse(localStorage.getItem("naflOffers") || "[]");
    offers.push({ to: targetUser, fromTeam: teamName, status: "pending" });
    localStorage.setItem("naflOffers", JSON.stringify(offers));
    alert(`تم إرسال العرض بنجاح إلى ${targetUser} للانضمام إلى فريق ${teamName}`);
}

function loadMyInvites(username) {
    let offers = JSON.parse(localStorage.getItem("naflOffers") || "[]");
    let myOffers = offers.filter(o => o.to === username && o.status === "pending");
    const container = document.getElementById("myInvites");
    if (!container) return;

    if (myOffers.length === 0) {
        container.innerHTML = "<p style='color: #888;'>لا توجد عروض حالياً.</p>";
        return;
    }

    container.innerHTML = "";
    myOffers.forEach((offer, index) => {
        const box = document.createElement("div");
        box.style.cssText = "background:#2b2b2b; padding:8px; margin:5px 0; border-radius:4px;";
        box.innerHTML = `
            عرض للانضمام إلى فريق: <b>${offer.fromTeam}</b><br>
            <button onclick="respondOffer(${index}, 'accepted', '${offer.fromTeam}')" style="background:#00ff87; border:none; padding:4px 10px; font-weight:bold; cursor:pointer; color:#000;">قبول ✅</button>
            <button onclick="respondOffer(${index}, 'rejected', '')" style="background:#ff4444; color:#fff; border:none; padding:4px 10px; cursor:pointer;">رفض ❌</button>
        `;
        container.appendChild(box);
    });
}

function respondOffer(index, status, teamName) {
    let offers = JSON.parse(localStorage.getItem("naflOffers") || "[]");
    offers[index].status = status;
    localStorage.setItem("naflOffers", JSON.stringify(offers));

    if (status === 'accepted') {
        let currentUserSession = localStorage.getItem("naflCurrentSession");
        let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
        let user = users.find(u => u.username === currentUserSession);
        if (user) {
            user.team = teamName;
            localStorage.setItem("naflAllUsers", JSON.stringify(users));
            alert("مبروك! انضممت إلى فريق " + teamName);
            loadUserData(user.username);
        }
    } else {
        alert("تم رفض العرض.");
    }
}

// ==========================================
// 5. معلومات الفرق وإدارة الرولات
// ==========================================
function setupTeamSelect() {
    const select = document.getElementById("selectTeamView");
    if (!select) return;
    select.innerHTML = "";
    FIXED_TEAMS.forEach(team => {
        const opt = document.createElement("option");
        opt.value = team;
        opt.innerText = team;
        select.appendChild(opt);
    });
}

function loadTeamDetails() {
    const teamName = document.getElementById("selectTeamView").value;
    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let teamPlayers = users.filter(u => u.team === teamName);

    let stats = JSON.parse(localStorage.getItem("naflTeamStats") || "{}");
    let tStats = stats[teamName] || { scored: 0, conceded: 0 };

    const box = document.getElementById("teamDetailsBox");
    if (!box) return;

    let playersHTML = teamPlayers.length > 0 ? teamPlayers.map(p => `<li>${p.username} (${p.role || 'Player'})</li>`).join('') : '<p style="color:#888;">لا يوجد لاعبون منضمون بعد.</p>';

    box.innerHTML = `
        <h3 style="color:#00ff87;">فريق: ${teamName}</h3>
        <p><b>⚽ الأهداف المسجلة:</b> ${tStats.scored || 0}</p>
        <p><b>🛡️ الأهداف المستقبلة:</b> ${tStats.conceded || 0}</p>
        <h4 style="margin-top:10px;">قائمة اللاعبين في الفريق:</h4>
        <ul style="text-align:right; padding-right:20px;">${playersHTML}</ul>
    `;
}

function updateUserRole() {
    const target = document.getElementById("targetUser").value.trim();
    const newRole = document.getElementById("newRoleSelect").value;

    if (!target) {
        alert("يرجى كتابة اسم المستخدم!");
        return;
    }

    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let targetUserObj = users.find(u => u.username.toLowerCase() === target.toLowerCase());

    if (!targetUserObj) {
        alert("لم يتم العثور على هذا المستخدم مسجلاً!");
        return;
    }

    targetUserObj.role = newRole;
    localStorage.setItem("naflAllUsers", JSON.stringify(users));
    alert(`تم بنجاح تغيير رول اللاعب ${targetUserObj.username} إلى ${newRole}`);
}
