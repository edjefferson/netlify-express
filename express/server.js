'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const HTMLParser = require('node-html-parser');

const router = express.Router();



router.get('/', (req, resmain) => {
  var parts = req.headers.referer.split("/")
  var id = parts[parts.length - 1]

  console.log(id)

  const https = require('https')
  var url = "https://store.steampowered.com/app/"+id+"/PowerWash_Simulator/"
  https.get(url, res => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      
      try {
        var similar_text = data.split("{\"rgApps\":")[1].split(",\"rgPackages")[0]

      
      var root = HTMLParser.parse(data);
      console.log(root.querySelector('.game_review_summary').rawText)
      console.log(root.querySelector('.release_date').rawText)
      console.log(root.querySelector('#developerList').rawText)
      console.log(root.querySelector('#publisherList').rawText)
        var similar_games =  similar_text.split("},\"").map(
          x =>  JSON.parse(
            "{" + x.split(':{').slice(1).join(':{').replace("}}","") +  "}"
            
            )
        )

        similar_games.map (x => {
          x["id"] = x["small_capsulev5"].split("/")[5]
          return x
        })
        console.log(req.headers.referer) 
        resmain.writeHead(200, { 'Content-Type': 'application/json' });

        resmain.write(
          JSON.stringify(similar_games))
      
      } catch(e) {
        resmain.write(e.message);

      }

      resmain.end();


    })
  }).on('error', err => {
    console.log(err.message);
  }).end()

});

router.get('/another', (req, res) => res.json({ route: req.originalUrl }));
router.post('/', (req, res) => res.json({ postBody: req.body }));

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
