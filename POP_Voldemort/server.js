const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware Setup
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 1. กำหนดค่าการเชื่อมต่อ MySQL (เบื้องต้นเชื่อมไปที่ localhost ก่อนเพื่อสร้าง DB)
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pop_voldemort"
});

// --- ตั้งค่า Multer สำหรับอัปโหลดรูป --- [cite: 4282]
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/'); // เก็บไฟล์ไว้ที่ folder นี้
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์: username-timestamp.นามสกุล
        // หมายเหตุ: ต้องใช้ req.cookies.username หรือส่งมากับ body ก็ได้
        // ในที่นี้ใช้ timestamp เพื่อความง่ายและไม่ซ้ำ
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// ฟังก์ชันสำหรับ Query Database แบบ Promise
// ช่วยให้เราใช้ await ได้ ทำให้โค้ดอ่านง่าย ไม่ต้องซ้อน callback เยอะ
const queryDB = (sql) => {
    return new Promise((resolve, reject) => {
        con.query(sql, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};


const startServer = async () => {
    try {
        await new Promise((resolve, reject) => {
            con.connect((err) => {
                if (err) reject(err);
                else {
                    console.log("MySQL Connected!");
                    resolve();
                }
            });
        });

        // สร้าง Database ถ้ายังไม่มี
        await queryDB("CREATE DATABASE IF NOT EXISTS pop_voldemort");
        console.log("Database 'pop_voldemort' created or checked.");

        // เลือกใช้ Database นี้
        await queryDB("USE pop_voldemort");

        // --- สร้างตาราง Users (สำหรับเก็บคะแนนและล็อกอิน) ---
        // id, username, password, score (เก็บแต้มคลิก), img_path (รูปโปรไฟล์)
        const userTable = `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            score INT DEFAULT 0,
            img_path VARCHAR(255) DEFAULT 'default.png', 
            bio TEXT, 
            reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await queryDB(userTable);
        console.log("Table 'users' created or checked.");

        // --- สร้างตาราง Comments (สำหรับหน้า Profile) ---
        // sender_id (คนพิมพ์), receiver_id (เจ้าของโปรไฟล์), message
        const commentTable = `CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT,
            receiver_id INT,
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await queryDB(commentTable);
        console.log("Table 'comments' created or checked.");

        // --- (Optional) สร้างตาราง Likes ถ้าต้องการระบบไลค์ ---
        const likeTable = `CREATE TABLE IF NOT EXISTS likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            target_profile_id INT
        )`;
        await queryDB(likeTable);
        console.log("Table 'likes' created or checked.");

        console.log(">>> All Tables Ready! <<<");

    } catch (err) {
        console.error("Error setting up database:", err);
    }
};
// เริ่มต้นการเชื่อมต่อฐานข้อมูลก่อนเริ่ม Server
startServer();

app.get('/', (req, res) => {
    const username = req.cookies.username;

    // ถ้าไม่มี Cookie ชื่อ username ให้ดีดไปหน้า Login ก่อน
    if (!username) {
        return res.redirect('/login.html');
    }

    // ถ้ามี Cookie แล้ว ให้ไปหน้าเกม (index.html)
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
    // ส่งไฟล์ login.html เมื่อ User เข้าผ่าน /login
    res.sendFile(path.join(__dirname, 'public/login.html')); 
});

// --- ส่วนของ API Register และ Login ---

// 1. API สมัครสมาชิก (Register)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ status: 'error', message: 'กรอกข้อมูลให้ครบ' });

    try {
        // เช็คชื่อซ้ำ
        const check = await queryDB(`SELECT * FROM users WHERE username = '${username}'`);
        if (check.length > 0) return res.json({ status: 'error', message: 'ชื่อนี้ถูกใช้แล้ว' });

        // เพิ่ม User (พร้อมค่า Default สำหรับ Profile)
        const sql = `INSERT INTO users (username, password, bio, img_path) VALUES ('${username}', '${password}', 'สวัสดี! ฉันเป็นสมาชิกใหม่', 'default.png')`;
        await queryDB(sql);
        res.json({ status: 'success', message: 'สมัครสำเร็จ!' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// 2. API เข้าสู่ระบบ (Login)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        const result = await queryDB(sql);

        if (result.length > 0) {
            // สร้าง Cookie เพื่อจำว่าใคร Login อยู่
            res.cookie('username', username, { maxAge: 86400000 }); // 1 วัน
            res.json({ status: 'success', message: 'เข้าสู่ระบบสำเร็จ!', user: result[0] });
        } else {
            res.json({ status: 'error', message: 'ชื่อหรือรหัสผ่านผิด' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

// 3. API สำหรับ Logout (ลบ Cookie)
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.json({ status: 'success', message: 'Logged out' });
});

app.get('/leaderboard', async (req, res) => {
    try {
        // เลือกชื่อ, คะแนน, และรูปโปรไฟล์ เรียงตามคะแนนมากสุด 10 อันดับแรก
        const sql = `SELECT username, score, img_path FROM users ORDER BY score DESC LIMIT 10`;
        const result = await queryDB(sql);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/score', async (req, res) => {
    // อ่านชื่อผู้ใช้จาก Cookie เพื่อรู้ว่าใครเล่นอยู่
    const username = req.cookies.username;

    if (!username) {
        return res.status(401).json({ error: "Unauthorized: กรุณาล็อกอินก่อน" });
    }

    try {
        // ดึงคะแนนล่าสุดจาก Database
        const sql = `SELECT score FROM users WHERE username = '${username}'`;
        const result = await queryDB(sql);

        if (result.length > 0) {
            res.json({ score: result[0].score });
        } else {
            res.json({ score: 0 });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/score', async (req, res) => {
    // อ่านชื่อผู้ใช้จาก Cookie
    const username = req.cookies.username;

    if (!username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // บวกคะแนนเพิ่มทีละ 1 ใน Database
        const sql = `UPDATE users SET score = score + 1 WHERE username = '${username}'`;
        await queryDB(sql);
        
        res.json({ status: "success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/api/profile', async (req, res) => {
    // รับชื่อ user ที่ต้องการดูจาก query param (เช่น /api/profile?user=harry)
    // ถ้าไม่ส่งมา ให้ดูของตัวเอง (จาก cookie)
    const targetUser = req.query.user || req.cookies.username;
    
    if (!targetUser) return res.status(401).json({ error: "No user specified" });

    try {
        // 1. ดึงข้อมูล User
        const userSql = `SELECT id, username, score, img_path, bio FROM users WHERE username = '${targetUser}'`;
        const userResult = await queryDB(userSql);
        
        if (userResult.length === 0) return res.status(404).json({ error: "User not found" });
        const user = userResult[0];

        // 2. นับจำนวนไลค์
        const likeSql = `SELECT COUNT(*) as count FROM likes WHERE target_profile_id = ${user.id}`;
        const likeResult = await queryDB(likeSql);
        user.likes = likeResult[0].count;

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/upload_profile', upload.single('avatar'), async (req, res) => {
    const username = req.cookies.username;
    if (!username || !req.file) return res.status(400).json({ error: "Upload failed" });

    try {
        const filename = req.file.filename;
        // อัปเดตชื่อไฟล์ลง Database
        await queryDB(`UPDATE users SET img_path = '${filename}' WHERE username = '${username}'`);
        res.json({ status: "success", filename: filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/like', async (req, res) => {
    const likerName = req.cookies.username;
    const { targetId } = req.body; // รับ ID ของคนที่เราจะไลค์

    try {
        // หา ID ของคนกดไลค์ก่อน
        const likerRes = await queryDB(`SELECT id FROM users WHERE username = '${likerName}'`);
        const likerId = likerRes[0].id;

        // เช็คว่าเคยไลค์ยัง?
        const check = await queryDB(`SELECT * FROM likes WHERE user_id = ${likerId} AND target_profile_id = ${targetId}`);
        
        if (check.length > 0) {
            // ถ้าเคยแล้ว -> เอาออก (Unlike)
            await queryDB(`DELETE FROM likes WHERE user_id = ${likerId} AND target_profile_id = ${targetId}`);
            res.json({ status: "unliked" });
        } else {
            // ถ้ายัง -> เพิ่มไลค์
            await queryDB(`INSERT INTO likes (user_id, target_profile_id) VALUES (${likerId}, ${targetId})`);
            res.json({ status: "liked" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/comments', async (req, res) => {
    const targetId = req.query.target_id;
    try {
        // Join ตาราง users เพื่อเอาชื่อคนคอมเมนต์มาแสดง [cite: 4433]
        const sql = `
            SELECT c.message, c.timestamp, u.username, u.img_path 
            FROM comments c 
            JOIN users u ON c.sender_id = u.id 
            WHERE c.receiver_id = ${targetId} 
            ORDER BY c.timestamp DESC`;
        
        const comments = await queryDB(sql);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/comment', async (req, res) => {
    const senderName = req.cookies.username;
    const { targetId, message } = req.body;

    try {
        const senderRes = await queryDB(`SELECT id FROM users WHERE username = '${senderName}'`);
        const senderId = senderRes[0].id;

        await queryDB(`INSERT INTO comments (sender_id, receiver_id, message) VALUES (${senderId}, ${targetId}, '${message}')`);
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เริ่มต้น Server [cite: 3209]
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});