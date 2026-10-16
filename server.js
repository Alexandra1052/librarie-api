const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

app.use(express.json());


const db = new sqlite3.Database('./librarie.db', (err) => {
    if (err) {
        console.error("Eroare la conectarea cu SQLite:", err.message);
    } else {
        console.log("Conectat la baza de date SQLite.");
    }
});

db.run(`CREATE TABLE IF NOT EXISTS carti(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titlu TEXT NOT NULL,
    autor TEXT NOT NULL,
    pret REAL NOT NULL
)`,
    (err) => {
        if (!err) {
           db.get("SELECT COUNT(*) AS count FROM carti", (err, row) => { // numaram cate carti exista 
              if (row.count === 0) { // inseram carti doar daca nu exista deja in baza de date
                db.run(`INSERT INTO carti (titlu, autor, pret) VALUES 
                    ('Moara cu noroc', 'Ioan Slavici', 25),
                    ('Ion', 'Liviu Rebreanu', 45),
                    ('Baltagul', 'Mihail Sadoveanu', 30)
                `);
            }
    }
); }} );


app.get('/carti', (req, res) => {
    const pretMax= req.query.pretMax;
    let query = "SELECT * FROM carti";
    let params = [];

    if(pretMax) {   
        query += " WHERE pret <= ?";
        params.push(Number(pretMax)); //modific query daca am pret 
    }
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows); // afisez cartile in functie de pretul maxim daca am dat query sau toate cartile daca nu am dat query

        }
    });
});


//afiseaza o carte dupa id
app.get('/carti/:id', (req, res) => {
    const id = req.params.id;
    const query = "SELECT * FROM carti WHERE id = ?";

    db.get(query, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });   
        } else if (!row) {
            res.status(404).json({ error: "Cartea nu a fost gasita" });
        } else {  res.json(row); }
    }); 
});


    const verificaApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== 'secret123') {
        return res.status(401).json({ eroare: "Neautorizat! Lipsește sau e greșit X-API-KEY." });
    }

    next();
};


app.post('/carti', verificaApiKey, (req,res)=>{
    const {titlu , autor, pret} = req.body;
    if(!titlu || !autor || pret == undefined){
        return res.status(400).json({ eroare : "Lipseste titlul , autorul sau pretul"} );
    }

    const query = "INSERT INTO carti (titlu,autor,pret) VALUES (?,?,?) ";

    db.run(query, [titlu,autor,Number(pret)], function(err){
        if(err){
            return res.status(500).json({eroare:err.message});
        }
        const carteNoua = {
            id: this.lastID,
            titlu,
            autor,
            pret: Number(pret)
        };
        res.status(201).json(carteNoua);
    })
})

app.delete('/carti/:id', verificaApiKey, (req, res) => {
    const id = Number(req.params.id);
    const query = "DELETE FROM carti WHERE id = ?";

    if (!id || isNaN(id)) {
        return res.status(400).json({ eroare: "Lipsește sau este invalid ID-ul!" });
    }

    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ eroare: err.message });
        }

        // Verificăm dacă SQLite chiar a șters ceva (this.changes ne spune câte rânduri au fost afectate)
        if (this.changes === 0) {
            return res.status(404).json({ eroare: "Cartea nu a fost găsită!" });
        }

        res.json({ mesaj: "Cartea a fost ștearsă cu succes" });
    });
});

app.listen(PORT, ()=>{
    console.log(`serverul ruleaza pe http://localhost:${PORT}`);
})