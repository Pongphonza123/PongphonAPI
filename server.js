const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const https = require('https');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'UX23Y24%@&2aMb';
const privateKey = fs.readFileSync('privatekey.pem', 'utf8');
const certificate = fs.readFileSync('certificate.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "shopdee"
});
db.connect();

app.use(express.json()); // สำหรับ parse ข้อมูล JSON

// Middleware สำหรับตรวจสอบ JWT token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send({ message: 'Token is required', status: false });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send({ message: 'Invalid token', status: false });
        req.user = user; // เก็บข้อมูลผู้ใช้จาก token เพื่อนำไปใช้ต่อ
        next();
    });
}

// เพิ่มข้อมูลสินค้าใหม่
app.post('/product', authenticateToken, (req, res) => {
    const { productName, productDetail, price, cost, quantity } = req.body;
    if (!productName || !productDetail || isNaN(price) || isNaN(cost) || isNaN(quantity)) {
        return res.status(400).send({ message: "ข้อมูลไม่ถูกต้อง", status: false });
    }

    // ใช้ parameterized query เพื่อป้องกัน SQL Injection
    const sql = "INSERT INTO product (productName, productDetail, price, cost, quantity) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [productName, productDetail, price, cost, quantity], (err) => {
        if (err) return res.status(500).send({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", status: false });
        res.send({ message: 'บันทึกสินค้าเรียบร้อยแล้ว', status: true });
    });
});

// ดึงข้อมูลสินค้าตาม ID
app.get('/product/:id', (req, res) => {
    const productID = req.params.id;

    // ใช้ parameterized query เพื่อป้องกัน SQL Injection
    const sql = "SELECT * FROM product WHERE productID = ?";
    db.query(sql, [productID], (err, result) => {
        if (err) return res.status(500).send({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล", status: false });
        res.send(result); // ส่งข้อมูลสินค้าในรูปแบบ JSON
    });
});

// เข้าสู่ระบบผู้ใช้
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send({ message: "จำเป็นต้องมีชื่อผู้ใช้และรหัสผ่าน", status: false });

    // ตรวจสอบชื่อผู้ใช้และสถานะการใช้งาน
    const sql = "SELECT * FROM customer WHERE username = ? AND isActive = 1";
    db.query(sql, [username], (err, result) => {
        if (err) return res.status(500).send({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', status: false });
        if (result.length === 0) return res.send({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", status: false });

        // ตรวจสอบรหัสผ่านด้วย bcrypt
        bcrypt.compare(password, result[0].password, (err, match) => {
            if (err || !match) return res.send({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", status: false });
            
            // สร้าง JWT token สำหรับผู้ใช้
            const token = jwt.sign({ id: result[0].customerID }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
            res.send({ ...result[0], token, message: "เข้าสู่ระบบสำเร็จ", status: true });
        });
    });
});

// เริ่มต้นเซิร์ฟเวอร์และรันที่พอร์ต 3000
app.listen(port, () => console.log(`Server running on port ${port}`));
// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});