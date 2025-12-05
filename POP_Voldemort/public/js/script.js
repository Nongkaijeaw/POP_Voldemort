const img = document.getElementById("popcat1");
const scoreText = document.getElementById("score");
const myScoreText = document.getElementById('my_score');
const logoutBtn = document.getElementById('logoutBtn');

// เสียงและรูปภาพ
const audio = new Audio('sounds/Oow.mp3'); 
const imgPop = 'images/Voldemort_POP.png';
const imgSmile = 'images/Voldemort_smile.png';

let score = 0;

// --- 1. การทำงานกับ Server (Load & Save Score) ---

// ดึงคะแนนล่าสุดเมื่อเปิดเว็บ
async function loadScore() {
    try {
        // ยิงไปที่ API /api/score
        const res = await fetch('/score'); 
        
        // [เพิ่มใหม่] เช็คว่าล็อกอินหรือยัง?
        if (res.status === 401) {
            alert("Session หมดอายุ หรือยังไม่ได้เข้าสู่ระบบ");
            window.location.href = 'login.html'; // ดีดกลับไปหน้า Login
            return;
        }

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
        // ยิงไปที่ API /api/score
        await fetch('/score', { method: 'POST' });
    } catch (err) {
        console.error("Update score error:", err);
    }
}

// --- 2. Logic เกม (กดแล้วเปลี่ยนรูป+เสียง) ---

function updateDisplay(num) {
    scoreText.innerText = num.toLocaleString(); // ใส่ลูกน้ำคั่นหลักพัน
    if(myScoreText) myScoreText.innerText = num.toLocaleString();
    
    // อัปเดตในตาราง Leaderboard (แถวที่เขียนว่า You) ถ้ามี
    const tableScore = document.getElementById("table_score");
    if(tableScore) tableScore.innerText = num.toLocaleString();
}

function pop() {
    score++;
    updateDisplay(score); // อัปเดตหน้าจอทันทีให้ลื่นไหล
    sendClick();          // ส่งข้อมูลไปหลังบ้าน
    
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
if(logoutBtn) {
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
}

// --- 4. [ส่วนที่เพิ่มใหม่] Real Leaderboard (ดึงข้อมูลจริงจาก DB) ---

async function loadLeaderboard() {
    try {
        const res = await fetch('/leaderboard');
        const data = await res.json();
        
        const table = document.getElementById("table");
        if (!table) return;

        // สร้างหัวตาราง
        let html = `
            <tr class="bordered">
                <th>#</th>
                <th>Profile</th>
                <th>Name</th>
                <th>Pop Count</th>
            </tr>
        `;

        const myName = getMyUsername(); // เอาชื่อตัวเองมาเช็ค

        data.forEach((user, index) => {
            // สร้างลิงก์ไปหน้า Profile
            const profileLink = `profile.html?user=${user.username}`;
            
            // เช็คว่าเป็นตัวเราเองหรือเปล่า (ถ้าใช่ให้ใส่ class ไฮไลท์)
            const isMe = (user.username === myName);
            const rowClass = isMe ? "bordered my-row" : "bordered";
            const rowStyle = isMe ? "background-color: #d1e7dd;" : ""; // สีเขียวอ่อนถ้าเป็นเรา

            html += `
                <tr class="${rowClass}" style="cursor: pointer; ${rowStyle}" onclick="location.href='${profileLink}'">
                    <td>${index + 1}</td>
                    <td><img src="images/${user.img_path}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border: 1px solid #aaa;"></td>
                    <td>${user.username} ${isMe ? '(You)' : ''}</td>
                    <td style="text-align: right; font-weight: bold;">${user.score.toLocaleString()}</td>
                </tr>
            `;
        });

        table.innerHTML = html;

    } catch (err) {
        console.error("Load leaderboard error:", err);
    }
}

// ฟังก์ชันช่วยดึงชื่อตัวเองจาก Cookie (เพื่อเอามาเช็คว่าแถวไหนคือเรา)
function getMyUsername() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; username=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// --- เริ่มต้นทำงาน ---
loadScore();       // โหลดคะแนนตัวเอง
loadLeaderboard(); // โหลดตารางอันดับ

// ตั้งเวลาให้รีเฟรช Leaderboard ทุกๆ x วินาที (เพื่อให้เห็นคะแนนคนอื่นขยับ)
setInterval(loadLeaderboard, 1000);