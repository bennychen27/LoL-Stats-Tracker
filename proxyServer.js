/*
Proxy server used to facilitate our API call requests so our user won't be able to access the private Riot API KEY. User calls proxy server with API request -> API key is stored
on proxy server, not the front end -> call Riot API with API KEY.
Axios is used to handle the request to the API and show the data to the user.
*/

var express = require('express');
var cors = require('cors');
const axios = require('axios');
var app = express();
app.use(cors());
app.use(express.static('public'));

const API_KEY = 'RGAPI-d1ce0e52-5b91-4682-9d82-ad2dcacf127a'; //riot api's personal use key, resets every 24hr

//takes a string name and string region as parameters, makes an api call for specific region and name and returns the summoner's puuid
function getPlayerPUUID(playerName, region){
    return axios.get('https://' + region + '.api.riotgames.com' + '/lol/summoner/v4/summoners/by-name/' + playerName + '?api_key=' + API_KEY)
        .then(response => {
            return response.data.puuid
        }).catch (err => err);
}

//takes a string name and string region as parameters, makes an api call for specific region and name and returns the summoner's id
function getSummonerId(playerName, region){
    return axios.get('https://' + region + '.api.riotgames.com' + '/lol/summoner/v4/summoners/by-name/' + playerName + '?api_key=' + API_KEY)
        .then(response => {
            return response.data.id
        }).catch (err => err);
}

//GET pastGames
//localhost:4000/pastGames
//makes an api call using async request/response to get summoner puuid, fetches game list for summoner and pushes them into a list. return the list in json format
app.get('/pastGames', async(request, response) => {
    const playerName = request.query.username;
    const start = request.query.start;
    const region = request.query.region;
    function platformToRegion(region){
        if (region === 'na1' || region === 'la1' || region === 'la2' || region === 'br1'){
            return 'americas';
        }
        else if (region === 'euw1' || region === 'eun1' || region === 'ru'){
            return 'europe';
        }
        else if (region === 'kr' || region === 'jp1'){
            return 'asia';
        }
        else{
            return 'sea';
        }
    }
    //PUUID
    const PUUID = await getPlayerPUUID(playerName, region);
    const API_CALL = 'https://' + platformToRegion(region) + '.api.riotgames.com' + '/lol/match/v5/matches/by-puuid/' + PUUID + '/ids?start=' + start + '&' + 'api_key=' + API_KEY;
    //get API_CALL, gives us a list of game IDs, (default 20 game IDs as per riot api's max limit)
    const gameIDs = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(err => err);
    //then loop through game IDs. At each loop, get the information based off ID (API CALL)
    var matchDataList = [];
    for (var i = 0; i < gameIDs.length - 10; i++){
        const matchID = gameIDs[i];
        const matchData = await axios.get('https://' + platformToRegion(region) + '.api.riotgames.com' + '/lol/match/v5/matches/' + matchID + '?api_key=' + API_KEY)
            .then(response => response.data)
            .catch(err => err)
        matchDataList.push(matchData);
    }
    //save information from above in an array, and give array as JSON response to user (i.e. [game1Object, game2Object, etc..])
    response.json(matchDataList);
});

//GET matchTimeline
//localhost:4000/matchTimeline
//makes an api call using async request/response to get summoner puuid, fetches match timeline for each game and pushes them into a list. return the list in json format
app.get('/matchTimeline', async(request, response) => {
    const playerName = request.query.username;
    const start = request.query.start;
    const region = request.query.region;
    function platformToRegion(region){
        if (region === 'na1' || region === 'la1' || region === 'la2' || region === 'br1'){
            return 'americas';
        }
        else if (region === 'euw1' || region === 'eun1' || region === 'ru'){
            return 'europe';
        }
        else if (region === 'kr' || region === 'jp1'){
            return 'asia';
        }
        else{
            return 'sea';
        }
    }
    //PUUID
    const PUUID = await getPlayerPUUID(playerName, region);
    const API_CALL = 'https://' + platformToRegion(region) + '.api.riotgames.com' + '/lol/match/v5/matches/by-puuid/' + PUUID + '/ids?start=' + start + '&' + 'api_key=' + API_KEY;
    //get API_CALL, gives us a list of game IDs, (default 20 game IDs as per riot api's max limit)
    const gameIDs = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(err => err);
    //then loop through game IDs. At each loop, get the information based off ID (API CALL)
    var matchTimelineDataList = [];
    for (var i = 0; i < gameIDs.length - 10; i++){
        const matchID = gameIDs[i];
        const matchTimelineData = await axios.get('https://' + platformToRegion(region) + '.api.riotgames.com' + '/lol/match/v5/matches/' + matchID + '/timeline?api_key=' + API_KEY)
            .then(response => response.data)
            .catch(err => err)
        matchTimelineDataList.push(matchTimelineData);
    }
    //save information from above in an array, and give array as JSON response to user (i.e. [game1Object, game2Object, etc..])
    response.json(matchTimelineDataList);
});

//GET summoner rank
//localhost:4000/summonerRank
//makes an api call using async request/response to get summoner id, fetches summoner rank data and returns the data in json format
app.get('/summonerRank', async(request, response) => {
    const playerName = request.query.username;
    const region = request.query.region;
    const summonerId = await getSummonerId(playerName, region);
    const API_CALL = 'https://' + region + '.api.riotgames.com/lol/league/v4/entries/by-summoner/' + summonerId + '?api_key=' + API_KEY;
    const summonerRank = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(err => err);
    response.json(summonerRank);
});

//GET summoner info
//localhost:4000/summonerInfo
//makes an api call using async request/response to get summoner id, fetches summonr info and returns the data in json format
app.get('/summonerInfo', async(request, response) => {
    const playerName = request.query.username;
    const region = request.query.region;
    const summonerId = await getSummonerId(playerName, region);
    const API_CALL = 'https://' + region + '.api.riotgames.com/lol/summoner/v4/summoners/' + summonerId + '?api_key=' + API_KEY;
    const summonerInfo = await axios.get(API_CALL)
        .then(response => response.data)
        .catch(err => err);
    response.json(summonerInfo);
});

app.listen(4000, function(){
    console.log('Server started on port 4000')
});