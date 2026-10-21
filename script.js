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

// ==========================================
// تحديد صلاحيات لوحة التحكم (للـ Staff والـ Owner العام فقط)
// ==========================================
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
        db.ref('users/' + username).on('value', (snapshot) => {
            let user = snapshot.val() || { username: username, role: "Player", team: "بدون فريق" };

            if (profileRole) profileRole.innerText = user.role || "Player";
            if (profileTeam) profileTeam.innerText = user.team || "بدون فريق";

            const adminPanel = document.getElementById("adminPanel");
            const generalAdminBox = document.getElementById("generalAdminBox");
            const ownerKickBox = document.getElementById("ownerKickBox");

            if (adminPanel) {
                let r = (user.role || "").trim().toLowerCase();
                let currentName = username.toLowerCase();

                // هل المستخدم هو Staff أو Owner عام أو الأونر الأساسي؟
                let isStaffOrGeneralOwner = 
                    r === "staff" || 
                    r === "owner" || 
                    currentName === "wassim1mouh";

                // هل المستخدم رئيس فريق فقط (مثل Owner JSK)؟
                let isTeamOwnerOnly = r.startsWith("owner ") && r !== "owner";

                if (isStaffOrGeneralOwner || isTeamOwnerOnly) {
                    adminPanel.style.display = "block"; // إظهار اللوحة الأساسية

                    // إذا كان Staff أو Owner (العام): تظهر له جميع خانات الإدارة والجدول والرولات والطرد
                    if (isStaffOrGeneralOwner) {
                        if (generalAdminBox) generalAdminBox.style.display = "block";
                        if (ownerKickBox) ownerKickBox.style.display = "block";
                    } 
                    // إذا كان رئيس فريق فقط: تختفي عنه خانات الجدول والرولات، ويظهر له طرد لاعبي فريقه فقط
                    else if (isTeamOwnerOnly) {
                        if (generalAdminBox) generalAdminBox.style.display = "none";
                        if (ownerKickBox) ownerKickBox.style.display = "block";
                    }
                } else {
                    // اللاعب العادي لا يرى أي لوحة تحكم
                    adminPanel.style.display = "none";
                }
            }
        });
    }

    loadMyInvites(username);
}


// قائمة الأندية الثابتة لضمان عدم اختفائها
const DEFAULT_TEAMS = ["JSK", "MCA", "USMA", "CRB", "USMH", "MCO", "NAHD", "ESS"];

function loadLeagueTable() {
    const tableBody = document.getElementById("leagueTableBody");
    if (!tableBody || typeof db === "undefined" || !db) return;

    db.ref('standings').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        let html = "";

        // تجهيز بيانات كل الفرق وقراءتها
        let teamsList = DEFAULT_TEAMS.map(teamName => {
            const teamData = data[teamName] || {};
            return {
                team: teamName,
                played: teamData.played || 0,
                won: teamData.won || 0,
                drawn: teamData.drawn || 0,
                lost: teamData.lost || 0,
                points: teamData.points || 0
            };
        });

        // ترتيب الأندية حسب النقاط (الأعلى نقطاً في الأعلى)
        teamsList.sort((a, b) => b.points - a.points);

        // إنشاء صفوف الجدول
        teamsList.forEach(t => {
            html += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding:10px; font-weight:bold;">${t.team}</td>
                    <td style="padding:10px;">${t.played}</td>
                    <td style="padding:10px;">${t.won}</td>
                    <td style="padding:10px;">${t.drawn}</td>
                    <td style="padding:10px;">${t.lost}</td>
                    <td style="padding:10px; color:#00ff87; font-weight:bold;">${t.points}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    });
}

// تشغيل القراءة فور تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    if (typeof loadLeagueTable === "function") loadLeagueTable();
    if (typeof loadGamesCards === "function") loadGamesCards();
});


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
// 5. البحث والشامل عن اللاعبين (النسخة المُحدثة)
// ==========================================
function searchPlayers() {
    const searchInput = document.getElementById("searchPlayerInput");
    const resultsDiv = document.getElementById("searchResults");
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = "";
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (!db) return;

    db.ref('users').once('value', (snapshot) => {
        const usersData = snapshot.val() || {};
        let currentUserSession = (localStorage.getItem("naflCurrentSession") || "").toLowerCase();
        
        // تحويل قاعدة البيانات لضمان قراءة كافة الحسابات والمفاتيح مهما كانت طريقة تخزينها
        let usersArray = Object.keys(usersData).map(key => {
            let val = usersData[key];
            if (typeof val === 'object' && val !== null) {
                return {
                    dbKey: key,
                    username: val.username || val.name || key,
                    role: val.role || 'Player',
                    team: val.team || 'بدون فريق'
                };
            }
            return { dbKey: key, username: key, role: 'Player', team: 'بدون فريق' };
        });

        let currentUser = usersArray.find(u => u.username.toLowerCase() === currentUserSession);

        // التصفية: إذا كانت خانة البحث فارغة، يتم عرض جميع اللاعبين المسجلين تلقائياً
        const matched = usersArray.filter(u => {
            if (!u.username) return false;
            if (query === "") return true; // عرض الكل
            return u.username.toLowerCase().includes(query);
        });

        if (matched.length === 0) {
            resultsDiv.innerHTML = "<p style='color: #888; text-align: center;'>لم يتم العثور على أي لاعب.</p>";
            return;
        }

        matched.forEach(u => {
            const div = document.createElement("div");
            div.style.cssText = "background:#262626; padding:12px; margin:8px 0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; text-align:right;";
            
            let actionHTML = `<span class="badge">${u.role}</span>`;
            let canInvite = false;
            let myTeamName = "";

            if (currentUser) {
                let cRole = (currentUser.role || "").trim();
                if (["Owner", "Co-owner"].includes(cRole) || cRole.toLowerCase() === "wassim1mouh") {
                    canInvite = true;
                    myTeamName = "الإدارة";
                } else if (cRole.startsWith("Owner ")) {
                    myTeamName = cRole.replace("Owner ", "").trim();
                    canInvite = true;
                }
            }

            if (canInvite && currentUser && u.username.toLowerCase() !== currentUser.username.toLowerCase()) {
                actionHTML += `<button onclick="sendOffer('${u.username}', '${myTeamName}')" style="padding:6px 12px; background:#00ff87; border:none; border-radius:4px; font-weight:bold; cursor:pointer; color:#000; margin-right:8px;">عرض (${myTeamName}) 📩</button>`;
            }

            div.innerHTML = `
                <div>
                    <b>👤 ${u.username}</b> 
                    <small style="color:#aaa; display:block; margin-top:3px;">الفريق: ${u.team}</small>
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

    // الاستماع المباشر لعروض Firebase لكي يظهر العرض فور إرساله دون الحاجة لريفريش
    db.ref('offers').on('value', (snapshot) => {
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
            box.style.cssText = "background:#2b2b2b; padding:10px; margin:8px 0; border-radius:6px; text-align:right;";
            box.innerHTML = `
                عرض للانضمام إلى فريق: <b>${offer.fromTeam}</b> (مُرسل من: ${offer.from})<br>
                <div style="margin-top:8px;">
                    <button onclick="respondOffer('${offer.id}', 'accepted', '${offer.fromTeam}')" style="background:#00ff87; border:none; padding:5px 12px; font-weight:bold; cursor:pointer; color:#000; border-radius:4px; margin-left:5px;">قبول ✅</button>
                    <button onclick="respondOffer('${offer.id}', 'rejected', '')" style="background:#ff4444; color:#fff; border:none; padding:5px 12px; cursor:pointer; border-radius:4px;">رفض ❌</button>
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

// ==========================================
// تحديث وإعطاء الرول مباشرة وبدون أخطاء
// ==========================================
function updateUserRole() {
    const targetInput = document.getElementById("targetUser");
    const target = targetInput ? targetInput.value.trim() : "";
    const roleSelect = document.getElementById("newRoleSelect");
    const newRole = roleSelect ? roleSelect.value : "Player";

    if (!target) {
        alert("يرجى كتابة اسم المستخدم (حساب روبلوكس) أولاً!");
        return;
    }

    if (typeof db === 'undefined' || !db) {
        alert("خطأ: الاتصال بقاعدة البيانات السحابية غير متاح.");
        return;
    }

    // تحديد الفريق تلقائياً إذا كان الرول هو Owner [Team]
    let teamUpdate = "بدون فريق";
    if (newRole.startsWith("Owner ")) {
        teamUpdate = newRole.replace("Owner ", "").trim();
    }

    // تجهيز البيانات المراد تحديثها أو إضافتها
    let userData = {
        username: target,
        role: newRole
    };
    
    if (teamUpdate !== "بدون فريق") {
        userData.team = teamUpdate;
    }

    // التحديث المباشر في السحاب (يحدث أو ينشئ الحساب فوراً)
    db.ref('users/' + target).update(userData).then(() => {
        alert(`تم بنجاح تعيين الرول (${newRole}) للاعب "${target}" سحابياً! 👤✨`);
        if (targetInput) targetInput.value = "";
    }).catch((error) => {
        alert("حدث خطأ أثناء حفظ الرول: " + error.message);
    });
}


// دالة لجلب وجعل قائمة اللاعبين خاصة بالفريق المختار فقط
function loadTeamPlayersForKick() {
    const teamSelect = document.getElementById("kickTeamSelect");
    const playerSelect = document.getElementById("kickPlayerSelect");
    
    if (!teamSelect || !playerSelect) return;
    const selectedTeam = teamSelect.value;

    playerSelect.innerHTML = '<option value="">جاري تحميل اللاعبين...</option>';

    if (!selectedTeam) {
        playerSelect.innerHTML = '<option value="">اختر الفريق أولاً...</option>';
        return;
    }

    // جلب اللاعبين المنضمين لهذا الفريق فقط من قاعدة البيانات
    db.ref('players').orderByChild('team').equalTo(selectedTeam).once('value')
        .then((snapshot) => {
            const playersData = snapshot.val();
            let options = '<option value="">اختر اللاعب المراد طرده...</option>';

            if (playersData) {
                Object.keys(playersData).forEach(playerId => {
                    let player = playersData[playerId];
                    options += `<option value="${playerId}">${player.name || playerId}</option>`;
                });
            } else {
                options = '<option value="">لا يوجد لاعبو منضمون لهذا النادي حالياً</option>';
            }
            playerSelect.innerHTML = options;
        })
        .catch(err => {
            playerSelect.innerHTML = '<option value="">خطأ في جلب اللاعبين</option>';
        });
}

// دالة تنفيذ طرد اللاعب المحدد
function kickPlayerFromTeam() {
    const teamSelect = document.getElementById("kickTeamSelect");
    const playerSelect = document.getElementById("kickPlayerSelect");

    if (!teamSelect || !playerSelect) return;

    const team = teamSelect.value;
    const playerId = playerSelect.value;
    const playerName = playerSelect.options[playerSelect.selectedIndex].text;

    if (!team || !playerId) {
        alert("يرجى اختيار الفريق واللاعب المراد طرده بدقة!");
        return;
    }

    if (!confirm(`هل أنت متأكد من طرد اللاعب (${playerName}) من نادي ${team}؟`)) {
        return;
    }

    // حذف اللاعب أو تحديث حالته في قاعدة البيانات (حسب هيكل تخزين اللاعبين لديك)
    db.ref('players/' + playerId).remove()
        .then(() => {
            alert(`تم طرد اللاعب ${playerName} بنجاح من نادي ${team}! ❌`);
            // إعادة تحميل القائمة لتحديثها
            loadTeamPlayersForKick();
        })
        .catch(err => {
            alert("حدث خطأ أثناء عملية الطرد: " + err.message);
        });
}


// ==========================================
// 1. حفظ وتحديث المباريات في Firebase
// ==========================================
function saveMatchCard() {
    const home = document.getElementById("matchHomeTeam") ? document.getElementById("matchHomeTeam").value.trim() : "";
    const away = document.getElementById("matchAwayTeam") ? document.getElementById("matchAwayTeam").value.trim() : "";
    const score = document.getElementById("matchScore") ? document.getElementById("matchScore").value.trim() : "0 - 0";
    const time = document.getElementById("matchTime") ? document.getElementById("matchTime").value.trim() : "20:00";
    const status = document.getElementById("matchStatus") ? document.getElementById("matchStatus").value : "قريباً ⏳";
    const round = document.getElementById("matchRound") ? document.getElementById("matchRound").value.trim() : "الجولة 1";

    if (!home || !away) {
        alert("يرجى كتابة اسم الفريقين على الأقل!");
        return;
    }

    if (!db) {
        alert("خطأ في الاتصال بقاعدة البيانات!");
        return;
    }

    // معرف فريد للمباراة بناءً على الفريقين
    const matchId = `${home}_vs_${away}`.replace(/\s+/g, '_');

    db.ref('matches/' + matchId).set({
        homeTeam: home,
        awayTeam: away,
        score: score,
        time: time,
        status: status,
        round: round,
        updatedAt: Date.now()
    }).then(() => {
        alert("تم حفظ وتحديث بيانات المباراة بنجاح! ⚽");
        // إعادة تفريغ الحقول
        document.getElementById("matchHomeTeam").value = "";
        document.getElementById("matchAwayTeam").value = "";
        document.getElementById("matchScore").value = "";
        document.getElementById("matchTime").value = "";
    }).catch(err => {
        alert("حدث خطأ أثناء الحفظ: " + err.message);
    });
}

// ==========================================
// 2. تحميل وعرض كروت المباريات في تبويب Games
// ==========================================
function loadGamesCards() {
    const gamesContainer = document.getElementById("gamesContainer") || document.getElementById("games");
    if (!gamesContainer || !db) return;

    db.ref('matches').on('value', (snapshot) => {
        const matchesData = snapshot.val();
        
        // العثور على مكان عرض الكروت داخل التبويب
        let targetDiv = gamesContainer.querySelector('.games-list') || gamesContainer;
        
        if (!matchesData) {
            targetDiv.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>لا توجد مباريات مسجلة حالياً.</p>";
            return;
        }

        let html = "";
        Object.keys(matchesData).forEach(key => {
            let m = matchesData[key];
            let statusColor = m.status.includes("مباشر") ? "#ff4444" : (m.status.includes("انتهت") ? "#888" : "#00ff87");

            html += `
                <div style="background:#222; border:1px solid #333; border-radius:10px; padding:15px; margin:12px 0; text-align:center; position:relative;">
                    <div style="font-size:12px; color:#aaa; margin-bottom:8px;">${m.round || 'مباراة'} • <span style="color:${statusColor}; font-weight:bold;">${m.status}</span></div>
                    
                    <div style="display:flex; justify-content:space-around; align-items:center; font-size:18px; font-weight:bold;">
                        <span style="flex:1;">${m.homeTeam}</span>
                        <span style="background:#111; padding:6px 14px; border-radius:6px; color:#00ff87; letter-spacing:2px; margin:0 10px;">${m.score}</span>
                        <span style="flex:1;">${m.awayTeam}</span>
                    </div>
                    
                    <div style="font-size:12px; color:#888; margin-top:10px;">⏰ التوقيت: ${m.time}</div>
                </div>
            `;
        });

        targetDiv.innerHTML = html;
    });
}

// ==========================================
// 1. حفظ وتحديث المباريات في Firebase
// ==========================================
function saveMatchCard() {
    const home = document.getElementById("matchHomeTeam") ? document.getElementById("matchHomeTeam").value.trim() : "";
    const away = document.getElementById("matchAwayTeam") ? document.getElementById("matchAwayTeam").value.trim() : "";
    const score = document.getElementById("matchScore") ? document.getElementById("matchScore").value.trim() : "0 - 0";
    const time = document.getElementById("matchTime") ? document.getElementById("matchTime").value.trim() : "20:00";
    const status = document.getElementById("matchStatus") ? document.getElementById("matchStatus").value : "قريباً ⏳";
    const round = document.getElementById("matchRound") ? document.getElementById("matchRound").value.trim() : "الجولة 1";

    if (!home || !away) {
        alert("يرجى كتابة اسم الفريقين على الأقل!");
        return;
    }

    if (!db) {
        alert("خطأ في الاتصال بقاعدة البيانات!");
        return;
    }

    // معرف فريد للمباراة بناءً على الفريقين
    const matchId = `${home}_vs_${away}`.replace(/\s+/g, '_');

    db.ref('matches/' + matchId).set({
        homeTeam: home,
        awayTeam: away,
        score: score,
        time: time,
        status: status,
        round: round,
        updatedAt: Date.now()
    }).then(() => {
        alert("تم حفظ وتحديث بيانات المباراة بنجاح! ⚽");
        // إعادة تفريغ الحقول
        document.getElementById("matchHomeTeam").value = "";
        document.getElementById("matchAwayTeam").value = "";
        document.getElementById("matchScore").value = "";
        document.getElementById("matchTime").value = "";
    }).catch(err => {
        alert("حدث خطأ أثناء الحفظ: " + err.message);
    });
}

// ==========================================
// 2. تحميل وعرض كروت المباريات في تبويب Games
// ==========================================
function loadGamesCards() {
    const gamesContainer = document.getElementById("gamesContainer") || document.getElementById("games");
    if (!gamesContainer || !db) return;

    db.ref('matches').on('value', (snapshot) => {
        const matchesData = snapshot.val();
        
        // العثور على مكان عرض الكروت داخل التبويب
        let targetDiv = gamesContainer.querySelector('.games-list') || gamesContainer;
        
        if (!matchesData) {
            targetDiv.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>لا توجد مباريات مسجلة حالياً.</p>";
            return;
        }

        let html = "";
        Object.keys(matchesData).forEach(key => {
            let m = matchesData[key];
            let statusColor = m.status.includes("مباشر") ? "#ff4444" : (m.status.includes("انتهت") ? "#888" : "#00ff87");

            html += `
                <div style="background:#222; border:1px solid #333; border-radius:10px; padding:15px; margin:12px 0; text-align:center; position:relative;">
                    <div style="font-size:12px; color:#aaa; margin-bottom:8px;">${m.round || 'مباراة'} • <span style="color:${statusColor}; font-weight:bold;">${m.status}</span></div>
                    
                    <div style="display:flex; justify-content:space-around; align-items:center; font-size:18px; font-weight:bold;">
                        <span style="flex:1;">${m.homeTeam}</span>
                        <span style="background:#111; padding:6px 14px; border-radius:6px; color:#00ff87; letter-spacing:2px; margin:0 10px;">${m.score}</span>
                        <span style="flex:1;">${m.awayTeam}</span>
                    </div>
                    
                    <div style="font-size:12px; color:#888; margin-top:10px;">⏰ التوقيت: ${m.time}</div>
                </div>
            `;
        });

        targetDiv.innerHTML = html;
    });
}

function saveMatchCard() {
    const homeInput = document.getElementById("matchHomeTeam");
    const awayInput = document.getElementById("matchAwayTeam");
    const scoreInput = document.getElementById("matchScore");
    const timeInput = document.getElementById("matchTime");
    const statusInput = document.getElementById("matchStatus");
    const roundInput = document.getElementById("matchRound");

    if (!homeInput || !awayInput) {
        alert("خطأ: لم يتم العثور على حقول الإدخال في الصفحة!");
        return;
    }

    const home = homeInput.value.trim();
    const away = awayInput.value.trim();
    const score = scoreInput.value.trim() || "0 - 0";
    const time = timeInput.value.trim() || "20:00";
    const status = statusInput ? statusInput.value : "قريباً ⏳";
    const round = roundInput ? roundInput.value.trim() : "الجولة 1";

    if (!home || !away) {
        alert("يرجى كتابة اسم الفريقين على الأقل!");
        return;
    }

    if (typeof db === "undefined" || !db) {
        alert("خطأ: الاتصال بقاعدة البيانات غير متعرف عليه!");
        return;
    }

    // معرف فريد للمباراة
    const matchId = `${home}_vs_${away}`.replace(/\s+/g, '_');

    db.ref('matches/' + matchId).set({
        homeTeam: home,
        awayTeam: away,
        score: score,
        time: time,
        status: status,
        round: round,
        updatedAt: Date.now()
    }).then(() => {
        alert("تم حفظ وتحديث بيانات المباراة بنجاح! ⚽");
        homeInput.value = "";
        awayInput.value = "";
        scoreInput.value = "";
        timeInput.value = "";
        if (typeof loadGamesCards === "function") {
            loadGamesCards();
        }
    }).catch(err => {
        alert("حدث خطأ أثناء الحفظ في قاعدة البيانات: " + err.message);
    });
}

// ==========================================
// دالة حذف مباراة مباشرة وسريعة
// ==========================================
function deleteMatchCard() {
    const home = document.getElementById("matchHomeTeam") ? document.getElementById("matchHomeTeam").value.trim() : "";
    const away = document.getElementById("matchAwayTeam") ? document.getElementById("matchAwayTeam").value.trim() : "";

    if (!home || !away) {
        alert("يرجى كتابة اسم الفريقين في الخانات لتحديد المباراة المراد حذفها!");
        return;
    }

    const matchId = `${home}_vs_${away}`.replace(/\s+/g, '_');

    db.ref('matches/' + matchId).remove()
        .then(() => {
            alert("تم حذف المباراة بنجاح! 🗑️");
            document.getElementById("matchHomeTeam").value = "";
            document.getElementById("matchAwayTeam").value = "";
            if (typeof loadGamesCards === "function") {
                loadGamesCards();
            }
        })
        .catch(err => {
            alert("حدث خطأ أثناء الحذف: " + err.message);
        });
}


// ==========================================
// تحميل وعرض كروت المباريات مع زر التعديل السريع
// ==========================================
function loadGamesCards() {
    const gamesContainer = document.getElementById("gamesContainer") || document.getElementById("games");
    if (!gamesContainer || !db) return;

    db.ref('matches').on('value', (snapshot) => {
        const matchesData = snapshot.val();
        let targetDiv = gamesContainer.querySelector('.games-list') || gamesContainer;
        
        if (!matchesData) {
            targetDiv.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>لا توجد مباريات مسجلة حالياً.</p>";
            return;
        }

        let html = "";
        Object.keys(matchesData).forEach(key => {
            let m = matchesData[key];
            let statusColor = m.status.includes("مباشر") ? "#ff4444" : (m.status.includes("انتهت") ? "#888" : "#00ff87");

            html += `
                <div style="background:#222; border:1px solid #333; border-radius:10px; padding:15px; margin:12px 0; text-align:center; position:relative;">
                    <div style="font-size:12px; color:#aaa; margin-bottom:8px;">${m.round || 'مباراة'} • <span style="color:${statusColor}; font-weight:bold;">${m.status}</span></div>
                    
                    <div style="display:flex; justify-content:space-around; align-items:center; font-size:18px; font-weight:bold;">
                        <span style="flex:1;">${m.homeTeam}</span>
                        <span style="background:#111; padding:6px 14px; border-radius:6px; color:#00ff87; letter-spacing:2px; margin:0 10px;">${m.score}</span>
                        <span style="flex:1;">${m.awayTeam}</span>
                    </div>
                    
                    <div style="font-size:12px; color:#888; margin-top:10px;">⏰ التوقيت: ${m.time}</div>
                    
                    <!-- زر تعديل سريع يظهر للإداريين -->
                    <div style="margin-top: 10px; border-top: 1px solid #333; padding-top: 8px;">
                        <button onclick="fillMatchForm('${m.homeTeam}', '${m.awayTeam}', '${m.score}', '${m.time}', '${m.status}', '${m.round}')" style="background:#333; color:#00ff87; border:1px solid #00ff87; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;">تعديل هذه المباراة ✏️</button>
                    </div>
                </div>
            `;
        });

        targetDiv.innerHTML = html;
    });
}

// دالة مساعدة لنقل بيانات الكارت إلى خانات الإدخال تلقائياً
function fillMatchForm(home, away, score, time, status, round) {
    document.getElementById("matchHomeTeam").value = home;
    document.getElementById("matchAwayTeam").value = away;
    document.getElementById("matchScore").value = score;
    document.getElementById("matchTime").value = time;
    document.getElementById("matchStatus").value = status;
    document.getElementById("matchRound").value = round;
    
    // الصعود أعلى الصفحة بسلاسة للوصول لخانات التعديل
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert("تم نقل بيانات المباراة إلى الخانات! قم بتعديل ما تريد ثم اضغط حفظ 🚀");
}

// ==========================================
// دالة حفظ وتحديث بيانات ترتيب الفريق في جدول الدوري
// ==========================================
function saveLeagueTable() {
    const teamSelect = document.getElementById("teamSelect");
    const playedInput = document.getElementById("playedMatches");
    const wonInput = document.getElementById("wonMatches");
    const drawnInput = document.getElementById("drawnMatches");
    const lostInput = document.getElementById("lostMatches");
    const pointsInput = document.getElementById("teamPoints");

    if (!teamSelect) {
        alert("خطأ: لم يتم العثور على قائمة اختيار الفرق!");
        return;
    }

    const team = teamSelect.value;
    const played = parseInt(playedInput ? playedInput.value : 0) || 0;
    const won = parseInt(wonInput ? wonInput.value : 0) || 0;
    const drawn = parseInt(drawnInput ? drawnInput.value : 0) || 0;
    const lost = parseInt(lostInput ? lostInput.value : 0) || 0;
    const points = parseInt(pointsInput ? pointsInput.value : 0) || 0;

    if (typeof db === "undefined" || !db) {
        alert("خطأ: قاعدة البيانات غير متصلة!");
        return;
    }

    // حفظ البيانات في قاعدة البيانات تحت مسار 'standings'
    db.ref('standings/' + team).set({
        team: team,
        played: played,
        won: won,
        drawn: drawn,
        lost: lost,
        points: points,
        updatedAt: Date.now()
    }).then(() => {
        alert(`تم تحديث جدول فريق (${team}) بنجاح! 📊`);
        
        // تفريغ الحقول بعد الحفظ
        if (playedInput) playedInput.value = "";
        if (wonInput) wonInput.value = "";
        if (drawnInput) drawnInput.value = "";
        if (lostInput) lostInput.value = "";
        if (pointsInput) pointsInput.value = "";

        // إعادة تحميل الجدول مباشرة لكي يظهر التغيير فوراً
        if (typeof loadLeagueTable === "function") {
            loadLeagueTable();
        } else {
            // إذا لم تكن الدالة موجودة، قم بتحديث الصفحة تلقائياً لتظهر البيانات الجديدة
            location.reload();
        }
    }).catch(err => {
        alert("حدث خطأ أثناء الاتصال بقاعدة البيانات: " + err.message);
    });
}

// ==========================================
// دالة الحفظ السريع للرولات (Staff & Owners)
// ==========================================
function quickAssignRole(selectedRole) {
    const usernameInput = document.getElementById("globalUsernameInput");
    if (!usernameInput) return;

    const targetUsername = usernameInput.value.trim();

    if (!targetUsername) {
        alert("يرجى كتابة اسم حساب اللاعب أولاً في الخانة العلوية!");
        return;
    }

    if (!db) {
        alert("خطأ: الاتصال بقاعدة البيانات Firebase غير مفعل!");
        return;
    }

    if (!confirm(`هل أنت متأكد من إعطاء رول (${selectedRole}) للاعب (${targetUsername})؟`)) {
        return;
    }

    // حفظ الرول مباشرة في قاعدة البيانات
    db.ref('users/' + targetUsername).update({
        role: selectedRole
    }).then(() => {
        alert(`تم حفظ وتطبيق رول [ ${selectedRole} ] للمستخدم (${targetUsername}) بنجاح! 🎉`);
        usernameInput.value = ""; // مسح الخانة بعد النجاح
    }).catch(err => {
        alert("حدث خطأ أثناء حفظ الرول: " + err.message);
    });
}

// الاستماع التلقائي للدعوات وتحديث مكان العروض فوراً
function listenForInvites(username) {
    if (!db) return;

    const contentArea = document.getElementById("offerContentArea");
    if (!contentArea) return;

    db.ref('users/' + username + '/pendingInvite').on('value', (snapshot) => {
        const inviteData = snapshot.val();

        if (inviteData && inviteData.team) {
            pendingTeamName = inviteData.team;
            // إذا وُجدت دعوة: إظهار اسم الفريق مع أزرار القبول والرفض
            contentArea.innerHTML = `
                <p style="color: #fff; font-size: 16px; margin-bottom: 15px;">
                    يرغب نادي <b style="color: #00ff87; font-size: 20px;">${pendingTeamName}</b> في ضمك لصفوفه!
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button type="button" onclick="acceptAutoInvite()" style="background: #28a745; color: #fff; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">قبول العرض ✅</button>
                    <button type="button" onclick="rejectAutoInvite()" style="background: #dc3545; color: #fff; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">رفض العرض ❌</button>
                </div>
            `;
        } else {
            // إذا لم توجد دعوة: إرسال رسالة توضح أنه لا توجد عروض حالياً
            contentArea.innerHTML = `
                <p style="color: #aaa; font-size: 14px; margin: 0;">مرحباً <b>${username}</b>، لا توجد عروض انضمام معلقة لك حالياً.</p>
            `;
        }
    });
}
