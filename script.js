// ==========================================
// 1. الثوابت وإعدادات السحاب (Firebase)
// ==========================================
const FIXED_TEAMS = ["JSK", "MCA", "USMA", "CRB", "USMH", "MCO", "NAHD", "ESS"];

const DEFAULT_GAMES = [
    { vs: "JSK vs MCA", time: "Time: 18:00 GMT", stad: "Stad: 5 Juillet" },
    { vs: "USMA vs CRB", time: "Time: 19:30 GMT", stad: "Stad: Nelson Mandela" },
    { vs: "ESS vs MCO", time: "Time: 8 Mai 1945", stad: "Stad: Setif" },
    { vs: "NAHD vs USMH", time: "Time: 22:00 GMT", stad: "Stad: 20 Aout" }
];

const firebaseConfig = {
    databaseURL: "https://nafl-hub-ef57c-default-rtdb.firebaseio.com/"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

// ==========================================
// 2. التحقق وتسجيل الدخول المباشر
// ==========================================
function checkSuperAdmin(username) {
    if (username.toLowerCase() === "wassim1mouh") {
        if (db) {
            db.ref('users/wassim1mouh').update({
                username: "wassim1mouh",
                role: "Owner",
                team: "الإدارة العليا"
            });
        }
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

    let role = (username.toLowerCase() === "wassim1mouh") ? "Owner" : "Player";
    let team = "بدون فريق";

    localStorage.setItem("naflCurrentSession", username);

    const loginScreen = document.getElementById("loginScreen");
    const mainApp = document.getElementById("mainApp");
    
    if (loginScreen) loginScreen.style.display = "none";
    if (mainApp) mainApp.style.display = "block";

    if (db) {
        db.ref('users/' + username).once('value', (snapshot) => {
            if (!snapshot.exists()) {
                db.ref('users/' + username).set({
                    username: username,
                    role: role,
                    team: team,
                    joinedAt: Date.now()
                });
            }
        });
    }

    loadUserData(username);
}

function switchTab(tabId, btn) {
    document.querySelectorAll(".section-content").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add("active");
    if (btn) btn.classList.add("active");

    if (tabId === 'teaminfo') setupTeamSelect();
    if (tabId === 'table') loadLeagueTable();
    if (tabId === 'games') loadGamesCards();
}

function loadUserData(username) {
    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");
    const profileTeam = document.getElementById("profileTeam");

    if (profileName) profileName.innerText = username;

    const avatarImg = document.getElementById("profileAvatar");
    if (avatarImg) {
        avatarImg.src = `https://www.roblox.com/headshot-thumbnail/image?username=${encodeURIComponent(username)}&width=150&height=150&format=png`;
    }

    if (db) {
        db.ref('users/' + username).once('value', (snapshot) => {
            let user = snapshot.val() || { username: username, role: "Player", team: "بدون فريق" };

            if (profileRole) profileRole.innerText = user.role || "Player";
            if (profileTeam) profileTeam.innerText = user.team || "بدون فريق";

            const adminPanel = document.getElementById("adminPanel");
            if (adminPanel) {
                let r = user.role || "";
                if (["Owner", "Co-owner", "Staff"].includes(r) || r.startsWith("Owner ") || username.toLowerCase() === "wassim1mouh") {
                    adminPanel.style.display = "block";
                } else {
                    adminPanel.style.display = "none";
                }
            }
        });
    }

    loadMyInvites(username);
}

// ==========================================
// 3. جدول الدوري والمباريات
// ==========================================
function loadLeagueTable() {
    const tbody = document.getElementById("leagueTableBody");
    if (!tbody) return;

    if (db) {
        db.ref('leagueTable').once('value', (snapshot) => {
            let stats = snapshot.val() || {};
            renderTable(stats);
        });
    }
}

function renderTable(stats) {
    const tbody = document.getElementById("leagueTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

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

    let teamData = { played, won, drawn, lost, points };

    if (db) {
        db.ref('leagueTable/' + team).set(teamData).then(() => {
            alert(`تم حفظ ترتيب فريق ${team} في السحاب! 📊`);
            loadLeagueTable();
        });
    }
}

function loadGamesCards() {
    const container = document.getElementById("gamesContainer");
    if (!container) return;

    if (db) {
        db.ref('gamesData').once('value', (snapshot) => {
            let games = snapshot.val() || DEFAULT_GAMES;
            renderGames(games);
        });
    }
}

function renderGames(games) {
    const container = document.getElementById("gamesContainer");
    if (!container) return;
    container.innerHTML = "";

    let gamesArray = Array.isArray(games) ? games : Object.values(games);

    gamesArray.forEach((g, idx) => {
        if (!g) return;
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

// ==========================================
// 4. معلومات الفرق واللاعبين (Team Info)
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

    loadTeamDetails();
}

function loadTeamDetails() {
    const select = document.getElementById("selectTeamView");
    const teamName = select ? select.value : "JSK";
    const box = document.getElementById("teamDetailsBox");

    if (!box) return;

    box.innerHTML = `<p style="color:#888; text-align:center;">جاري تحميل بيانات ${teamName}...</p>`;

    if (db) {
        db.ref('users').once('value', (snapshot) => {
            const usersData = snapshot.val() || {};
            
            const teamPlayers = Object.values(usersData).filter(u => {
                return u.team && u.team.toString().trim().toUpperCase() === teamName.trim().toUpperCase();
            });

            db.ref('leagueTable/' + teamName).once('value', (tableSnap) => {
                let tStats = tableSnap.val() || { played: 0, points: 0 };

                let playersListHTML = "";
                if (teamPlayers.length > 0) {
                    playersListHTML = teamPlayers.map(p => 
                        `<li style="margin: 8px 0; padding: 10px; background: #1e1e1e; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <span>👤 <b>${p.username}</b></span>
                            <span class="badge" style="background:#333; color:#00ff87; padding:3px 8px; border-radius:4px; font-size:12px;">${p.role || 'Player'}</span>
                        </li>`
                    ).join('');
                } else {
                    playersListHTML = `<div style="text-align:center; padding: 15px; color:#aaa; background:#1e1e1e; border-radius:6px; margin-top:10px;">
                        ⚠️ لا يوجد لاعبون منضمون لنادي <b>${teamName}</b> حالياً.
                    </div>`;
                }

                box.innerHTML = `
                    <h3 style="color:#00ff87; margin-top:0; text-align:center;">🛡️ نادي: ${teamName}</h3>
                    <div style="display: flex; justify-content: space-around; background: #1e1e1e; padding: 10px; border-radius: 6px; margin: 12px 0; font-size: 13px;">
                        <span><b>⚽ لعب:</b> ${tStats.played || 0}</span>
                        <span><b>📊 النقاط:</b> ${tStats.points || 0}</span>
                        <span><b>👥 اللاعبين:</b> ${teamPlayers.length}</span>
                    </div>
                    <hr style="border-color: #333; margin: 15px 0;">
                    <h4 style="margin-bottom: 10px; text-align:right;">قائمة تشكيلة الفريق:</h4>
                    <ul style="padding: 0; list-style: none; margin: 0;">${playersListHTML}</ul>
                `;
            });
        });
    }
}

// ==========================================
// 5. البحث والعروض وطرد اللاعبين والتحديثات
// ==========================================
function searchPlayers() {
    const searchInput = document.getElementById("searchPlayerInput");
    const resultsDiv = document.getElementById("searchResults");
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = "";
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (!query || !db) return;

    db.ref('users').once('value', (snapshot) => {
        const usersData = snapshot.val() || {};
        let currentUserSession = localStorage.getItem("naflCurrentSession");
        let usersArray = Object.values(usersData);
        let currentUser = usersArray.find(u => u.username === currentUserSession);

        const matched = usersArray.filter(u => u.username && u.username.toLowerCase().includes(query));

        if (matched.length === 0) {
            resultsDiv.innerHTML = "<p style='color: #888; text-align: center;'>لم يتم العثور على أي لاعب.</p>";
            return;
        }

        matched.forEach(u => {
            const div = document.createElement("div");
            div.style.cssText = "background:#262626; padding:12px; margin:8px 0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; text-align:right;";
            
            let actionHTML = `<span class="badge">${u.role || 'Player'}</span>`;
            let canInvite = false;
            let myTeamName = "";

            if (currentUser) {
                if (["Owner", "Co-owner"].includes(currentUser.role)) {
                    canInvite = true;
                    myTeamName = "الإدارة";
                } else if (currentUser.role && currentUser.role.startsWith("Owner ")) {
                    myTeamName = currentUser.role.replace("Owner ", "").trim();
                    canInvite = true;
                }
            }

            if (canInvite && currentUser && u.username.toLowerCase() !== currentUser.username.toLowerCase()) {
                actionHTML += `<button onclick="sendOffer('${u.username}', '${myTeamName}')" style="padding:6px 12px; background:#00ff87; border:none; border-radius:4px; font-weight:bold; cursor:pointer; color:#000; margin-right:8px;">عرض (${myTeamName}) 📩</button>`;
            }

            div.innerHTML = `
                <div>
                    <b>👤 ${u.username}</b> 
                    <small style="color:#aaa; display:block; margin-top:3px;">الفريق: ${u.team || 'بدون فريق'}</small>
                </div> 
                <div>${actionHTML}</div>
            `;
            resultsDiv.appendChild(div);
        });
    });
}

function sendOffer(targetUser, teamName) {
    let currentSession = localStorage.getItem("naflCurrentSession");
    if (!currentSession || !db) return;

    const offerRef = db.ref('offers').push();
    offerRef.set({
        id: offerRef.key,
        to: targetUser,
        from: currentSession,
        fromTeam: teamName,
        status: "pending",
        timestamp: Date.now()
    }).then(() => {
        alert(`تم إرسال العرض بنجاح إلى ${targetUser} 📩`);
    });
}

function loadMyInvites(username) {
    const container = document.getElementById("myInvites");
    if (!container || !db) return;

    db.ref('offers').once('value', (snapshot) => {
        const offersData = snapshot.val();
        if (!offersData) {
            container.innerHTML = "<p style='color: #888;'>لا توجد عروض حالياً.</p>";
            return;
        }

        let myOffers = Object.values(offersData).filter(o => o.to === username && o.status === "pending");

        if (myOffers.length === 0) {
            container.innerHTML = "<p style='color: #888;'>لا توجد عروض حالياً.</p>";
            return;
        }

        container.innerHTML = "";
        myOffers.forEach((offer) => {
            const box = document.createElement("div");
            box.style.cssText = "background:#2b2b2b; padding:8px; margin:5px 0; border-radius:4px;";
            box.innerHTML = `
                عرض للانضمام إلى: <b>${offer.fromTeam}</b><br>
                <div style="margin-top:5px;">
                    <button onclick="respondOffer('${offer.id}', 'accepted', '${offer.fromTeam}')" style="background:#00ff87; border:none; padding:4px 10px; font-weight:bold; cursor:pointer; color:#000; border-radius:4px;">قبول ✅</button>
                    <button onclick="respondOffer('${offer.id}', 'rejected', '')" style="background:#ff4444; color:#fff; border:none; padding:4px 10px; cursor:pointer; border-radius:4px;">رفض ❌</button>
                </div>
            `;
            container.appendChild(box);
        });
    });
}

function respondOffer(offerId, status, teamName) {
    if (!db) return;

    db.ref('offers/' + offerId + '/status').set(status).then(() => {
        if (status === 'accepted') {
            let currentUserSession = localStorage.getItem("naflCurrentSession");
            db.ref('users/' + currentUserSession + '/team').set(teamName);
            alert("مبروك! انضممت إلى فريق " + teamName);
            loadUserData(currentUserSession);
        } else {
            alert("تم رفض العرض.");
            let currentUserSession = localStorage.getItem("naflCurrentSession");
            loadUserData(currentUserSession);
        }
    });
}

function updateUserRole() {
    const target = document.getElementById("targetUser").value.trim();
    const newRole = document.getElementById("newRoleSelect").value;

    if (!target) {
        alert("يرجى كتابة اسم المستخدم!");
        return;
    }

    if (db) {
        db.ref('users/' + target + '/role').set(newRole).then(() => {
            alert(`تم بنجاح تغيير رول اللاعب ${target} إلى ${newRole} 👤`);
            document.getElementById("targetUser").value = "";
        });
    }
}

function kickPlayerFromTeam() {
    const targetInput = document.getElementById("kickTargetUser");
    const targetUser = targetInput ? targetInput.value.trim() : "";

    if (!targetUser || !db) return;

    let currentSession = localStorage.getItem("naflCurrentSession");
    if (!currentSession) return;

    db.ref('users/' + currentSession).once('value', (snapshot) => {
        let currentUser = snapshot.val();
        if (!currentUser) return;

        let currentRole = currentUser.role || "";
        let ownerTeamName = "";

        if (currentRole.startsWith("Owner ")) {
            ownerTeamName = currentRole.replace("Owner ", "").trim().toUpperCase();
        } else if (currentRole === "Owner") {
            ownerTeamName = "ALL";
        }

        if (!ownerTeamName) {
            alert("هذه الصلاحية مخصصة لرؤساء الفرق فقط!");
            return;
        }

        db.ref('users/' + targetUser).once('value', (targetSnapshot) => {
            let targetData = targetSnapshot.val();
            if (!targetData) {
                alert("لم يتم العثور على اللاعب!");
                return;
            }

            let playerTeam = (targetData.team || "").trim().toUpperCase();

            if (ownerTeamName !== "ALL" && playerTeam !== ownerTeamName) {
                alert(`لا يمكنك طرد هذا اللاعب لأنه من فريق آخر!`);
                return;
            }

            db.ref('users/' + targetUser + '/team').set("بدون فريق").then(() => {
                alert(`تم طرد اللاعب ${targetUser} بنجاح من الفريق ❌`);
                if (targetInput) targetInput.value = "";
                loadTeamDetails();
            });
        });
    });
}
