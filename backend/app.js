// express setup
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000;

// file upload setup
const fs = require('fs')
const multer = require('multer')
const upload = multer({dest: './temp/'})

// NFT file upload setup
const nft_storage = require('nft.storage')
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDNFNzUwQTA0MkZENDBCN2QwZjYzNzIwODlGOTU1NUE5QzMxRTc3ZjkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNDQ1OTUxNDYyMiwibmFtZSI6Im5mdGdhbl9zdGFnaW5nIn0.9B23zbY5szXHGWppHyUlr73nwms5qD7c_KMh3Ch33PU'
const client = new nft_storage.NFTStorage({ token: apiKey })

// Postgres connection
const pg = require('pg')
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: {
    //     rejectUnauthorized: false
    // }
})

// RESTful setup
app.use(express.urlencoded())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('Hello World')
})

app.get('/init', async (req, res) => {
    
    const db = await pool.connect()
    await db.query("CREATE TABLE IF NOT EXISTS nftrecord (url text, created_on timestamp)")
    
    res.json({'result': 'ok'})
    db.release()
})

app.get('/nft', async (req, res) => {

    try {
        const db = await pool.connect()
        const result = await db.query("SELECT * FROM nftrecord ORDER BY created_on DESC LIMIT 20")
        const results = { 'results': (result) ? result.rows : null};
        res.json(results)
        db.release()
    } catch(err) {
        res.json({"status": "error", "message": err})
    }
})

app.post('/nft', upload.single('nft_file'), (req, res) => {
    console.log(req.file)
    fs.readFile(req.file.path, async (err, data) => {
        if(err) {
            res.json({'status':501})
            return
        }

        // upload NFT
        const metadata = await client.store({
            name: 'First image',
            description: 'First image from NFTGan!',
            image: new nft_storage.File([data], req.file.originalname, { type: req.file.mimetype })
        })

        // construct NFT URL
        nft_url = "https://ipfs.io/ipfs/" + metadata.data.image.hostname + metadata.data.image.pathname

        // remove file
        fs.unlink(req.file.path, (err) => {
            if(err) console.error(err)
        }) 

        // save to db
        const db = await pool.connect()
        await db.query("INSERT INTO nftrecord VALUES ($1, now())", [nft_url])
        db.release()

        res.json({'status':200, 'nft_url': nft_url})
    })
    
})

app.listen(PORT, function() {
    console.log(`Our app is running on port ${ PORT }`)
})