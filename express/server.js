'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const HTMLParser = require('node-html-parser');

const router = express.Router();



router.get('/', (req, resmain) => {
  resmain.writeHead(200, { 'Content-Type': 'text/html' });
  console.log("egg")
  
  const https = require('https')
  var url = "https://store.steampowered.com/app/"+1290000+"/PowerWash_Simulator/"
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
        resmain.write(
          
          JSON.stringify(similar_games)
        
        )
      
      } catch(e) {
        resmain.write(e.message);

      }

      resmain.end();


    })
  }).on('error', err => {
    console.log(err.message);
  }).end()

});



app.use('/', router);  // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
