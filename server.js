const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // สำหรับการใช้งานตัวแปรสภาพแวดล้อม

const app = express();
const port = 3000;
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "shopdee"
});
db.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ฟังก์ชั่นตรวจสอบ JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token == null) return res.status(401).send({ message: 'Token is required', status: false });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send({ message: 'Invalid token', status: false });
        req.user = user;
        next();
    });
}

// เส้นทางการเพิ่มข้อมูลสินค้าใหม่
app.post('/productnew', authenticateToken, function (req, res) {
    const { productName, productDetail, price, cost, quantity } = req.body;

    // ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา
    if (!productName || !productDetail || isNaN(price) || isNaN(cost) || isNaN(quantity)) {
        return res.status(400).send({
            message: "ข้อมูลไม่ถูกต้อง",
            status: false
        });
    }

    // ใช้ parameterized queries เพื่อป้องกัน SQL Injection
    const sql = "INSERT INTO product (productName, productDetail, price, cost, quantity) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [productName, productDetail, price, cost, quantity], function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send({
                message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า",
                status: false
            });
        }
        res.send({ message: 'บันทึกสินค้าเรียบร้อยแล้ว', status: true });
    });
});

// เส้นทางการดึงข้อมูลสินค้า
app.get('/product/:id', function (req, res) {
    const productID = req.params.id;

    // ใช้ parameterized queries เพื่อป้องกัน SQL Injection
    const sql = "SELECT * FROM product WHERE productID = ?";
    db.query(sql, [productID], function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send({
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
                status: false
            });
        }
        res.send(result);
    });
});

// เส้นทางการเข้าสู่ระบบ
app.post('/loginnew', function (req, res) {
    const { username, password } = req.body;

    // ตรวจสอบว่ามีการป้อนชื่อผู้ใช้และรหัสผ่าน
    if (!username || !password) {
        return res.status(400).send({
            message: "จำเป็นต้องมีชื่อผู้ใช้และรหัสผ่าน",
            status: false
        });
    }

    // ใช้ parameterized queries เพื่อป้องกัน SQL Injection
    const sql = "SELECT * FROM customer WHERE username = ? AND isActive = 1";
    db.query(sql, [username], function (err, result) {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', err);
            return res.status(500).send({
                message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
                status: false
            });
        }

        if (result.length > 0) {
            const user = result[0];
            
            // ใช้ bcrypt สำหรับการตรวจสอบรหัสผ่าน
            bcrypt.compare(password, user.password, function (err, match) {
                if (err) {
                    console.error('เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน:', err);
                    return res.status(500).send({
                        message: "เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน",
                        status: false
                    });
                }

                if (match) {
                    // สร้าง JWT token สำหรับการเข้าถึง
                    const token = jwt.sign({ id: user.customerID }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
                    user.token = token;
                    user['message'] = "เข้าสู่ระบบสำเร็จ";
                    user['status'] = true;
                    res.send(user);
                } else {
                    res.send({
                        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
                        status: false
                    });
                }
            });
        } else {
            res.send({
                message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
                status: false
            });
        }
    });
});

app.listen(port, function () {
    console.log(`Server listening on port ${port}`);
});
