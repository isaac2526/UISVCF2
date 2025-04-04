const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serves frontend files

// Database setup
const db = new sqlite3.Database('./contacts.db', (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to the database.");
});

db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL
)`);

// API route to add contact
app.post('/add-contact', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Name and phone required" });

    const sql = `INSERT INTO contacts (name, phone) VALUES (?, ?)`;
    db.run(sql, [name, phone], function (err) {
        if (err) return res.status(400).json({ error: "Number already exists" });
        res.json({ message: "Contact added successfully", id: this.lastID });
    });
});

// API route to generate VCF file
app.get('/generate-vcf', (req, res) => {
    db.all(`SELECT * FROM contacts`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let vcfContent = "";
        rows.forEach(row => {
            vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${row.name}\nTEL:${row.phone}\nEND:VCARD\n`;
        });

        const filePath = './public/contacts.vcf';
        fs.writeFileSync(filePath, vcfContent);
        res.download(filePath, 'UI_VCF_Contacts.vcf');
    });
});

// Home Route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});