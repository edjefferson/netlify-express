'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const HTMLParser = require('node-html-parser');
const https = require('https')
const got = require('got');


const router = express.Router();

const getPlayerCount = async(id) => {

      try {
        let url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" + id + "&key=702C5A7D15512AE0477A5D60DC28A724"

         const response = await got(url, { json: true })
        return response.body.response.player_count
      } catch (error) {
        console.log(error.response.body);
      }
  }

  

router.post('/', (req, resmain) => {


  (async () => {
    let id = req.body.id

    let url = "https://store.steampowered.com/app/"+id+"/PowerWash_Simulator/"

    const res = await got(url, { json: false });
    const data = res.body

        
    try {
      const similar_text = data.split("{\"rgApps\":")[1].split(",\"rgPackages")[0]

    
      const root = HTMLParser.parse(data);
      const name = root.querySelector('#appHubAppName').rawText.trim()
      console.log(name)
        
      const review_summary = root.querySelector('.game_review_summary').rawText.trim()
      const release_date = root.querySelector('.release_date').querySelector('.date').rawText.trim()
      const developers = root.querySelectorAll('.dev_row')[0].querySelectorAll('a').map(x => x.rawText.trim())
      const publishers = root.querySelectorAll('.dev_row')[1].querySelectorAll('a').map(x => x.rawText.trim())
      const languages = root.querySelector('.game_language_options').querySelectorAll("tr").slice(1)
        .map( row => row.querySelector('td').rawText.trim())
      const tags =  JSON.parse("[{" + data.split("InitAppTagModal")[1].split("[{")[1].split("}],")[0] + "}]").map(x => x.name)
      
      const genres = root.querySelector('.details_block').querySelectorAll('a[href*="genre"]').map(x => x.rawText.trim())

      let similar_games =  similar_text.split("},\"").map(
        x =>  
          JSON.parse(
          "{" + x.split(':{').slice(1).join(':{').replace("}}","") +  "}"
          )
        
      )

      similar_games.map (x => {
        x["id"] = x["small_capsulev5"].split("/")[5]
        return x
      })
      resmain.writeHead(200, { 'Content-Type': 'application/json' });
      let playerCount
      await getPlayerCount(id).then(x=> playerCount = x)
      const payload = {
        similarGames: similar_games.slice(0, 9),
        id: id,
        name: name,
        reviewSummary: review_summary,
        releaseDate: release_date,
        developers: developers.join(", "),
        publishers: publishers.join(", "),
        languages: languages.join(", "),
        tags: tags.join(", "),
        genres: genres.join(", "),
        playerCount: playerCount
      }
  //        console.log(getSteamDb(id))

      resmain.write(
        JSON.stringify(payload)
      )
    } catch(e) {
      resmain.write(e.message);
      console.log("error")
      console.log(e.message)
      console.log(e.stack)


    }

    resmain.end();


  })();
})


router.get('/another', (req, res) => res.json({ route: req.originalUrl }));

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
