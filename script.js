// الترقية التلقائية لحساب wassim1mouh إلى Owner
function checkAdminAccount(username) {
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

// تعديل دالة تسجيل الدخول لتفعيل رول Owner لـ wassim1mouh فوراً
function firstLogin() {
    const username = document.getElementById("robloxUser").value.trim();
    if (!username) {
        alert("يرجى كتابة اسم حسابك في روبلوكس!");
        return;
    }

    checkAdminAccount(username);

    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!existing) {
        const role = (username.toLowerCase() === "wassim1mouh") ? "Owner" : "Player";
        existing = { username: username, role: role, team: "بدون فريق" };
        users.push(existing);
        localStorage.setItem("naflAllUsers", JSON.stringify(users));
    }

    localStorage.setItem("naflCurrentSession", username);
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    loadUserData(username);
}
const FIXED_TEAMS = ["JSK", "MCA", "USMA", "CRB", "USMH", "MCO", "NAHD", "ESS"];

const DEFAULT_GAMES = [
    { vs: "JSK vs MCA", time: "Time: 18:00 GMT", stad: "Stad: 5 Juillet" },
    { vs: "USMA vs CRB", time: "Time: 19:30 GMT", stad: "Stad: Nelson Mandela" },
    { vs: "ESS vs MCO", time: "Time: 21:00 GMT", stad: "Stad: 8 Mai 1945" },
    { vs: "NAHD vs USMH", time: "Time: 22:00 GMT", stad: "Stad: 20 Aout" }
];

window.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("naflCurrentSession");
    if (savedUser) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
        loadUserData(savedUser);
    }
    loadLeagueTable();
    loadGamesCards();
    setupTeamSelect();
});

// تسجيل الدخول مع جلب صورة بروفايل روبلوكس
function firstLogin() {
    const username = document.getElementById("robloxUser").value.trim();
    if (!username) {
        alert("يرجى كتابة اسم حسابك في روبلوكس!");
        return;
    }

    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!existing) {
        const role = users.length === 0 ? "Owner" : "Player";
        existing = { username: username, role: role, team: "بدون فريق" };
        users.push(existing);
        localStorage.setItem("naflAllUsers", JSON.stringify(users));
    }

    localStorage.setItem("naflCurrentSession", username);
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    loadUserData(username);
}

// تبديل الأقسام عبر الأزرار
function switchTab(tabId, btn) {
    document.querySelectorAll(".section-content").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    
    document.getElementById(tabId).classList.add("active");
    btn.classList.add("active");
    if(tabId === 'teaminfo') loadTeamDetails();
}

// تحميل بيانات البروفايل وصورة روبلوكس
function loadUserData(username) {
    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return;

    document.getElementById("profileName").innerText = user.username;
    document.getElementById("profileRole").innerText = user.role;
    document.getElementById("profileTeam").innerText = user.team;

    // جلب صورة بروفايل روبلوكس الحقيقية عبر API عامة
    const avatarImg = document.getElementById("profileAvatar");
    avatarImg.src = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=1&size=150x150&format=Png&isCircular=true`;
    // طريقة احتياطية بوضع صورة افتراضية أو رابط عام إذا لم تتوفر الأيدي
    avatarImg.onerror = function() {
        this.src = `https://tr.rbxcdn.com/33333333333333333333333333333333/150/150/AvatarHeadshot/Png`;
    };

    // إظهار لوحة التحكم للإدارة
    if (["Owner", "Co-owner", "Staff"].includes(user.role)) {
        document.getElementById("adminPanel").style.display = "block";
    } else {
        document.getElementById("adminPanel").style.display = "none";
    }

    loadMyInvites(user.username);
}

// جدول الدوري
function loadLeagueTable() {
    const tbody = document.getElementById("leagueTableBody");
    tbody.innerHTML = "";

    FIXED_TEAMS.forEach((team) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${team}</b></td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td style="color: #00ff87; font-weight: bold;">0</td>
        `;
        tbody.appendChild(tr);
    });
}

// جدول المباريات
function loadGamesCards() {
    let games = JSON.parse(localStorage.getItem("naflGamesData")) || DEFAULT_GAMES;
    const container = document.getElementById("gamesContainer");
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

// تعديل المباريات للإدارة
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

// البحث عن كل المسجلين في المتجر Store
function searchPlayers() {
    const query = document.getElementById("searchPlayerInput").value.toLowerCase().trim();
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = "";

    if (!query) return;

    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let currentUserSession = localStorage.getItem("naflCurrentSession");
    let currentUser = users.find(u => u.username === currentUserSession);

    const matched = users.filter(u => u.username.toLowerCase().includes(query));

    matched.forEach(u => {
        const div = document.createElement("div");
        div.style.cssText = "background:#262626; padding:10px; margin:8px 0; border-radius:6px; display:flex; justify-content:space-between; align-items:center;";
        
        let actionHTML = `<span class="badge">${u.role}</span>`;
        
        // التحقق من صلاحية Owner للفريق المناسب (مثال: Owner CRB يمكنه إرسال عرض لفريقه فقط)
        let canInvite = false;
        let myTeamName = "";
        if (currentUser) {
            if (["Owner", "Co-owner"].includes(currentUser.role)) {
                canInvite = true;
                myTeamName = "الإدارة العامة";
            } else if (currentUser.role.startsWith("Owner ")) {
                myTeamName = currentUser.role.replace("Owner ", "");
                canInvite = true;
            }
        }

        if (canInvite && u.username !== currentUser.username) {
            actionHTML += `<button onclick="sendOffer('${u.username}', '${myTeamName}')" style="padding:5px 10px; background:#00ff87; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">إرسال عرض (${myTeamName}) 📩</button>`;
        }

        div.innerHTML = `<div><b>${u.username}</b> <small style="color:#aaa;">(${u.team})</small></div> <div>${actionHTML}</div>`;
        resultsDiv.appendChild(div);
    });
}

// إرسال العرض
function sendOffer(targetUser, teamName) {
    let offers = JSON.parse(localStorage.getItem("naflOffers") || "[]");
    offers.push({ to: targetUser, fromTeam: teamName, status: "pending" });
    localStorage.setItem("naflOffers", JSON.stringify(offers));
    alert(`تم إرسال العرض بنجاح إلى ${targetUser} للانضمام إلى فريق ${teamName}`);
}

// العروض الواردة وقبولها
function loadMyInvites(username) {
    let offers = JSON.parse(localStorage.getItem("naflOffers") || "[]");
    let myOffers = offers.filter(o => o.to === username && o.status === "pending");
    const container = document.getElementById("myInvites");

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
            <button onclick="respondOffer(${index}, 'accepted', '${offer.fromTeam}')" style="background:#00ff87; border:none; padding:4px 10px; font-weight:bold; cursor:pointer;">قبول ✅</button>
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

// إعداد خيارات قائمة Team Info
function setupTeamSelect() {
    const select = document.getElementById("selectTeamView");
    select.innerHTML = "";
    FIXED_TEAMS.forEach(team => {
        const opt = document.createElement("option");
        opt.value = team;
        opt.innerText = team;
        select.appendChild(opt);
    });
}

// عرض معلومات كل فريق (اللاعبين والأهداف)
function loadTeamDetails() {
    const teamName = document.getElementById("selectTeamView").value;
    let users = JSON.parse(localStorage.getItem("naflAllUsers") || "[]");
    let teamPlayers = users.filter(u => u.team === teamName);

    let stats = JSON.parse(localStorage.getItem("naflTeamStats") || "{}");
    let tStats = stats[teamName] || { scored: 0, conceded: 0 };

    const box = document.getElementById("teamDetailsBox");
    let playersHTML = teamPlayers.length > 0 ? teamPlayers.map(p => `<li>${p.username} (${p.role})</li>`).join('') : '<p style="color:#888;">لا توجد لاعبين منضمين بعد.</p>';

    box.innerHTML = `
        <h3 style="color:#00ff87;">فريق: ${teamName}</h3>
        <p><b>⚽ الأهداف المسجلة:</b> ${tStats.scored}</p>
        <p><b>🛡️ الأهداف المستقبلة:</b> ${tStats.conceded}</p>
        <h4 style="margin-top:10px;">قائمة اللاعبين في الفريق:</h4>
        <ul style="text-align:right; padding-right:20px;">${playersHTML}</ul>
    `;
}

// تحديث الرولات للاعبين
function updateUserRole() {
    const target = document.getElementById("targetUser").value.trim();
    const newRole = document.getElementById("newRoleSelect").value;

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