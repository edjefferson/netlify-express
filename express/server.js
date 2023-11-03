'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const HTMLParser = require('node-html-parser');
const https = require('https')
const got = require('got');
const request = require('request');


const util = require('util');
const tough = require('tough-cookie');


const j = request.jar();
const cookie1 = request.cookie('wants_mature_content=1');
const cookie2 = request.cookie('mature_content=1');
const cookie3 = request.cookie('birthtime=439084801');
const cookie4 = request.cookie('lastagecheck=1-0-1984');

let steamUrl = "https://store.steampowered.com"
j.setCookie(cookie1, steamUrl);
j.setCookie(cookie2, steamUrl);
j.setCookie(cookie3, steamUrl);
j.setCookie(cookie4, steamUrl);


const router = express.Router();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getPlayerCount = async(id) => {

  try {
    let url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" + id + "&key=702C5A7D15512AE0477A5D60DC28A724"

      const response = await got(url, { json: true })

      if (response.body.response.player_count){
        return response.body.response.player_count
      } else {
        return ""
      }
  } catch (error) {
    //console.log(error.response.body);
  }
}

const getSteamSpy = async(id,type) => {
  let owners = ""
  let followers = ""
  let peakPlayers = ""
  let playtime2weeks = ""
  let playtimeTotal = ""

    try {
      let url = "https://steamspy.com/app/" + id
      //console.log(url)
      const response = await got(url, { json: false })
      const data = response.body
      const root = HTMLParser.parse(data);
      let text = root.querySelector("div.p-r-30").innerHTML
      owners = text.split("Owners</strong>:")[1].split("<br>")[0].trim().replace("&nbsp;..&nbsp;","-")
      owners = owners.replace(/,/g,"")
      owners = owners.split("Steam")[0].trim()

      followers = text.split("Followers</strong>:")[1].split("<br>")[0].trim().replace("&nbsp;..&nbsp;","-")
      followers = followers.replace(/,/g,"")

      peakPlayers = text.split("Peak concurrent players yesterday</strong>:")[1].split("<br>")[0].trim().replace("&nbsp;..&nbsp;","-")
      peakPlayers = peakPlayers.replace(/,/g,"")
      //console.log(text)
      
      try {

      
      playtime2weeks = text.split("Playtime in the last 2 weeks:</strong>")[1].split("<br>")[0].trim()
    } catch (error) {
      playtime2weeks = ""
    }
    playtimeTotal = text.split("Playtime total:</strong>")[1].split("<br>")[0].trim()

      
  } catch (error) {
      //console.log(error);
    }
  
  return {
    owners: owners,
    followers: followers,
    peakPlayers: peakPlayers,
    playtime2weeks: playtime2weeks,
    playtimeTotal: playtimeTotal
  }
}

const getSteamSpyApi = async(id,type) => {
  let owners = ""
  let followers = ""
  let peakPlayers = ""
  let playtime2weeks = ""
  let playtimeTotal = ""

    try {
      let url = "https://steamspy.com/api.php?request=appdetails&appid=" + id
      const response = await got(url, { json: true })
      console.log(response)
      const data = response.body

      owners = data.owners
      owners = owners.replaceAll(",","")
      owners = owners.replace("..","-")

      followers = ""
      followers = followers.replace(/,/g,"")

      peakPlayers = data.ccu
      //console.log(text)
      
      
    let avplaytime2weeks = "" + Math.floor(data.average_2weeks/60) + ":"  + (data.average_2weeks % 60).toString().padStart(2, "0")

    let avplaytimeTotal = "" + Math.floor(data.average_forever/60) + ":" + (data.average_forever % 60).toString().padStart(2, "0")
    
    let medplaytime2weeks = "" + Math.floor(data.median_2weeks/60) + ":"  + (data.median_2weeks % 60).toString().padStart(2, "0")

    let medplaytimeTotal = "" + Math.floor(data.median_forever/60) + ":" + (data.median_forever % 60).toString().padStart(2, "0")

    playtime2weeks = avplaytime2weeks + " (average) " + medplaytime2weeks + " (median)"
    playtimeTotal = avplaytimeTotal + " (average) " + medplaytimeTotal + " (median)"
      
  } catch (error) {
      //console.log(error);
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
  let id

  let payload
  let retries
  let similar_games
  let similar_games_ts
  let similar_games_nr
  let similar_games_ur

  (async () => {
    let headersent = false
    retries = 0
    id = req.body.id
    let url = "https://store.steampowered.com/recommended/morelike/app/"+id+"/"
    if (req.body.first) {
      console.log("")
      const simres = await got(url, { json: false });
      const simdata = simres.body
      const simroot = HTMLParser.parse(simdata);

      similar_games = Array.from(simroot.querySelector("div#released").querySelectorAll('.similar_grid_capsule')).map(s => {
        return s.getAttribute("data-ds-appid")
      })

      similar_games_ts = Array.from(simroot.querySelector("div#topselling").querySelectorAll('.similar_grid_capsule')).map(s => {
        return s.getAttribute("data-ds-appid")
      })

      similar_games_nr = Array.from(simroot.querySelector("div#newreleases").querySelectorAll('.similar_grid_capsule')).map(s => {
        return s.getAttribute("data-ds-appid")
      })

      similar_games_ur = Array.from(simroot.querySelector("div#comingsoon").querySelectorAll('.similar_grid_capsule')).map(s => {
        return s.getAttribute("data-ds-appid")
      })

    }
    while (payload === undefined && retries < 1) {
      try {
        //console.log(id)

        let url = "https://store.steampowered.com/app/"+id+"/?cc=uk"
        //console.log(url)
        await request({url: url, jar: j}, async function (error, response, body) {
          //console.error('error:', error); // Print the error if one occurred

          const data = body
          const root = HTMLParser.parse(data);
          
  

          
          

          //console.log("egg")

          const name = root.querySelector('#appHubAppName').rawText.trim()
          //console.log(name)
          let review_summary = ""
          try {
            review_summary = root.querySelector('.game_review_summary').rawText.trim()
   
          } catch (e) {

          }
          const release_date = root.querySelector('.release_date').querySelector('.date').rawText.trim()
          const developers = root.querySelectorAll('.dev_row')[0].querySelectorAll('a').map(x => x.rawText.trim())
          const publishers = root.querySelectorAll('.dev_row')[1].querySelectorAll('a').map(x => x.rawText.trim())
          const languages = root.querySelector('.game_language_options').querySelectorAll("tr").slice(1)
            .map( row => row.querySelector('td').rawText.trim())
          let tags = []
          try {
           tags =  JSON.parse("[{" + data.split("InitAppTagModal")[1].split("[{")[1].split("}],")[0] + "}]").map(x => x.name)
          } catch (e) {

          }
          
          const genres = root.querySelector('.details_block').querySelectorAll('a[href*="genre"]').map(x => x.rawText.trim())
          
          let reviews = ["review_type_all","review_type_positive","review_type_negative"].map(r => {
              if (root.querySelector("label[for=\""+r+"\"]") && root.querySelector("label[for=\""+r+"\"]").querySelector('span')) {
                return root.querySelector("label[for=\""+r+"\"]").querySelector('span').rawText.trim().slice(1).slice(0, -1).replace(",", '' )
              } else {
                return ""
              }
            }
          )
          let metascore = ""
          
          if (root.querySelector('#game_area_metascore')) metascore = root.querySelector('#game_area_metascore').querySelector('.score').rawText.trim()

          let purchaseActions = root.querySelectorAll('.game_purchase_action_bg')
          let purchaseAction = purchaseActions.filter( p => p.querySelector(".discount_original_price") || p.querySelector(".game_purchase_price"))[0]

          let discountedPrice = ""
          let originalPrice = ""

          if (purchaseAction && purchaseAction.querySelector(".discount_original_price")) {
            discountedPrice = purchaseAction.querySelector(".discount_final_price").rawText.trim()
            originalPrice = purchaseAction.querySelector(".discount_original_price").rawText.trim()
          }
          else if (purchaseAction) {
            discountedPrice = purchaseAction.querySelector(".game_purchase_price").rawText.trim()
            originalPrice = purchaseAction.querySelector(".game_purchase_price").rawText.trim()
          }
          
          

          let playerCount = ""
          await getPlayerCount(id).then(x=> playerCount = x)



        
          
          payload = {
            similarGames: similar_games,
            similarGamesTS: similar_games_ts,
            similarGamesNR: similar_games_nr,
            similarGamesUR: similar_games_ur,
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
            playerCount: playerCount ? playerCount : "",
            reviewSummary: review_summary,

            allReviews: reviews[0],
            positiveReviews: reviews[1],
            negativeReviews: reviews[2],
            metascore: metascore

          }
          //console.log(payload)
      //        console.log(getSteamDb(id))
          
          await getSteamSpyApi(id,req.body.type).then(x=> {

            Object.keys(x).forEach( (d, i) => {
              payload[d] = x[d]
            })
          })
 
      
        //  console.log(payload)
          
          if (headersent === false) {
            resmain.writeHead(200, { 'Content-Type': 'application/json' })
            headersent = true
          }
          resmain.write(
            JSON.stringify(payload)
          )
          resmain.end();
        });
              

        
        
      } catch(e) {
        //console.log("error")
        //console.log(e.message)
        //console.log(e.stack)
        retries += 1

      }
      await sleep(1000);
    }

    


  })();
})



router.get('/another', (req, res) => res.json({ route: req.originalUrl }));

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
