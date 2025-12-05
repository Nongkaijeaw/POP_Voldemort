const urlParams = new URLSearchParams(window.location.search);
const targetUserParam = urlParams.get('user'); // รับ user จาก URL ถ้ามี
let currentProfileId = null;

// 1. โหลดข้อมูลเมื่อเปิดหน้าเว็บ
async function loadProfile() {
    // ถ้ามี user param ก็ส่งไปถาม server, ถ้าไม่มี server จะเอาของตัวเองมาให้
    const url = targetUserParam ? `/api/profile?user=${targetUserParam}` : '/api/profile';
    
    try {
        const res = await fetch(url);
        if (!res.ok) {
            alert("User not found");
            window.location.href = 'index.html';
            return;
        }
        const user = await res.json();
        currentProfileId = user.id;

        // Render หน้าจอ
        document.getElementById('username').innerText = user.username;
        document.getElementById('bio').innerText = user.bio || "No bio yet.";
        document.getElementById('score-display').innerText = user.score;
        document.getElementById('like-count').innerText = user.likes;
        // เช็คว่ามีรูปไหม ถ้าไม่มีใช้ default (ดูจาก server ที่เราตั้ง default ไว้)
        document.getElementById('profile-img').src = 'images/' + user.img_path;

        // ถ้าดูโปรไฟล์คนอื่น ให้ซ่อนปุ่มเปลี่ยนรูป
        // (เช็คจาก Cookie ง่ายๆ หรือให้ Server บอกก็ได้ ในที่นี้ซ่อนถ้ามี query param)
        if(targetUserParam) {
            document.getElementById('edit-btn').style.display = 'none';
        }

        // โหลดคอมเมนต์ต่อ
        loadComments(user.id);

    } catch (err) {
        console.error(err);
    }
}

// 2. อัปโหลดรูปภาพ [cite: 4297-4309]
document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await fetch('/api/upload_profile', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            // อัปเดตหน้าจอทันที
            document.getElementById('profile-img').src = 'images/' + data.filename;
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
});

// 3. กดไลค์
document.getElementById('like-section').addEventListener('click', async () => {
    if (!currentProfileId) return;

    try {
        const res = await fetch('/api/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetId: currentProfileId })
        });
        const data = await res.json();
        
        let count = parseInt(document.getElementById('like-count').innerText);
        const icon = document.getElementById('like-icon');

        if (data.status === 'liked') {
            count++;
            icon.style.color = 'red';
        } else {
            count--;
            icon.style.color = 'gray';
        }
        document.getElementById('like-count').innerText = count;

    } catch (err) {
        console.error(err);
    }
});

// 4. โหลดคอมเมนต์
async function loadComments(userId) {
    const res = await fetch(`/api/comments?target_id=${userId}`);
    const comments = await res.json();
    
    const list = document.getElementById('comments-list');
    list.innerHTML = ''; // เคลียร์ของเก่า

    comments.forEach(c => {
        const html = `
            <div class="comment-item">
                <img src="images/${c.img_path}" class="comment-avatar">
                <div class="comment-content">
                    <h4>${c.username}</h4>
                    <p>${c.message}</p>
                    <small>${new Date(c.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `;
        list.innerHTML += html;
    });
}

// 5. ส่งคอมเมนต์
async function postComment() {
    const msg = document.getElementById('comment-msg').value;
    if(!msg) return;

    await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: currentProfileId, message: msg })
    });

    document.getElementById('comment-msg').value = '';
    loadComments(currentProfileId); // รีโหลดใหม่
}

loadProfile();