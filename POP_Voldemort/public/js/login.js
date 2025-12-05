/* public/js/login.js */

// ตัวแปรและ Element ที่ต้องใช้
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toRegisterBtn = document.getElementById('to-register');
const toLoginBtn = document.getElementById('to-login');

// --- 1. สลับหน้าจอ Login <-> Register ---
toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// --- 2. ฟังก์ชัน Login ---
document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    if (!username || !password) {
        alert("กรุณากรอกชื่อและรหัสผ่าน");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // ล็อกอินผ่าน -> ไปหน้าเกม
            window.location.href = 'index.html'; 
        } else {
            alert(data.message); // แจ้งเตือนถ้าผิดพลาด
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
});

// --- 3. ฟังก์ชัน Register ---
document.getElementById('regBtn').addEventListener('click', async () => {
    const username = document.getElementById('reg-user').value;
    const password = document.getElementById('reg-pass').value;

    if (!username || !password) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
            // สลับกลับไปหน้า Login อัตโนมัติ
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Register Error:", err);
        alert("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }
});