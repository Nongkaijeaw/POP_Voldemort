/* public/js/game.js */

// --- ตัวแปรหลัก ---
const img = document.getElementById("popcat1");
const scoreText = document.getElementById("score");
const myScoreText = document.getElementById('my_score');
const logoutBtn = document.getElementById('logoutBtn');

// เสียงและรูปภาพ (Path อิงตามโครงสร้าง public/...)
const audio = new Audio('sounds/Oow.mp3'); 
const imgPop = 'images/Voldemort_POP.png';
const imgSmile = 'images/Voldemort_smile.png';

let score = 0;

// --- 1. การทำงานกับ Server (Load & Save Score) ---

// ดึงคะแนนล่าสุดเมื่อเปิดเว็บ
async function loadScore() {
    try {
        // ยิงไปที่ API ที่เราเตรียมไว้ใน server.js
        // (หมายเหตุ: server.js ต้องมี API /api/score ที่อ่านจาก users table ของคนที่ login อยู่)
        // แต่ถ้ายังใช้ default_player แบบทดสอบ ก็ใช้ได้เลย
        const res = await fetch('/score'); 
        if(res.ok) {
            const data = await res.json();
            score = data.score;
            updateDisplay(score);
        }
    } catch (err) {
        console.error("Load score error:", err);
    }
}

// ส่งคะแนนไปบันทึก (เรียกทุกครั้งที่กด)
async function sendClick() {
    try {
        await fetch('/score', { method: 'POST' });
    } catch (err) {
        console.error("Update score error:", err);
    }
}

// --- 2. Logic เกม (กดแล้วเปลี่ยนรูป+เสียง) ---

function updateDisplay(num) {
    scoreText.innerText = num;
    if(myScoreText) myScoreText.innerText = num;
    
    // อัปเดตในตาราง Leaderboard (แถวที่เขียนว่า You)
    const tableScore = document.getElementById("table_score");
    if(tableScore) tableScore.innerText = num;
}

function pop() {
    score++;
    updateDisplay(score); // อัปเดตหน้าจอทันทีให้ลื่นไหล
    sendClick();          // ส่งข้อมูลไปหลังบ้าน (ไม่ต้องรอตอบกลับ)
    
    // เล่นเสียง (Reset เวลาเพื่อให้กดรัวๆ ได้)
    audio.currentTime = 0;
    audio.play();
    
    // เปลี่ยนรูป
    img.src = imgPop;
}

function unpop() {
    img.src = imgSmile;
}

// รองรับทั้ง Mouse และ Touch (มือถือ)
img.addEventListener("mousedown", pop);
img.addEventListener("mouseup", unpop);

img.addEventListener("touchstart", (e) => {
    e.preventDefault(); // ป้องกันการกดซ้ำ
    pop();
});
img.addEventListener("touchend", (e) => {
    e.preventDefault();
    unpop();
});

// --- 3. ระบบ Logout ---
logoutBtn.addEventListener('click', async () => {
    if(confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        try {
            await fetch('/logout'); // เรียก API ลบ Cookie
            window.location.href = 'login.html'; // เด้งกลับหน้า Login
        } catch (err) {
            alert("Logout failed");
        }
    }
});

// --- 4. Fake Leaderboard Animation (โค้ดเดิมของคุณเพื่อให้ตารางขยับ) ---
// (ส่วนนี้เป็นแค่ Simulation ให้ดูเหมือนมีคนอื่นเล่นด้วย)
let hk_score = 120300000;
let tw_score = 140000;
let th_score = 130000;

// ใช้ setInterval อัปเดตตัวเลขสมมติในตาราง
const table = document.getElementById("table");

if(table) {
    setInterval(() => { 
        //hk_score += 12; 
        if(table.rows[0]) table.rows[0].cells[3].innerText = hk_score.toLocaleString(); 
    }, 50);

    setInterval(() => { 
        //tw_score += 5; 
        if(table.rows[1]) table.rows[1].cells[3].innerText = tw_score.toLocaleString(); 
    }, 200);
    
    // ... สามารถเพิ่มประเทศอื่นตามต้องการ ...
}

// เริ่มต้นโหลดคะแนนจริง
loadScore();