// express setup
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000;

// file upload setup
const fs = require('fs')
const multer = require('multer')
const upload = multer({dest: './temp/'})

// NFT file upload setup
// import { NFTStorage, File } from 'nft.storage'
const nft_storage = require('nft.storage')
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDNFNzUwQTA0MkZENDBCN2QwZjYzNzIwODlGOTU1NUE5QzMxRTc3ZjkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNDQ1OTUxNDYyMiwibmFtZSI6Im5mdGdhbl9zdGFnaW5nIn0.9B23zbY5szXHGWppHyUlr73nwms5qD7c_KMh3Ch33PU'
const client = new nft_storage.NFTStorage({ token: apiKey })

// RESTful setup
app.use(express.urlencoded())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('Hello World')
})

app.get('/list', (req, res) => {
    let response = {"header": "list", 
                    "body": "list of all IDs"}

    res.json(response)
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

        // console.log(metadata.embed())
        // console.log(metadata.data.image)
        console.log("https://ipfs.io/ipfs/" + metadata.data.image.hostname + metadata.data.image.pathname)

        fs.unlink(req.file.path, (err) => {
            if(err) console.error(err)
        }) // remove file
        res.json({'status':200, 'metadata': metadata})
    })
    
})

app.listen(PORT, function() {
    console.log(`Our app is running on port ${ PORT }`)
})