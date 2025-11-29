var img = document.getElementById("popcat1");
var count = document.getElementById("score");
var malaysiaScore = document.getElementById('my_score');
var score = 0;
var audio = new Audio('Oow.mp3');

// Cookie functions
function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null;
}

// Load score from cookie on page load
function loadScoreFromCookie() {
    const savedScore = getCookie("popcat_score");
    const savedMyScore = getCookie("popcat_myScore");
    
    if (savedScore !== null) {
        score = parseInt(savedScore);
        if (count) count.innerHTML = score;
    }
    
    if (savedMyScore !== null) {
        MyScore = parseInt(savedMyScore);
        if (malaysiaScore) malaysiaScore.innerHTML = MyScore;
        var tbl = document.getElementById("table");
        if (tbl && tbl.rows && tbl.rows[5] && tbl.rows[5].cells && tbl.rows[5].cells.item(3)) {
            tbl.rows[5].cells.item(3).innerHTML = MyScore;
        }
    }
}

// Save score to cookie
function saveScoreToCookie() {
    setCookie("popcat_score", score);
    setCookie("popcat_myScore", MyScore);
} 

// mouseclick event
img.addEventListener("mousedown", function(){
    increaseScore();
    img.src = 'Voldemort_POP.png';
    audio.play();
});
    
img.addEventListener("mouseup", function(){
    img.src = 'Voldemort_smile.png';
    audio.play();
});

// touch event
img.addEventListener("touchstart", function(){
    increaseScore();
    img.src = 'popcat2.png';
    audio.play();
});

img.addEventListener("touchmove", function(){
    img.src = 'popcat1.png';
     audio.play();
});

// Load score from cookie when page loads
function startCount() {
    loadScoreFromCookie();
}

// Save score automatically before leaving the page
window.addEventListener('beforeunload', function() {
    saveScoreToCookie();
});

// Score on leaderboard
setInterval(startCountHk, 1);

function startCountHk(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    hk_score++;
    tbl.rows[1].cells.item(3).innerHTML = hk_score;
}

setInterval(startCountTw, 20);

function startCountTw(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    tw_score++;
    tbl.rows[2].cells.item(3).innerHTML = tw_score;
}

setInterval(startCountTh, 25);

function startCountTh(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    th_score++;
    tbl.rows[3].cells.item(3).innerHTML = th_score;
}

setInterval(startCountJp, 40);

function startCountJp(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    jp_score++;
    tbl.rows[4].cells.item(3).innerHTML = jp_score;
}

setInterval(startCountFi, 34);

function startCountFi(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    fi_score++;
    tbl.rows[6].cells.item(3).innerHTML = fi_score;
}

setInterval(startCountSe, 20);

function startCountSe(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    se_score++;
    tbl.rows[7].cells.item(3).innerHTML = se_score;
}

setInterval(startCountPl, 15);

function startCountPl(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    pl_score++;
    tbl.rows[8].cells.item(3).innerHTML = pl_score;
}

setInterval(startCountDm, 31);

function startCountDm(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    dm_score++;
    tbl.rows[9].cells.item(3).innerHTML = dm_score;
}

setInterval(startCountId, 29);

function startCountId(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    id_score++;
    tbl.rows[10].cells.item(3).innerHTML = id_score;
}

setInterval(startCountHu, 70);

function startCountHu(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    hu_score++;
    tbl.rows[11].cells.item(3).innerHTML = hu_score;
}

setInterval(startCountSr, 5);

function startCountSr(){
    var tbl = document.getElementById("table");
    if (!tbl) return;
    sr_score++;
    tbl.rows[12].cells.item(3).innerHTML = sr_score;
}

function increaseScore(){
    score++;
    MyScore++;
    if (count) count.innerHTML = score;
    if (malaysiaScore) malaysiaScore.innerHTML = MyScore;
    var tbl = document.getElementById("table");
    if (tbl && tbl.rows && tbl.rows[5] && tbl.rows[5].cells && tbl.rows[5].cells.item(3)) {
        tbl.rows[5].cells.item(3).innerHTML = MyScore;
    }
    saveScoreToCookie();
}
