'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const HTMLParser = require('node-html-parser');




app.get('/', (req, resmain) => {
  resmain.writeHead(200, { 'Content-Type': 'text/html' });
  const steam_id = req.query.steamId
  console.log("egg")

  console.log(req.query.steamId)
  const https = require('https')
  var url = "https://store.steampowered.com/app/"+steam_id+"/PowerWash_Simulator/"
  https.get(url, res => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      
      try {
        var similar_text = data.split("{\"rgApps\":")[1].split(",\"rgPackages")[0]

      
      var root = HTMLParser.parse(data);
      console.log(root.querySelector('.game_review_summary').rawText.trim())
      console.log(root.querySelector('.release_date').rawText.trim())
      console.log(root.querySelector('#developerList').rawText.trim())
      console.log(root.querySelector('#publisherList').rawText.trim())
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


module.exports = app;
module.exports.handler = serverless(app);
