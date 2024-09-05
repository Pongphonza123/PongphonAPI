const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Ensure 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware to parse urlencoded bodies (optional, for completeness)
app.use(express.urlencoded({ extended: true }));

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and GIF are allowed.'));
        }
    }
});

// Serve static files from 'uploads'
app.use('/uploads', express.static(uploadsDir));

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123_321",
    database: "pongphondatabase"
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('MySQL Connected...');
});

// Get all cars
app.get('/cars', (req, res) => {
    db.query('SELECT * FROM Cars', (err, results) => {
        if (err) {
            console.error('Error fetching cars:', err);
            res.status(500).send('Error fetching cars');
        } else {
            res.json(results);
        }
    });
});

// Insert a new car
app.post('/add/cars', upload.single('CarImage'), (req, res) => {
    console.log('Received new car:', req.body);
    console.log('Car image uploaded:', req.file);
    
    // Destructure fields from the request body
    const { Brand, Model, Year, Color, Price, TransmissionType, FuelType, NumberOfDoors, NumberOfSeats } = req.body;
    const carImage = req.file ? req.file.originalname : null;

    if (!Brand || !Model || !Year || !Color || !Price || !TransmissionType || !FuelType || !NumberOfDoors || !NumberOfSeats || !carImage) {
        return res.status(400).send('Please fill in all required fields and upload a valid image');
    }

    const query = `INSERT INTO cars (Brand, Model, Year, Color, Price, TransmissionType, FuelType, NumberOfDoors, NumberOfSeats, CarImage) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [Brand, Model, Year, Color, Price, TransmissionType, FuelType, NumberOfDoors, NumberOfSeats, carImage], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error inserting data');
        } else {
            res.status(201).send(`Car inserted with ID: ${result.insertId}`);
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).send('File size too large');
        } else {
            res.status(500).send('Internal server error');
        }
    } else if (err.message === 'Invalid file type') {
        res.status(400).send('Invalid file type');
    } else {
        res.status(500).send('Internal server error');
    }
});

app.listen(port, () => {
    console.log(`Server running on Port ${port}`);
});
