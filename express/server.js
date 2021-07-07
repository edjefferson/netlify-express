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

const getSteamSpy = async(id) => {
  let owners = ""
  let followers = ""
  let peakPlayers = ""
  let playtime2weeks = ""
  let playtimeTotal = ""

  try {
    let url = "https://steamspy.com/app/" + id

    const response = await got(url, { json: false })
    const data = response.body
    const root = HTMLParser.parse(data);
    let text = root.querySelector("div.p-r-30").rawText

    owners = text.split("Owners:")[1].split("Followers")[0].trim().replace("&nbsp;..&nbsp;","-")
    owners = owners.replace(/,/g,"")
    owners = owners.split("Steam")[0].trim()

    followers = text.split("Followers:")[1].split("Peak")[0].trim().replace("&nbsp;..&nbsp;","-")
    followers = followers.replace(/,/g,"")

    peakPlayers = text.split("Peak concurrent players yesterday:")[1].split("YouTube")[0].trim().replace("&nbsp;..&nbsp;","-")
    peakPlayers = peakPlayers.replace(/,/g,"")

    playtime2weeks = text.split("Playtime in the last 2 weeks:")[1].split("Playtime")[0].trim()
    playtimeTotal = text.split("Playtime total:")[1].split("Steam")[0].trim()

    
  } catch (error) {
    console.log(error);
    
  }
  return {
    owners: owners,
    followers: followers,
    peakPlayers: peakPlayers,
    playtime2weeks: playtime2weeks,
    playtimeTotal: playtimeTotal
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
      console.log(id)
      const review_summary = root.querySelector('.game_review_summary').rawText.trim()
      const release_date = root.querySelector('.release_date').querySelector('.date').rawText.trim()
      const developers = root.querySelectorAll('.dev_row')[0].querySelectorAll('a').map(x => x.rawText.trim())
      const publishers = root.querySelectorAll('.dev_row')[1].querySelectorAll('a').map(x => x.rawText.trim())
      const languages = root.querySelector('.game_language_options').querySelectorAll("tr").slice(1)
        .map( row => row.querySelector('td').rawText.trim())
      const tags =  JSON.parse("[{" + data.split("InitAppTagModal")[1].split("[{")[1].split("}],")[0] + "}]").map(x => x.name)
      
      const genres = root.querySelector('.details_block').querySelectorAll('a[href*="genre"]').map(x => x.rawText.trim())
      

      let reviews = ["review_type_all","review_type_positive","review_type_negative"].map(r => {
          if (root.querySelector("label[for=\""+r+"\"]").querySelector('span')) {
            return root.querySelector("label[for=\""+r+"\"]").querySelector('span').rawText.trim().slice(1).slice(0, -1).replace(",", '' )
          } else {
            return undefined
          }
        }
      )
      let metascore = ""
      
      if (root.querySelector('#game_area_metascore')) metascore = root.querySelector('#game_area_metascore').querySelector('.score').rawText.trim()

      let purchaseActions = root.querySelectorAll('.game_purchase_action_bg')
      let purchaseAction = purchaseActions.filter( p => p.querySelector(".discount_original_price") || p.querySelector(".game_purchase_price"))[0]

      let discountedPrice 
      let originalPrice

      if (purchaseAction.querySelector(".discount_original_price")) {
        discountedPrice = purchaseAction.querySelector(".discount_final_price").rawText.trim()
        originalPrice = purchaseAction.querySelector(".discount_original_price").rawText.trim()
      }
      else {
        discountedPrice = purchaseAction.querySelector(".game_purchase_price").rawText.trim()
        originalPrice = purchaseAction.querySelector(".game_purchase_price").rawText.trim()
      }
      
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

      let playerCount
      await getPlayerCount(id).then(x=> playerCount = x)



    
      
      let payload = {
        similarGames: similar_games.slice(0, 9),
        id: id,
        name: name,
        releaseDate: release_date.replace(",",""),
        discountedPrice: discountedPrice,
        originalPrice: originalPrice,
        developers: developers.join(";"),
        publishers: publishers.join(";"),
        languages: languages.join(";"),
        tags: tags.join(";"),
        genres: genres.join(";"),
        playerCount: playerCount,
        reviewSummary: review_summary,

        allReviews: reviews[0],
        positiveReviews: reviews[1],
        negativeReviews: reviews[2],
        metascore: metascore

      }
  //        console.log(getSteamDb(id))
      await getSteamSpy(id).then(x=> {

        Object.keys(x).forEach( (d, i) => {
          payload[d] = x[d]
        })
      })

      resmain.writeHead(200, { 'Content-Type': 'application/json' });
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
