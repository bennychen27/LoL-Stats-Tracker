/*
Main driver: Allows user to select a region and search for a summoner. If summoner in that region exists, receive data from API and displays their profile, match history, rank data.
Profile data - icon, level, rank for each game mode, displays their most played champion as background image. 
Match history - outcome, date played, patch version, game mode. Each game displays the summoner's items, champion, level, runes, summoner spells, kill-death-assists, wards, cs, and all participants.
Game data - split into 4 subcategories: Overview, Analysis, Build, Graph
  Overview - in addition to data mentioned in match history, also includes gold
  Analysis - shows damage dealt for each subcategory of damage, total shielding/healing, vision score, turret data, skillshots hit/dodged
  Build - displays the runes, skill, and item path for selected summoner
  Graph - line chart that tracks the gold, xp, cs, and damage dealt for selected summoners over the entire game
*/

import { useState } from 'react';
import axios from 'axios';
import './App.css';
import './profile.css';
import './main-container.css';
import './second-container.css';
import './third-container.css';
import {
  getSummonerSpell, getSummonerRunes, getKillingSpree, getGameMode, getQueueType, getDivision,
  precisionRuneTree, dominationRuneTree, sorceryRuneTree, inspirationRuneTree, resolveRuneTree, statRuneTree,
  ddragonPath, profileIcons, summonerIcons, summonerRunes, summonerRunesStats, championIcons, championSkins,
  summonerColors, regions, COLORS
} from './convertGameInfo';
import moment from 'moment';
import BarLoader from 'react-spinners/BarLoader'; //npm package for page loader
import Select from 'react-select'; //npm package for dropdown to select the region
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'; //library used to create graph charts

function App() {
  //react hooks
  const [loading, setLoading] = useState(false);
  const [toggleMatch, setToggleMatch] = useState([]);
  const [toggleMatchInsight, setToggleMatchInsight] = useState([true, false, false, false]);
  const [toggleSummonerBuild, setToggleSummonerBuild] = useState([false, false, false, false, false, false, false, false, false, false]); //index for each summoner
  const [toggleSummonerGraph, setToggleSummonerGraph] = useState([false, false, false, false, false, false, false, false, false, false]); //index for each summoner
  const [toggleGraphs, setToggleGraphs] = useState([true, false, false, false])
  const [searchText, setSearchText] = useState(''); //search up summoner
  const [region, setRegion] = useState({ value: 'na1', label: 'North America' }); //default region set to NA
  const [summonerRank, setSummonerRank] = useState([]);
  const [summonerInfo, setSummonerInfo] = useState([]);
  const [gameList, setGameList] = useState([]);
  const [matchTimeline, setMatchTimeline] = useState([]);
  const [matchData, setMatchData] = useState([{}])
  const [counter, setCounter] = useState(10);
  const [championCounter, setChampionCounter] = useState([]);
  const [backgroundDisplayCounter, setBackgroundDisplayCounter] = useState(Math.floor(Math.random() * (12 - 1) + 1)); 

  //more games loaded, increase counter for champions
  const updateChampionCounter = () => {
    setCounter(counter + 10);
  }

  //generates random number between 1-12
  const updateBackgroundDisplayCounter = () => {
    setBackgroundDisplayCounter(Math.floor(Math.random() * (12 - 1) + 1));
  }

  //get match data for all frames from a specific game
  const getMatchData = (gameIndex) => {
    setMatchData([]);
    setMatchData(matchTimeline[gameIndex].info.frames);
  };

  //new summoner searched, reset to initial states
  const resetSummoner = () => {
    setGameList([]);
    setMatchTimeline([]);
    setCounter(5);
    setBackgroundDisplayCounter(Math.floor(Math.random() * (12 - 1) + 1));
    Object.keys(championCounter).map((champion, b) => {
      delete championCounter[champion];
    })
  }

  //toggle everything back to default whenever user clicks on another game's data
  const toggleMatchClick = (index) => {
    setToggleMatch(prevState => prevState.map((item, idx) => idx === index ? !item : false));
    setToggleMatchInsight([true, false, false, false]);
    setToggleSummonerGraph(prevState => prevState.map((item, idx) => false));
  };

  //toggle for overview - analysis - build - graphs
  const toggleMatchInsightClick = (index) => {
    setToggleMatchInsight(prevState => prevState.map((item, idx) => idx === index ? true : false));
    setToggleSummonerGraph(prevState => prevState.map((item, idx) => false));
  };

  //toggle for summoner that user selects
  const toggleSummonerBuildClick = (index) => {
    setToggleSummonerBuild(prevState => prevState.map((item, idx) => idx === index ? true : false));
  };

  //toggle for summoner that user selects, user can select 0 up to all 10 participants
  const toggleSummonerGraphClick = (index) => {
    setToggleSummonerGraph(prevState => prevState.map((item, idx) => idx === index ? !item : item));
  };

  //toggle for gold earned - xp gained - minions killed - damage dealt
  const toggleGraphsClick = (index) => {
    setToggleGraphs(prevState => prevState.map((item, idx) => idx === index ? true : false));
  };

  //calls summonerRank function from proxy server passing searchText and region (i.e. na1) as parameters, takes response and sets the summoners rank
  function getSummonerRank() {
    axios.get('http://localhost:4000/summonerRank', { params: { username: searchText, region: region.value } })
      .then(function (response) {
        setSummonerRank(response.data);
      }).catch(function (error) {
        console.log(error);
      })
  }

  //calls the summonerInfo function from proxy server passing searchText and region (i.e. na1) as parameters, takes response and sets the summoners info
  function getSummonerInfo() {
    axios.get('http://localhost:4000/summonerInfo', { params: { username: searchText, region: region.value } })
      .then(function (response) {
        setSummonerInfo(response.data);
      }).catch(function (error) {
        console.log(error);
      })
  }

  //calls the pastGames function from proxy server passing searchText, index (where to start for summoner's entire game history), and region (i.e. na1) as parameters, takes response and adds the new games
  //to the summoners game list, resets toggleMatch, and increments the champion's counter based on what champion the summoner played in that game
  function getPlayerGames(index) {
    axios.get('http://localhost:4000/pastGames', { params: { username: searchText, start: index, region: region.value } })
      .then(function (response) {
        response.data.map((game, gameIndex) => {
          setGameList(prevstate => [...prevstate, game]);
          setToggleMatch(prevstate => [...prevstate, false]);
          for (let i = 0; i < game.info.participants.length; i++) {
            if (decodeURI(game.info.participants[i].summonerName.toLowerCase()).replace(' ', '') === decodeURI(searchText.toLowerCase()).replace(' ', '')) {
              if (championCounter[game.info.participants[i].championId]) {
                championCounter[game.info.participants[i].championId]++;
              }
              else {
                championCounter[game.info.participants[i].championId] = 1
              }
              setChampionCounter({ ...championCounter });
              getMaxChampionCounter();
              break;
            }
          }
        })
      }).catch(function (error) {
        console.log(error);
      })
  }

  //calls the matchTimeline function from proxy server passing searchText, index (where to start for summoner's entire game history), and region (i.e. na1) as parameters, takes response and adds the new
  //match timelines to the summoners match timeline list. while data is being fetched, flips setLoading to true (displays the loading state) and back to false when data is fetched
  function getMatchTimeline(index) {
    setLoading(true);
    axios.get('http://localhost:4000/matchTimeline', { params: { username: searchText, start: index, region: region.value } })
      .then(function (response) {
        response.data.map((game, gameIndex) => {
          setMatchTimeline(prevstate => [...prevstate, game])
        })
        setLoading(false);
      }).catch(function (error) {
        console.log(error);
      })
  }

  //returns the name of the champion that has the highest counter
  function getMaxChampionCounter() {
    const maxValue = Object.entries(championCounter).sort((x, y) => y[1] - x[1])[0];
    return maxValue[0];
  }

  return (
    <div className="App">
      <div className='search'>
        <h2 className='title'>LoL Stats Tracker</h2>
        <div className='input'>
          <Select className='region-selector' defaultValue={regions[0]} options={regions} onChange={setRegion} /> 
          <input className='text' type='text' onChange={e => setSearchText(e.target.value)} onKeyPress={(e) => {
            if (e.key === "Enter") { updateBackgroundDisplayCounter(); getSummonerInfo(); getSummonerRank(); resetSummoner(); getPlayerGames(0); getMatchTimeline(0); }}}>
          </input>
          <button className='button' type='submit' onClick={() => {updateBackgroundDisplayCounter(); getSummonerInfo(); getSummonerRank();
            resetSummoner(); getPlayerGames(0); getMatchTimeline(0);}}>Search
          </button>
        </div>
      </div>
      {loading ?
        <div className='loader'><BarLoader loading={loading} color={COLORS.gold} width={'fit-content'} /></div>
        :
        <>
          {Object.keys(summonerInfo).length !== 0 && decodeURI(summonerInfo.name.toLowerCase()).replace(' ', '') === decodeURI(searchText.toLowerCase()).replace(' ', '') ?
            <>
              <div className='bg-image' style={{ backgroundImage: `url(${championSkins}/${getMaxChampionCounter()}/${getMaxChampionCounter() * 1000}.jpg)` }}>
                <div className='profile-name'>{summonerInfo.name}</div>
                <div className='profile'>
                  <div>
                    <img className='profile-icon' src={`${profileIcons}${summonerInfo.profileIconId}.jpg`}
                      width='125' height='125'></img>
                    <div className='profile-level'>Level {summonerInfo.summonerLevel}</div>
                  </div>
                  {summonerRank.map((rankedMode, index) =>
                    <>
                      <div className='rank-border'>
                        <img src={`/ranked-borders/${(rankedMode.tier).toLowerCase()}.png`} width='104' height='104'></img>
                      </div>
                      <div className='rank-info'>
                        <div className='queue-type'>
                          {getQueueType[rankedMode.queueType]}
                        </div>
                        <div className='tier-info'>
                          <div className='tier-rank'>{(rankedMode.tier).charAt(0).toUpperCase() + ((rankedMode.tier).slice(1).toLowerCase())
                          } {getDivision[rankedMode.rank]} {rankedMode.leaguePoints} LP
                          </div>
                          <div className='win-loss-ratio'>{rankedMode.wins}W / {rankedMode.losses}L</div>
                          <div className='win-loss-percentage'>Win Rate {(100 * rankedMode.wins / (rankedMode.wins + rankedMode.losses)).toFixed(2)}%</div>
                          <div style={{ marginTop: '1rem' }}>
                            {rankedMode.miniSeries != null ?
                              <>
                                <div className='series-text'>Series in Progress</div>
                                <div className='series-games'>
                                  {(rankedMode.miniSeries.progress.split('')).map((progress, index) =>
                                    <>
                                      <span>{progress == 'W' ? <text className='series-game-win'>{progress}</text>
                                        : progress == 'L' ? <text className='series-game-loss'>{progress}</text>
                                          : <text className='series-game-blank'>&nbsp;</text>}</span>
                                    </>
                                  )}
                                </div>
                              </>
                              :
                              <>
                              </>
                            }
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {gameList.map((gameData, index) => 
                  <>
                    {gameData.info.participants.map((data, participantIndex) => 
                      <>
                        {decodeURI(data.summonerName.toLowerCase()).replace(' ', '') === decodeURI(searchText.toLowerCase()).replace(' ', '') ?
                          <>
                            <div className='game-number'>Game {index + 1}</div>
                            <div className='main-container'>
                              <div className='game'>
                                <div className='game-mode'>{getGameMode(gameData.info.queueId)}</div>
                                <div className='time-stamp'>{moment(gameData.info.gameCreation).fromNow()}</div>
                                <div className='result'>{data.win === true ? <div className='win'><p className='result-win'>Victory</p></div> :
                                  <div className='lose'><p className='result-lose'>Defeat</p></div>}</div>
                                <div className='game-duration'>{Math.floor(gameData.info.gameDuration / 60)}m {gameData.info.gameDuration -
                                  (Math.floor(gameData.info.gameDuration / 60) * 60)}s
                                </div>
                                <div className='game-patch'>Patch {(gameData.info.gameVersion).substring(0, 5)}</div>
                              </div>
                              <div className='info'>
                                <div className='champion'>
                                  <div className='champion-icon'>
                                    <img src={`${ddragonPath}/champion/${data.championName}.png`}
                                      width='60' height='60' style={{ borderRadius: '50%' }} alt={`${ddragonPath}/champion/${data.championName}.png`}>
                                    </img>
                                    <span className='champion-level'>{data.champLevel}</span>
                                  </div>
                                  <div className='spells'>
                                    <img src={`${summonerIcons}${getSummonerSpell(data.summoner1Id)}`}
                                      className='first-spell' width='30' height='30'>
                                    </img>
                                    <img src={`${summonerIcons}${getSummonerSpell(data.summoner2Id)}`}
                                      className='second-spell' width='30' height='30'>
                                    </img>
                                  </div>
                                  <div className='runes' >
                                    <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[0].selections[0].perk)}`}
                                      className='first-rune' width='30' height='30'>
                                    </img>
                                    <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[1].style)}`} className='second-rune' width='30' height='30'></img>
                                  </div>
                                </div>
                                <div className='kda'>
                                  <div className='k-d-a'>{data.kills} <span style={{ color: COLORS.lightgray }}> / </span><span style={{ color: COLORS.darkred }}>
                                    {data.deaths}</span><span style={{ color: COLORS.lightgray }}> / </span>{data.assists}
                                  </div>
                                  <div className='ratio'>{(data.challenges.kda).toFixed(2)}<span style={{ color: COLORS.lightgray }}> KDA</span></div>
                                  <div className='multi-kill'>{getKillingSpree(data.largestMultiKill)}</div>
                                </div>
                                <div className='stats'>
                                  <div className='kill-participation'>P/Kill {(100 * data.challenges.killParticipation).toFixed(2)}%
                                  </div>
                                  <div className='ward'>Wards Placed: {data.wardsPlaced + data.detectorWardsPlaced}</div>
                                  <div className='cs-score'>CS: {data.totalMinionsKilled + data.neutralMinionsKilled} &#40;{((data.totalMinionsKilled +
                                    data.neutralMinionsKilled) / (gameData.info.gameDuration / 60)).toFixed(1)} / min&#41;
                                  </div>
                                </div>
                                <div>
                                  <div className='items'>
                                    <ul className='items-list'>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item0 > 0 ? data.item0 : 7050}.png`} width='30' height='30'></img></li>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item1 > 0 ? data.item1 : 7050}.png`} width='30' height='30'></img></li>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item2 > 0 ? data.item2 : 7050}.png`} width='30' height='30'></img></li>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item3 > 0 ? data.item3 : 7050}.png`} width='30' height='30'></img></li>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item4 > 0 ? data.item4 : 7050}.png`} width='30' height='30'></img></li>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item5 > 0 ? data.item5 : 7050}.png`} width='30' height='30'></img></li>
                                      <li className='item'><img src={`${ddragonPath}/item/${data.item6 > 0 ? data.item6 : 7050}.png`} className='trinket' width='30' height='30'></img></li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div className='participants'>
                                <ul>
                                  {gameData.info.participants.slice(0, 5).map((summoner, idx) =>
                                    <>
                                      <li className='participant'>
                                        <div className='participant-icon'>
                                          <img src={`${ddragonPath}/champion/${summoner.championName}.png`} width='16' height='16'>
                                          </img>
                                        </div>
                                        <div className='participant-name'>{summoner.summonerName.toLowerCase() == searchText.toLowerCase() ?
                                          <div style={{ color: COLORS.darkgray, fontWeight: '500' }}>{summoner.summonerName}</div>
                                          :
                                          <div>{summoner.summonerName}</div>
                                        }</div>
                                      </li>
                                    </>
                                  )}
                                </ul>
                                <ul>
                                  {gameData.info.participants.slice(5, 10).map((summoner, idx) =>
                                    <>
                                      <li className='participant'>
                                        <div className='participant-icon'>
                                          <img src={`${ddragonPath}/champion/${summoner.championName}.png`} width='16' height='16'>
                                          </img>
                                        </div>
                                        <div className='participant-name'>{summoner.summonerName.toLowerCase() == searchText.toLowerCase() ?
                                          <div style={{ color: COLORS.darkgray, fontWeight: '500' }}>{summoner.summonerName}</div>
                                          :
                                          <div>{summoner.summonerName}</div>
                                        }</div>
                                      </li>
                                    </>
                                  )}
                                </ul>
                              </div>
                              <div className='action'>
                                {data.win == true ?
                                  <button className='menu-button' style={{ backgroundColor: COLORS.blue }} onClick={() => { toggleMatchClick(index); toggleMatchInsightClick(0); }}>
                                    {toggleMatch[index] ?
                                      <img src='down-arrow-blue.png' style={{ transform: 'rotate(180deg)' }} width='12' height='12'></img>
                                      :
                                      <img src='down-arrow-blue.png' width='12' height='12'></img>
                                    }
                                  </button>
                                  :
                                  <button className='menu-button' style={{ backgroundColor: COLORS.red }} onClick={() => toggleMatchClick(index)}>
                                    {toggleMatch[index] ?
                                      <img src='down-arrow-red.png' style={{ transform: 'rotate(180deg)' }} width='12' height='12'></img>
                                      :
                                      <img src='down-arrow-red.png' width='12' height='12'></img>
                                    }
                                  </button>
                                }
                              </div>
                            </div>
                            <div className='second-container'>
                              {toggleMatch[index] ?
                                <>
                                  <ul className='menu-buttons'>
                                    <li>
                                      <button className='overview-button' style={{ backgroundColor: toggleMatchInsight[0] == true ? COLORS.gray : '' }}
                                        onClick={() => toggleMatchInsightClick(0)}>Overview
                                      </button>
                                    </li>
                                    <li>
                                      <button className='analysis-button' style={{ backgroundColor: toggleMatchInsight[1] == true ? COLORS.gray : '' }}
                                        onClick={() => toggleMatchInsightClick(1)}>Analysis
                                      </button>
                                    </li>
                                    <li>
                                      <button className='build-button' style={{ backgroundColor: toggleMatchInsight[2] == true ? COLORS.gray : '' }}
                                        onClick={() => { toggleMatchInsightClick(2); toggleSummonerBuildClick(participantIndex); getMatchData(index); }}>Build
                                      </button>
                                    </li>
                                    <li>
                                      <button className='graph-button' style={{ backgroundColor: toggleMatchInsight[3] == true ? COLORS.gray : '' }}
                                        onClick={() => { toggleMatchInsightClick(3); toggleSummonerGraphClick(participantIndex); getMatchData(index); }}>Graph
                                      </button>
                                    </li>
                                  </ul>
                                  {toggleMatchInsight[0] ?
                                    <>
                                      <div className='overview'>
                                        <table className='overview-top'>
                                          <thead className='overview-header' style={{ backgroundColor: gameData.info.teams[0].win == true ? COLORS.lightblue : COLORS.lightred }}>
                                            <th>
                                              <span>{gameData.info.teams[0].win == true ?
                                                <><span style={{ color: COLORS.darkblue }}>Victory</span><span> (Blue Team)</span></>
                                                :
                                                <><span style={{ color: COLORS.darkred }}>Defeat</span><span> (Red Team)</span></>
                                              }</span>
                                            </th>
                                            <th>KDA</th>
                                            <th><span style={{ fontSize: '20px' }}>Damage</span><div>Dealt / Taken</div></th>
                                            <th>Gold</th>
                                            <th><span style={{ fontSize: '20px' }}>Wards</span><div>Placed/Control/Killed</div></th>
                                            <th>CS</th>
                                            <th>Items</th>
                                          </thead>
                                          <tbody style={gameData.info.teams[0].win == true ? { backgroundColor: COLORS.lightblue } : { backgroundColor: COLORS.lightred }}>
                                            {gameData.info.participants.slice(0, 5).map((data, participantIndex) =>
                                              <>
                                                <tr className='overview-row' style={{ backgroundColor: data.summonerName.toLowerCase() == searchText.toLowerCase() ? COLORS.neutral : '' }}>
                                                  <td className='overview-champion'>
                                                    <div>
                                                      <img className='champion-icon' src={`${ddragonPath}/champion/${data.championName}.png`}
                                                        width='40' height='40' style={{ borderRadius: '10px' }}>
                                                      </img>
                                                      <span className='champion-level' style={{ left: '5px', borderRadius: '4px' }}>{data.champLevel}</span>
                                                    </div>
                                                  </td>
                                                  <td className='overview-spells'>
                                                    <img src={`${summonerIcons}${getSummonerSpell(data.summoner1Id)}`} className='first-spell' width='22' height='22'>
                                                    </img>
                                                    <img src={`${summonerIcons}${getSummonerSpell(data.summoner2Id)}`} width='22' height='22'>
                                                    </img>
                                                  </td>
                                                  <td className='overview-runes'>
                                                    <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[0].selections[0].perk)}`}
                                                      className='first-rune' width='22' height='22'>
                                                    </img>
                                                    <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[1].style)}`}
                                                      className='second-rune' width='22' height='22'>
                                                    </img>
                                                  </td>
                                                  <td className='overview-name'>
                                                    <div style={{ fontWeight: '700' }}>{data.summonerName}</div>
                                                    <div>Level {data.summonerLevel}</div>
                                                  </td>
                                                  <td className='overview-kda'>
                                                    <div>
                                                      {data.kills} <span> / </span><span> {data.deaths}</span><span> / </span>{data.assists}
                                                      <span> ({(100 * data.challenges.killParticipation).toFixed()}%)</span>
                                                    </div>
                                                    <div style={{
                                                      paddingTop: '1vh', fontWeight: '700', color: (data.challenges.kda > 6) ? COLORS.orange
                                                        : (data.challenges.kda > 3) ? COLORS.darkblue : ''
                                                    }}>{data.challenges.kda.toFixed(2)}
                                                      <span style={{ color: COLORS.lightgray }}> KDA</span>
                                                    </div>
                                                  </td>
                                                  <td className='overview-damage'>
                                                    <div style={{ display: 'flex' }}>
                                                      <div className='damage-dealt'>
                                                        <div style={{ textAlign: 'center', margin: '0 0.5rem' }}>{data.totalDamageDealtToChampions.toLocaleString()}</div>
                                                        <div style={{ height: '1vh', width: '5vw', backgroundColor: COLORS.lightgray, margin: '10px', borderRadius: '1rem' }}>
                                                          <div style={{
                                                            height: '1vh', width: `${100 * data.challenges.teamDamagePercentage}%`,
                                                            backgroundColor: (data.summonerName.toLowerCase()) == searchText.toLowerCase() ? '#ff9b00' : '#0066cc', borderRadius: '1rem'
                                                          }}>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <div className='damage-taken'>
                                                        <div style={{ textAlign: 'center', margin: '0 0.5rem' }}>{data.totalDamageTaken.toLocaleString()}</div>
                                                        <div style={{ height: '1vh', width: '5vw', backgroundColor: COLORS.lightgray, margin: '10px', borderRadius: '1rem' }}>
                                                          <div style={{
                                                            height: '1vh', width: `${100 * data.challenges.damageTakenOnTeamPercentage}%`,
                                                            backgroundColor: (data.summonerName.toLowerCase()) == searchText.toLowerCase() ? '#ff9b00' : '#0066cc', borderRadius: '1rem'
                                                          }}>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className='overview-gold'>
                                                    <div>{(data.goldEarned / 1000).toFixed(1)}K</div>
                                                    <div>({(data.challenges.goldPerMinute).toFixed()} / m)</div>
                                                  </td>
                                                  <td className='overview-wards'>
                                                    <div>
                                                      {data.wardsPlaced} / {data.detectorWardsPlaced} / {data.wardsKilled}
                                                    </div>
                                                  </td>
                                                  <td className='overview-cs'>
                                                    <div>{data.totalMinionsKilled + data.neutralMinionsKilled}</div>
                                                    <div>({((data.totalMinionsKilled + data.neutralMinionsKilled) / (gameData.info.gameDuration / 60)).toFixed(1)} / m)</div>
                                                  </td>
                                                  <td className='overview-items'>
                                                    <ul className='items-list'>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item0 > 0 ? data.item0 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item1 > 0 ? data.item1 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item2 > 0 ? data.item2 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item3 > 0 ? data.item3 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item4 > 0 ? data.item4 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item5 > 0 ? data.item5 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item6 > 0 ? data.item6 : 7050}.png`} className='trinket' width='30' height='30'></img></li>
                                                    </ul>
                                                  </td>
                                                </tr>
                                              </>
                                            )}
                                          </tbody>
                                        </table>
                                        <div className='overview-middle'>
                                          <div className='overview-blue-team'>
                                            {gameData.info.teams[0].bans.length != 0 ?
                                              <>
                                                <div style={{ textAlign: 'center', color: COLORS.darkblue }}>Bans</div>
                                                <div className='overview-bans'>
                                                  {gameData.info.teams[0].bans.map((banIdx, idx) =>
                                                    <img src={`${championIcons}${banIdx.championId}.png`} height='30' width='30' style={{ paddingLeft: '0.5vw' }}></img>
                                                  )}
                                                </div>
                                              </>
                                              :
                                              <>
                                              </>}
                                            <div style={{ textAlign: 'center', color: COLORS.darkblue }}>Objectives</div>
                                            <div className='overview-objectives' style={{ textAlign: 'center' }}>
                                              <div className='overview-objectives'>
                                                <img src='/minimap-icons/baron.png'></img>
                                                <span className='overview-objective-numbers'>{gameData.info.participants[0].baronKills + gameData.info.participants[1].baronKills +
                                                  gameData.info.participants[2].baronKills + gameData.info.participants[3].baronKills + gameData.info.participants[4].baronKills}
                                                </span>
                                              </div>
                                              <div className='overview-objectives'>
                                                <img src='/minimap-icons/dragon.png'></img>
                                                <span className='overview-objective-numbers'>{gameData.info.participants[0].dragonKills + gameData.info.participants[1].dragonKills +
                                                  gameData.info.participants[2].dragonKills + gameData.info.participants[3].dragonKills + gameData.info.participants[4].dragonKills}
                                                </span>
                                              </div>
                                              <div className='overview-objectives'>
                                                <img src='/minimap-icons/blue-turret.png'></img>
                                                <span className='overview-objective-numbers'>
                                                  {gameData.info.participants[9].turretsLost}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className='overview-bar-distribution' style={{ display: 'flex' }}>
                                            <div style={{ display: 'block' }}></div>
                                            <div className='overview-gold-bar' style={{ display: 'flex', flexDirection: 'column' }}>
                                              <div style={{ textAlign: 'center' }}>Gold</div>
                                              <div>
                                                <div style={{ height: '1vh', width: '40vw', backgroundColor: '#ff3333', margin: '10px', borderRadius: '1rem' }}>
                                                  <div style={{
                                                    height: '1vh', width: `${100 * ((gameData.info.participants[0].goldEarned + gameData.info.participants[1].goldEarned +
                                                      gameData.info.participants[2].goldEarned + gameData.info.participants[3].goldEarned + gameData.info.participants[4].goldEarned) /
                                                      (gameData.info.participants[0].goldEarned + gameData.info.participants[1].goldEarned + gameData.info.participants[2].goldEarned +
                                                        gameData.info.participants[3].goldEarned + gameData.info.participants[4].goldEarned + gameData.info.participants[5].goldEarned +
                                                        gameData.info.participants[6].goldEarned + gameData.info.participants[7].goldEarned + gameData.info.participants[8].goldEarned +
                                                        gameData.info.participants[9].goldEarned))}%`, backgroundColor: '#3333ff', borderRadius: '1rem'
                                                  }}>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div style={{ position: 'absolute' }}>
                                                    {(gameData.info.participants[0].goldEarned + gameData.info.participants[1].goldEarned + gameData.info.participants[2].goldEarned +
                                                      gameData.info.participants[3].goldEarned + gameData.info.participants[4].goldEarned).toLocaleString()}
                                                  </div>
                                                  <div style={{ textAlign: 'right' }}>
                                                    {(gameData.info.participants[5].goldEarned + gameData.info.participants[6].goldEarned + gameData.info.participants[7].goldEarned +
                                                      gameData.info.participants[8].goldEarned + gameData.info.participants[9].goldEarned).toLocaleString()}
                                                  </div>
                                                </div>
                                              </div>
                                              <div style={{ textAlign: 'center' }}>Kills</div>
                                              <div>
                                                <div style={{ height: '1vh', width: '40vw', backgroundColor: '#ff3333', margin: '10px', borderRadius: '1rem' }}>
                                                  <div style={{
                                                    height: '1vh', width: `${100 * ((gameData.info.participants[0].kills + gameData.info.participants[1].kills +
                                                      gameData.info.participants[2].kills + gameData.info.participants[3].kills + gameData.info.participants[4].kills) /
                                                      (gameData.info.participants[0].kills + gameData.info.participants[1].kills + gameData.info.participants[2].kills +
                                                        gameData.info.participants[3].kills + gameData.info.participants[4].kills + gameData.info.participants[5].kills +
                                                        gameData.info.participants[6].kills + gameData.info.participants[7].kills + gameData.info.participants[8].kills +
                                                        gameData.info.participants[9].kills))}%`, backgroundColor: '#3333ff', borderRadius: '1rem'
                                                  }}>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div style={{ position: 'absolute' }}>
                                                    {gameData.info.participants[0].kills + gameData.info.participants[1].kills + gameData.info.participants[2].kills +
                                                      gameData.info.participants[3].kills + gameData.info.participants[4].kills}
                                                  </div>
                                                  <div style={{ textAlign: 'right' }}>
                                                    {gameData.info.participants[5].kills + gameData.info.participants[6].kills + gameData.info.participants[7].kills +
                                                      gameData.info.participants[8].kills + gameData.info.participants[9].kills}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className='overview-red-team'>
                                            {gameData.info.teams[0].bans.length != 0 ?
                                              <>
                                                <div style={{ textAlign: 'center', color: COLORS.darkred }}>Bans</div>
                                                <div className='overview-bans'>
                                                  {gameData.info.teams[0].bans.map((banIdx, idx) =>
                                                    <img src={`${championIcons}${banIdx.championId}.png`} height='30' width='30' style={{ paddingLeft: '0.5vw' }}></img>)}
                                                </div>
                                              </>
                                              :
                                              <>
                                              </>}
                                            <div style={{ textAlign: 'center', color: COLORS.darkred }}>Objectives</div>
                                            <div className='overview-objectives'>
                                              <div className='overview-objectives'>
                                                <img src='/minimap-icons/baron.png'></img>
                                                <span className='overview-objective-numbers'>{gameData.info.participants[5].baronKills + gameData.info.participants[6].baronKills +
                                                  gameData.info.participants[7].baronKills + gameData.info.participants[8].baronKills + gameData.info.participants[9].baronKills}
                                                </span>
                                              </div>
                                              <div className='overview-objectives'>
                                                <img src='/minimap-icons/dragon.png'></img>
                                                <span className='overview-objective-numbers'>{gameData.info.participants[5].dragonKills + gameData.info.participants[6].dragonKills +
                                                  gameData.info.participants[7].dragonKills + gameData.info.participants[8].dragonKills + gameData.info.participants[9].dragonKills}
                                                </span>
                                              </div>
                                              <div className='overview-objectives'>
                                                <img src='/minimap-icons/blue-turret.png'></img>
                                                <span className='overview-objective-numbers'>{gameData.info.participants[0].turretsLost}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <table className='overview-bottom'>
                                          <thead className='overview-header' style={{ backgroundColor: gameData.info.teams[0].win == true ? COLORS.lightred : COLORS.lightblue }}>
                                            <th>
                                              <span>{gameData.info.teams[1].win == true ?
                                                <><span style={{ color: COLORS.darkblue }}>Victory</span><span> (Blue Team)</span></>
                                                :
                                                <><span style={{ color: COLORS.darkred }}>Defeat</span><span> (Red Team)</span></>
                                              }</span>
                                            </th>
                                            <th>KDA</th>
                                            <th><span style={{ fontSize: '20px' }}>Damage</span><div>Dealt / Taken</div></th>
                                            <th>Gold</th>
                                            <th><span style={{ fontSize: '20px' }}>Wards</span><div>Placed/Control/Killed</div></th>
                                            <th>CS</th>
                                            <th>Items</th>
                                          </thead>
                                          <tbody style={gameData.info.teams[1].win == true ? { backgroundColor: COLORS.lightblue } : { backgroundColor: COLORS.lightred }}>
                                            {gameData.info.participants.slice(5, 10).map((data, participantIndex) =>
                                              <>
                                                <tr className='overview-row' style={{ backgroundColor: data.summonerName.toLowerCase() == searchText.toLowerCase() ? COLORS.neutral : '' }}>
                                                  <td className='overview-champion'>
                                                    <div>
                                                      <img className='champion-icon' src={`${ddragonPath}/champion/${data.championName}.png`} width='40' height='40' style={{ borderRadius: '10px' }}></img>
                                                      <span className='champion-level' style={{ left: '5px', borderRadius: '4px' }}>{data.champLevel}</span>
                                                    </div>
                                                  </td>
                                                  <td className='overview-spells'>
                                                    <img src={`${summonerIcons}${getSummonerSpell(data.summoner1Id)}`} width='22' height='22'></img>
                                                    <img src={`${summonerIcons}${getSummonerSpell(data.summoner2Id)}`} width='22' height='22'></img>
                                                  </td>
                                                  <td className='overview-runes'>
                                                    <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[0].selections[0].perk)}`} className='first-rune' width='22' height='22'></img>
                                                    <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[1].style)}`} className='second-rune' width='22' height='22'></img>
                                                  </td>
                                                  <td className='overview-name'>
                                                    <div style={{ fontWeight: '700' }}>{data.summonerName}</div>
                                                    <div>Level {data.summonerLevel}</div>
                                                  </td>
                                                  <td className='overview-kda'>
                                                    <div>
                                                      {data.kills} <span> / </span><span> {data.deaths}</span><span> / </span>{data.assists}
                                                      <span> ({(100 * data.challenges.killParticipation).toFixed()}%)</span>
                                                    </div>
                                                    <div style={{
                                                      paddingTop: '1vh', fontWeight: '700', color: (data.challenges.kda > 6) ? COLORS.orange
                                                        : (data.challenges.kda > 3) ? COLORS.darkblue : '#555E5E'
                                                    }}>{data.challenges.kda.toFixed(2)}<span style={{ color: COLORS.lightgray }}> KDA</span>
                                                    </div>
                                                  </td>
                                                  <td className='overview-damage'>
                                                    <div style={{ display: 'flex' }}>
                                                      <div className='damage-dealt'>
                                                        <div style={{ textAlign: 'center' }}>{data.totalDamageDealtToChampions.toLocaleString()}</div>
                                                        <div style={{ height: '1vh', width: '5vw', backgroundColor: COLORS.lightgray, margin: '10px', borderRadius: '1rem' }}>
                                                          <div style={{
                                                            height: '1vh', width: `${100 * data.challenges.teamDamagePercentage}%`,
                                                            backgroundColor: (data.summonerName.toLowerCase()) == searchText.toLowerCase() ? '#ff9b00' : '#cc0000', borderRadius: '1rem'
                                                          }}>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <div className='damage-taken'>
                                                        <div style={{ textAlign: 'center' }}>{data.totalDamageTaken.toLocaleString()}</div>
                                                        <div style={{ height: '1vh', width: '5vw', backgroundColor: COLORS.lightgray, margin: '10px', borderRadius: '1rem' }}>
                                                          <div style={{
                                                            height: '1vh', width: `${100 * data.challenges.damageTakenOnTeamPercentage}%`,
                                                            backgroundColor: (data.summonerName.toLowerCase()) == searchText.toLowerCase() ? '#ff9b00' : '#cc0000', borderRadius: '1rem'
                                                          }}>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className='overview-gold'><div>{(data.goldEarned / 1000).toFixed(1)}K ({(data.challenges.goldPerMinute).toFixed()} / m)</div></td>
                                                  <td className='overview-wards'><div>{data.wardsPlaced} / {data.detectorWardsPlaced} / {data.wardsKilled}</div></td>
                                                  <td className='overview-cs'>{data.totalMinionsKilled + data.neutralMinionsKilled}</td>
                                                  <td className='overview-items'>
                                                    <ul className='items-list'>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item0 > 0 ? data.item0 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item1 > 0 ? data.item1 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item2 > 0 ? data.item2 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item3 > 0 ? data.item3 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item4 > 0 ? data.item4 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item5 > 0 ? data.item5 : 7050}.png`} width='30' height='30'></img></li>
                                                      <li className='item'><img src={`${ddragonPath}/item/${data.item6 > 0 ? data.item6 : 7050}.png`} className='trinket' width='30' height='30'></img></li>
                                                    </ul>
                                                  </td>
                                                </tr>
                                              </>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </>
                                    : (toggleMatchInsight[1]) ?
                                      <>
                                        <div className='analysis'>
                                          <table className='analysis-top'>
                                            <thead className='analysis-header' style={{ backgroundColor: gameData.info.teams[0].win == true ? COLORS.lightblue : COLORS.lightred }}>
                                              <th>
                                                <span>{gameData.info.teams[0].win == true ? <><span style={{ color: COLORS.darkblue }}>Victory</span><span> (Blue Team)</span></>
                                                  :
                                                  <><span style={{ color: COLORS.darkred }}>Defeat</span><span> (Red Team)</span></>}</span>
                                              </th>
                                              <th><span style={{ fontSize: '20px' }}>Damage</span><div>Physical / Magic / True / Self Mitigated</div></th>
                                              <th>Total <div>Healing &amp; Shielding</div></th>
                                              <th>Vision Score</th>
                                              <th><span style={{ fontSize: '20px' }}>Turret</span><div>Plates / Destroyed</div></th>
                                              <th><span style={{ fontSize: '20px' }}>Skillshots</span><div>Hit / Dodged</div></th>
                                            </thead>
                                            <tbody style={gameData.info.teams[0].win == true ? { backgroundColor: COLORS.lightblue } : { backgroundColor: COLORS.lightred }}>
                                              {gameData.info.participants.slice(0, 5).map((data, participantIndex) =>
                                                <>
                                                  <tr className='analysis-row' style={{ backgroundColor: data.summonerName.toLowerCase() == searchText.toLowerCase() ? COLORS.neutral : '' }}>
                                                    <td className='analysis-champion'>
                                                      <div>
                                                        <img className='champion-icon' src={`${ddragonPath}/champion/${data.championName}.png`}
                                                          width='40' height='40' style={{ borderRadius: '10px' }}>
                                                        </img>
                                                        <span className='champion-level' style={{ left: '5px', borderRadius: '4px' }}>{data.champLevel}</span>
                                                      </div>
                                                    </td>
                                                    <td className='analysis-spells'>
                                                      <img src={`${summonerIcons}${getSummonerSpell(data.summoner1Id)}`} className='first-spell' width='22' height='22'>
                                                      </img>
                                                      <img src={`${summonerIcons}${getSummonerSpell(data.summoner2Id)}`} width='22' height='22'>
                                                      </img>
                                                    </td>
                                                    <td className='analysis-runes'>
                                                      <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[0].selections[0].perk)}`}
                                                        className='first-rune' width='22' height='22'>
                                                      </img>
                                                      <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[1].style)}`}
                                                        className='second-rune' width='22' height='22'>
                                                      </img>
                                                    </td>
                                                    <td className='analysis-name'>
                                                      <div style={{ fontWeight: '700' }}>{data.summonerName}</div>
                                                      <div>Level {data.summonerLevel}</div>
                                                    </td>
                                                    <td className='analysis-damage'>
                                                      <div>{data.physicalDamageDealtToChampions.toLocaleString()}</div>
                                                      <div>{data.magicDamageDealtToChampions.toLocaleString()}</div>
                                                      <div>{data.trueDamageDealtToChampions.toLocaleString()}</div>
                                                      <div>{data.damageSelfMitigated.toLocaleString()}</div>
                                                    </td>
                                                    <td className='analysis-heal-shield'>{Math.floor(data.challenges.effectiveHealAndShielding).toLocaleString()}</td>
                                                    <td className='analysis-vision'>{data.visionScore} ({(data.challenges.visionScorePerMinute).toFixed(2)} / m)</td>
                                                    <td className='analysis-turret'>{data.challenges.turretPlatesTaken} / {data.turretKills}</td>
                                                    <td className='analysis-skillshots'>{data.challenges.skillshotsHit} / {data.challenges.skillshotsDodged}</td>
                                                  </tr>
                                                </>
                                              )}
                                            </tbody>
                                          </table>
                                          <div>&nbsp;</div>
                                          <table className='analysis-bottom'>
                                            <thead className='analysis-header' style={{ backgroundColor: gameData.info.teams[1].win == true ? COLORS.lightblue : COLORS.lightred }}>
                                              <th>
                                                <span>{gameData.info.teams[1].win == true ?
                                                  <><span style={{ color: COLORS.darkblue }}>Victory</span><span> (Blue Team)</span></>
                                                  :
                                                  <><span style={{ color: COLORS.darkred }}>Defeat</span><span> (Red Team)</span></>
                                                }</span>
                                              </th>
                                              <th>
                                                <span style={{ fontSize: '20px' }}>Damage</span><div>Physical / Magic / True / Self Mitigated</div>
                                              </th>
                                              <th>Total <div>Healing &amp; Shielding</div></th>
                                              <th>Vision Score</th>
                                              <th><span style={{ fontSize: '20px' }}>Turret</span><div>Plates / Destroyed</div></th>
                                              <th><span style={{ fontSize: '20px' }}>Skillshots</span><div>Hit / Dodged</div></th>
                                            </thead>
                                            <tbody style={gameData.info.teams[1].win == true ? { backgroundColor: COLORS.lightblue } : { backgroundColor: COLORS.lightred }}>
                                              {gameData.info.participants.slice(5, 10).map((data, participantIndex) =>
                                                <>
                                                  <tr className='analysis-row' style={{ backgroundColor: data.summonerName.toLowerCase() == searchText.toLowerCase() ? COLORS.neutral : '' }}>
                                                    <td className='analysis-champion'>
                                                      <div>
                                                        <img className='champion-icon' src={`${ddragonPath}/champion/${data.championName}.png`}
                                                          width='40' height='40' style={{ borderRadius: '10px' }}>
                                                        </img>
                                                        <span className='champion-level' style={{ left: '5px', borderRadius: '4px' }}>{data.champLevel}</span>
                                                      </div>
                                                    </td>
                                                    <td className='analysis-spells'>
                                                      <img src={`${summonerIcons}${getSummonerSpell(data.summoner1Id)}`} className='first-spell' width='22' height='22'>
                                                      </img>
                                                      <img src={`${summonerIcons}${getSummonerSpell(data.summoner2Id)}`} width='22' height='22'>
                                                      </img>
                                                    </td>
                                                    <td className='analysis-runes'>
                                                      <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[0].selections[0].perk)}`}
                                                        className='first-rune' width='22' height='22'>
                                                      </img>
                                                      <img src={`${summonerRunes}${getSummonerRunes(data.perks.styles[1].style)}`}
                                                        className='second-rune' width='22' height='22'>
                                                      </img>
                                                    </td>
                                                    <td className='analysis-name'>
                                                      <div style={{ fontWeight: '700' }}>{data.summonerName}</div>
                                                      <div>Level {data.summonerLevel}</div>
                                                    </td>
                                                    <td className='analysis-damage'>
                                                      <div>{data.physicalDamageDealtToChampions.toLocaleString()}</div>
                                                      <div>{data.magicDamageDealtToChampions.toLocaleString()}</div>
                                                      <div>{data.trueDamageDealtToChampions.toLocaleString()}</div>
                                                      <div>{data.damageSelfMitigated.toLocaleString()}</div>
                                                    </td>
                                                    <td className='analysis-heal-shield'>{Math.floor(data.challenges.effectiveHealAndShielding).toLocaleString()}</td>
                                                    <td className='analysis-vision'>{data.visionScore} ({(data.challenges.visionScorePerMinute).toFixed(2)} / m)</td>
                                                    <td className='analysis-turret'>{data.challenges.turretPlatesTaken} / {data.turretKills}</td>
                                                    <td className='analysis-skillshots'>{data.challenges.skillshotsHit} / {data.challenges.skillshotsDodged}</td>
                                                  </tr>
                                                </>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </>
                                      : (toggleMatchInsight[2]) ?
                                        <>
                                          <div class='build'>
                                            <div class="build-summoner-selector">
                                              <ul>
                                                <li style={{ width: '18vw' }}>
                                                  <div class='dropdown-info-button'>Select Summoner <span className='down-arrow'></span></div>
                                                  <ul class="dropdown">
                                                    {gameData.info.participants.map((summoner, index) =>
                                                      <li onClick={() => toggleSummonerBuildClick(index)} className='dropdown-info'>
                                                        <span style={{
                                                          color: summoner.win === true ? COLORS.lightblue : COLORS.lightred, float: 'left',
                                                          fontWeight: summoner.summonerName.toLowerCase() === searchText.toLowerCase() ? '700' : ''
                                                        }}>{summoner.summonerName}
                                                        </span>
                                                        <span style={{
                                                          color: summoner.win === true ? COLORS.lightblue : COLORS.lightred, float: 'right',
                                                          fontWeight: summoner.summonerName.toLowerCase() === searchText.toLowerCase() ? '700' : ''
                                                        }}>{summoner.championName}
                                                        </span>
                                                      </li>
                                                    )}
                                                  </ul>
                                                </li>
                                              </ul>
                                            </div>
                                            {gameData.info.participants.map((summoner, summonerIdx) => (
                                              toggleSummonerBuild[summonerIdx] === true ?
                                                <>
                                                  <div style={{ color: summoner.win === true ? COLORS.darkblue : COLORS.darkred }} className='dropdown-summoner-selected'>{gameData.info.participants[summonerIdx].summonerName}</div>
                                                  <div class='build-content'>
                                                    <div className='build-runes'>
                                                      <div className='build-type'>Runes</div>
                                                      <div className='build-runes-content'>
                                                        <div className='build-runes-content-primary'>
                                                          {summoner.perks.styles[0].style === 8000 ? (
                                                            <>
                                                              <div className='build-rune-tree-header'>
                                                                <img className='build-rune-path' src={`${summonerRunes}7201_precision.png`}></img>
                                                                <span>Precision</span>
                                                              </div>
                                                              <div className='build-runes-tree-keystone-four'>
                                                                {precisionRuneTree[0].map((runeName, index) =>
                                                                  <img className='build-rune-keystone' src={`${summonerRunes}precision/${runeName}.png`}
                                                                    style={{
                                                                      filter: getSummonerRunes(summoner.perks.styles[0].selections[0].perk) === `precision/${runeName}.png` ?
                                                                        '' : 'grayscale(100%)'
                                                                    }}>
                                                                  </img>
                                                                )}
                                                              </div>
                                                              <div className='build-runes-tree-row'>
                                                                {precisionRuneTree[1].map((runeName, index) =>
                                                                  getSummonerRunes(summoner.perks.styles[0].selections[1].perk) === `precision/${runeName}.png` ||
                                                                    getSummonerRunes(summoner.perks.styles[0].selections[2].perk) === `precision/${runeName}.png` ||
                                                                    getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === `precision/${runeName}.png` ?
                                                                    <img className='build-rune-row-primary' src={`${summonerRunes}precision/${runeName}.png`}></img>
                                                                    :
                                                                    <img className='build-rune-row-primary' src={`${summonerRunes}precision/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                )}
                                                                <img src={`${summonerRunes}sorcery/laststand/laststand.png`}
                                                                  style={{
                                                                    filter: getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === 'sorcery/laststand/laststand.png' ?
                                                                      '' : 'grayscale(100%)'
                                                                  }} className='build-rune-row-primary'>
                                                                </img>
                                                              </div>
                                                            </>)
                                                            :
                                                            summoner.perks.styles[0].style === 8100 ? (
                                                              <>
                                                                <div className='build-rune-tree-header'>
                                                                  <img className='build-rune-path' src={`${summonerRunes}7200_domination.png`}></img>
                                                                  <span>Domination</span>
                                                                </div>
                                                                <div className='build-runes-tree-keystone-four'>
                                                                  {dominationRuneTree[0].map((runeName, index) =>
                                                                    <img className='build-rune-keystone' src={`${summonerRunes}domination/${runeName}.png`}
                                                                      style={{
                                                                        filter: getSummonerRunes(summoner.perks.styles[0].selections[0].perk) === `domination/${runeName}.png` ?
                                                                          '' : 'grayscale(100%)'
                                                                      }}>
                                                                    </img>
                                                                  )}
                                                                </div>
                                                                <div className='build-runes-tree-row'>
                                                                  {dominationRuneTree[1].map((runeName, index) =>
                                                                    getSummonerRunes(summoner.perks.styles[0].selections[1].perk) === `domination/${runeName}.png` ||
                                                                      getSummonerRunes(summoner.perks.styles[0].selections[2].perk) === `domination/${runeName}.png` ?
                                                                      <img className='build-rune-row-primary' src={`${summonerRunes}domination/${runeName}.png`}></img>
                                                                      :
                                                                      <img className='build-rune-row-primary' src={`${summonerRunes}domination/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                  )}
                                                                </div>
                                                                <div className='build-runes-tree-row-four'>
                                                                  {dominationRuneTree[2].map((runeName, index) =>
                                                                    getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === `domination/${runeName}.png` ?
                                                                      <img className='build-rune-row-primary' src={`${summonerRunes}domination/${runeName}.png`}></img>
                                                                      :
                                                                      <img className='build-rune-row-primary' src={`${summonerRunes}domination/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                  )}
                                                                </div>
                                                              </>)
                                                              :
                                                              summoner.perks.styles[0].style === 8200 ? (
                                                                <>
                                                                  <div className='build-rune-tree-header'>
                                                                    <img className='build-rune-path' src={`${summonerRunes}7202_sorcery.png`}></img>
                                                                    <span>Sorcery</span>
                                                                  </div>
                                                                  <div className='build-runes-tree-keystone-three'>
                                                                    {sorceryRuneTree[0].map((runeName, index) =>
                                                                      <img className='build-rune-keystone' src={`${summonerRunes}sorcery/${runeName}.png`}
                                                                        style={{
                                                                          filter: getSummonerRunes(summoner.perks.styles[0].selections[0].perk) === `sorcery/${runeName}.png` ?
                                                                            '' : 'grayscale(100%)'
                                                                        }}>
                                                                      </img>
                                                                    )}
                                                                  </div>
                                                                  <div className='build-runes-tree-row'>
                                                                    {sorceryRuneTree[1].map((runeName, index) =>

                                                                      getSummonerRunes(summoner.perks.styles[0].selections[1].perk) === `sorcery/${runeName}.png` ||
                                                                        getSummonerRunes(summoner.perks.styles[0].selections[2].perk) === `sorcery/${runeName}.png` ||
                                                                        getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === `sorcery/${runeName}.png` ?
                                                                        <img className='build-rune-row-primary' src={`${summonerRunes}sorcery/${runeName}.png`}></img>
                                                                        :
                                                                        <img className='build-rune-row-primary' src={`${summonerRunes}sorcery/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                    )}
                                                                  </div>
                                                                </>)
                                                                :
                                                                summoner.perks.styles[0].style === 8300 ? (
                                                                  <>
                                                                    <div className='build-rune-tree-header'>
                                                                      <img className='build-rune-path' src={`${summonerRunes}7203_whimsy.png`}></img>
                                                                      <span>Inspiration</span>
                                                                    </div>
                                                                    <div className='build-runes-tree-keystone-three'>
                                                                      {inspirationRuneTree[0].map((runeName, index) =>
                                                                        <img className='build-rune-keystone' src={`${summonerRunes}inspiration/${runeName}.png`}
                                                                          style={{
                                                                            filter: getSummonerRunes(summoner.perks.styles[0].selections[0].perk) === `inspiration/${runeName}.png` ?
                                                                              '' : 'grayscale(100%)'
                                                                          }}>
                                                                        </img>
                                                                      )}
                                                                    </div>
                                                                    <div className='build-runes-tree-row'>
                                                                      {inspirationRuneTree[1].map((runeName, index) =>
                                                                        getSummonerRunes(summoner.perks.styles[0].selections[1].perk) === `inspiration/${runeName}.png` ||
                                                                          getSummonerRunes(summoner.perks.styles[0].selections[2].perk) === `inspiration/${runeName}.png` ||
                                                                          getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === `inspiration/${runeName}.png` ?
                                                                          <img className='build-rune-row-primary' src={`${summonerRunes}inspiration/${runeName}.png`}></img>
                                                                          :
                                                                          <img className='build-rune-row-primary' src={`${summonerRunes}inspiration/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                      )}
                                                                      <img src={`${summonerRunes}resolve/approachvelocity/approachvelocity.png`}
                                                                        style={{
                                                                          filter: getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === 'resolve/approachvelocity/approachvelocity.png' ?
                                                                            '' : 'grayscale(100%)'
                                                                        }} className='build-rune-row-primary'>
                                                                      </img>
                                                                      <img src={`${summonerRunes}inspiration/timewarptonic/timewarptonic.png`}
                                                                        style={{
                                                                          filter: getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === 'inspiration/timewarptonic/timewarptonic.png' ?
                                                                            '' : 'grayscale(100%)'
                                                                        }} className='build-rune-row-primary'>
                                                                      </img>
                                                                    </div>
                                                                  </>)
                                                                  :
                                                                  summoner.perks.styles[0].style === 8400 ? (
                                                                    <>
                                                                      <div className='build-rune-tree-header'>
                                                                        <img className='build-rune-path' src={`${summonerRunes}7204_resolve.png`}></img>
                                                                        <span>Resolve</span>
                                                                      </div>
                                                                      <div className='build-runes-tree-keystone-three'>
                                                                        {resolveRuneTree[0].map((runeName, index) =>
                                                                          <img className='build-rune-keystone' src={`${summonerRunes}resolve/${runeName}.png`}
                                                                            style={{
                                                                              filter: getSummonerRunes(summoner.perks.styles[0].selections[0].perk) === `resolve/${runeName}.png` ?
                                                                                '' : 'grayscale(100%)'
                                                                            }}>
                                                                          </img>
                                                                        )}
                                                                      </div>
                                                                      <div className='build-runes-tree-row'>
                                                                        {resolveRuneTree[1].map((runeName, index) =>
                                                                          getSummonerRunes(summoner.perks.styles[0].selections[1].perk) === `resolve/${runeName}.png` ||
                                                                            getSummonerRunes(summoner.perks.styles[0].selections[2].perk) === `resolve/${runeName}.png` ||
                                                                            getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === `resolve/${runeName}.png` ?
                                                                            <img className='build-rune-row-primary' src={`${summonerRunes}resolve/${runeName}.png`}></img>
                                                                            :
                                                                            <img className='build-rune-row-primary' src={`${summonerRunes}resolve/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                        )}
                                                                        <img src={`${summonerRunes}sorcery/unflinching/unflinching.png`}
                                                                          style={{
                                                                            filter: getSummonerRunes(summoner.perks.styles[0].selections[3].perk) === 'sorcery/unflinching/unflinching.png' ?
                                                                              '' : 'grayscale(100%)'
                                                                          }} className='build-rune-row-primary'>
                                                                        </img>
                                                                      </div>
                                                                    </>)
                                                                    :
                                                                    <>
                                                                    </>
                                                          }
                                                        </div>
                                                        <div className='build-runes-content-secondary'>
                                                          {summoner.perks.styles[1].style === 8000 ? (
                                                            <>
                                                              <div className='build-rune-tree-header'>
                                                                <img className='build-rune-path' src={`${summonerRunes}7201_precision.png`}></img>
                                                                <span>Precision</span>
                                                              </div>
                                                              <div className='build-runes-tree-row'>
                                                                {precisionRuneTree[1].map((runeName, index) =>

                                                                  getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === `precision/${runeName}.png` ||
                                                                    getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === `precision/${runeName}.png` ?

                                                                    <img className='build-rune-row-secondary' src={`${summonerRunes}precision/${runeName}.png`}></img>
                                                                    :
                                                                    <img className='build-rune-row-secondary' src={`${summonerRunes}precision/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>

                                                                )}
                                                                <img src={`${summonerRunes}sorcery/laststand/laststand.png`}
                                                                  style={{
                                                                    filter: getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === 'sorcery/laststand/laststand.png' ||
                                                                      getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === 'sorcery/laststand/laststand.png' ?
                                                                      '' : 'grayscale(100%)'
                                                                  }} className='build-rune-row-secondary'>
                                                                </img>
                                                              </div>
                                                            </>)
                                                            :
                                                            summoner.perks.styles[1].style === 8100 ? (
                                                              <>
                                                                <div className='build-rune-tree-header'>
                                                                  <img className='build-rune-path' src={`${summonerRunes}7200_domination.png`}></img>
                                                                  <span>Domination</span>
                                                                </div>
                                                                <div className='build-runes-tree-row'>
                                                                  {dominationRuneTree[1].map((runeName, index) =>

                                                                    getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === `domination/${runeName}.png` ||
                                                                      getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === `domination/${runeName}.png` ?

                                                                      <img className='build-rune-row-secondary' src={`${summonerRunes}domination/${runeName}.png`}></img>
                                                                      :
                                                                      <img className='build-rune-row-secondary' src={`${summonerRunes}domination/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>

                                                                  )}
                                                                </div>
                                                                <div className='build-runes-tree-row-four'>
                                                                  {dominationRuneTree[2].map((runeName, index) =>
                                                                    getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === `domination/${runeName}.png` ||
                                                                      getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === `domination/${runeName}.png` ?
                                                                      <img className='build-rune-row-secondary' src={`${summonerRunes}domination/${runeName}.png`}></img>
                                                                      :
                                                                      <img className='build-rune-row-secondary' src={`${summonerRunes}domination/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                  )}
                                                                </div>
                                                              </>)
                                                              :
                                                              summoner.perks.styles[1].style === 8200 ? (
                                                                <>
                                                                  <div className='build-rune-tree-header'>
                                                                    <img className='build-rune-path' src={`${summonerRunes}7202_sorcery.png`}></img>
                                                                    <span>Sorcery</span>
                                                                  </div>
                                                                  <div className='build-runes-tree-row'>
                                                                    {sorceryRuneTree[1].map((runeName, index) =>
                                                                      getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === `sorcery/${runeName}.png` ||
                                                                        getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === `sorcery/${runeName}.png` ?
                                                                        <img className='build-rune-row-secondary' src={`${summonerRunes}sorcery/${runeName}.png`}></img>
                                                                        :
                                                                        <img className='build-rune-row-secondary' src={`${summonerRunes}sorcery/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                    )}
                                                                  </div>
                                                                </>)
                                                                :
                                                                summoner.perks.styles[1].style === 8300 ? (
                                                                  <>
                                                                    <div className='build-rune-tree-header'>
                                                                      <img className='build-rune-path' src={`${summonerRunes}7203_whimsy.png`}></img>
                                                                      <span>Inspiration</span>
                                                                    </div>
                                                                    <div className='build-runes-tree-row'>
                                                                      {inspirationRuneTree[1].map((runeName, index) =>
                                                                        getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === `inspiration/${runeName}.png` ||
                                                                          getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === `inspiration/${runeName}.png` ?
                                                                          <img className='build-rune-row-secondary' src={`${summonerRunes}inspiration/${runeName}.png`}></img>
                                                                          :
                                                                          <img className='build-rune-row-secondary' src={`${summonerRunes}inspiration/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                      )}
                                                                      <img src={`${summonerRunes}resolve/approachvelocity/approachvelocity.png`}
                                                                        style={{
                                                                          filter: getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === 'resolve/approachvelocity/approachvelocity.png' ||
                                                                            getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === 'resolve/approachvelocity/approachvelocity.png' ?
                                                                            '' : 'grayscale(100%)'
                                                                        }} className='build-rune-row-secondary'>
                                                                      </img>
                                                                      <img src={`${summonerRunes}inspiration/timewarptonic/timewarptonic.png`}
                                                                        style={{
                                                                          filter: getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === 'inspiration/timewarptonic/timewarptonic.png' ||
                                                                            getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === 'resolve/approachvelocity/approachvelocity.png' ?
                                                                            '' : 'grayscale(100%)'
                                                                        }} className='build-rune-row-secondary'>
                                                                      </img>
                                                                    </div>
                                                                  </>)
                                                                  :
                                                                  summoner.perks.styles[1].style === 8400 ? (
                                                                    <>
                                                                      <div className='build-rune-tree-header'>
                                                                        <img className='build-rune-path' src={`${summonerRunes}7204_resolve.png`}></img>
                                                                        <span>Resolve</span>
                                                                      </div>
                                                                      <div className='build-runes-tree-row'>
                                                                        {resolveRuneTree[1].map((runeName, index) =>
                                                                          getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === `resolve/${runeName}.png` ||
                                                                            getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === `resolve/${runeName}.png` ?
                                                                            <img className='build-rune-row-secondary' src={`${summonerRunes}resolve/${runeName}.png`}></img>
                                                                            :
                                                                            <img className='build-rune-row-secondary' src={`${summonerRunes}resolve/${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                                        )}
                                                                        <img src={`${summonerRunes}sorcery/unflinching/unflinching.png`}
                                                                          style={{
                                                                            filter: getSummonerRunes(summoner.perks.styles[1].selections[0].perk) === 'sorcery/unflinching/unflinching.png' ||
                                                                              getSummonerRunes(summoner.perks.styles[1].selections[1].perk) === 'sorcery/unflinching/unflinching.png' ?
                                                                              '' : 'grayscale(100%)'
                                                                          }} className='build-rune-row-secondary'>
                                                                        </img>
                                                                      </div>
                                                                    </>)
                                                                    :
                                                                    <>
                                                                    </>
                                                          }
                                                          <div className='build-runes-stats-tree'>
                                                            <div className='build-runes-tree-row'>
                                                              {statRuneTree.slice(0, 3).map((runeName, index) =>
                                                                getSummonerRunes(summoner.perks.statPerks.offense) === `${runeName}.png` ?
                                                                  <img className='build-rune-row-secondary' src={`${summonerRunesStats}${runeName}.png`}></img>
                                                                  :
                                                                  <img className='build-rune-row-secondary' src={`${summonerRunesStats}${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                              )}
                                                              {statRuneTree.slice(3, 6).map((runeName, index) =>
                                                                getSummonerRunes(summoner.perks.statPerks.flex) === `${runeName}.png` ?
                                                                  <img className='build-rune-row-secondary' src={`${summonerRunesStats}${runeName}.png`}></img>
                                                                  :
                                                                  <img className='build-rune-row-secondary' src={`${summonerRunesStats}${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                              )}
                                                              {statRuneTree.slice(6, 9).map((runeName, index) =>
                                                                getSummonerRunes(summoner.perks.statPerks.defense) === `${runeName}.png` ?
                                                                  <img className='build-rune-row-secondary' src={`${summonerRunesStats}${runeName}.png`}></img>
                                                                  :
                                                                  <img className='build-rune-row-secondary' src={`${summonerRunesStats}${runeName}.png`} style={{ filter: 'grayscale(100%)' }}></img>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className='build-skills-items-split'>
                                                      <div className='build-skills'>
                                                        <div className='build-type'>Skill Order</div>
                                                        <div className='build-skills-content'>
                                                          <div className='build-skills-level' id='ability-key' >Q</div>
                                                          <div className='build-skills-level' id='ability-key' >W</div>
                                                          <div className='build-skills-level' id='ability-key' >E</div>
                                                          <div className='build-skills-level' id='ability-key' >R</div>
                                                          {matchTimeline[index].info.frames.map((timelineData, timelineIndex) => (
                                                            timelineData.events.map((eventData, eventIndex) =>
                                                              <>
                                                                {eventData.participantId === summonerIdx + 1 && eventData.type === 'SKILL_LEVEL_UP' && eventData.levelUpType === 'NORMAL' ?
                                                                  eventData.skillSlot === 1 ?
                                                                    <>
                                                                      <div className='build-skills-level' style={{
                                                                        border: '3px solid black', backgroundColor: summoner.win ? COLORS.darkblue : COLORS.darkred
                                                                      }}>{timelineData.participantFrames[summonerIdx + 1].level}
                                                                      </div>
                                                                      <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                      <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                      <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                    </>
                                                                    :
                                                                    eventData.skillSlot === 2 ?
                                                                      <>
                                                                        <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                        <div className='build-skills-level' style={{
                                                                          border: '3px solid black', backgroundColor: summoner.win ? COLORS.darkblue :
                                                                            COLORS.darkred
                                                                        }}>{timelineData.participantFrames[summonerIdx + 1].level}
                                                                        </div>
                                                                        <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                        <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                      </>
                                                                      :
                                                                      eventData.skillSlot === 3 ?
                                                                        <>
                                                                          <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                          <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                          <div className='build-skills-level' style={{
                                                                            border: '3px solid black', backgroundColor: summoner.win ? COLORS.darkblue :
                                                                              COLORS.darkred
                                                                          }}>{timelineData.participantFrames[summonerIdx + 1].level}
                                                                          </div>
                                                                          <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                        </>
                                                                        :
                                                                        eventData.skillSlot === 4 ?
                                                                          <>
                                                                            <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                            <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                            <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                                            <div className='build-skills-level' style={{
                                                                              border: '3px solid black', backgroundColor: summoner.win ?
                                                                                COLORS.darkblue : COLORS.darkred
                                                                            }}>{timelineData.participantFrames[summonerIdx + 1].level}
                                                                            </div>
                                                                          </>
                                                                          :
                                                                          <>
                                                                          </>
                                                                  :
                                                                  <>
                                                                  </>
                                                                }
                                                              </>
                                                            )
                                                          ))}
                                                          {Array.from({ length: 18 - summoner.champLevel }, (_, i) =>
                                                            <>
                                                              <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred, margin: '0.2rem' }}></div>
                                                              <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                              <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                              <div className='build-skills-level' style={{ backgroundColor: summoner.win ? COLORS.lightblue : COLORS.lightred }}></div>
                                                            </>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div className='build-items'>
                                                        <div className='build-type'>
                                                          Items
                                                        </div>
                                                        <div className='build-items-content'>
                                                          {matchTimeline[index].info.frames.map((timelineData, timelineIndex) => (
                                                            <>
                                                              {timelineData.events.map((eventData, eventIndex) => (
                                                                eventData.participantId === summonerIdx + 1 && eventData.type === 'ITEM_PURCHASED' ?
                                                                  <div>
                                                                    <div style={{ display: 'grid', gridAutoFlow: 'column', placeItems: 'center' }}>
                                                                      <img className='build-item-purchased' style={{
                                                                        border: summoner.win ?
                                                                          '3px solid #A3CFEC' : '3px solid #E2B6B3', borderRadius: '4px'
                                                                      }}
                                                                        src={`${ddragonPath}/item/${eventData.itemId}.png`} width='40' height='40'>
                                                                      </img>
                                                                      <div style={{
                                                                        height: '2vh', width: '2vw', backgroundColor: summoner.win ?
                                                                          COLORS.lightblue : COLORS.lightred
                                                                      }}></div>
                                                                    </div>
                                                                    <div style={{ color: COLORS.neutral, margin: '0.5rem 0 1.5rem 0' }}>{Math.floor(eventData.timestamp / 60000).toFixed()} min</div>
                                                                  </div>
                                                                  :
                                                                  (eventData.participantId === summonerIdx + 1 && (eventData.type === 'ITEM_SOLD' || eventData.type === 'ITEM_UNDO')) ?
                                                                    <div>
                                                                      <div className='build-item-square'>
                                                                        <div className='build-item-square'>

                                                                          <div className='build-item-sold-undo'>{eventData.type === 'ITEM_SOLD' ? <text>Sold</text> : <text>Undo</text>}</div>
                                                                          <div className='build-item-X'>&#10060;</div>
                                                                          {eventData.type === 'ITEM_SOLD' ?
                                                                            <>
                                                                              <img className='build-item' style={{
                                                                                border: summoner.win ?
                                                                                  '3px solid #A3CFEC' : '3px solid #E2B6B3', opacity: '0.5'
                                                                              }}
                                                                                src={`${ddragonPath}/item/${eventData.itemId}.png`} width='40' height='40'>
                                                                              </img>
                                                                            </>
                                                                            :
                                                                            <>
                                                                              <img className='build-item' style={{
                                                                                border: summoner.win ?
                                                                                  '3px solid #A3CFEC' : '3px solid #E2B6B3', opacity: '0.5'
                                                                              }}
                                                                                src={`${ddragonPath}/item/${eventData.beforeId === 0 ? eventData.afterId : eventData.beforeId}.png`} width='40' height='40'>
                                                                              </img>
                                                                            </>}
                                                                        </div>
                                                                        <div style={{
                                                                          height: '2vh', width: '2vw', backgroundColor: summoner.win ?
                                                                            '#A3CFEC' : COLORS.lightred
                                                                        }}></div>
                                                                      </div>
                                                                      <div style={{ color: COLORS.neutral, margin: '0.5rem 0 1.5rem 0' }}>{Math.floor(eventData.timestamp / 60000).toFixed()} min</div>
                                                                    </div>
                                                                    :
                                                                    <>
                                                                    </>
                                                              ))}
                                                            </>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </>
                                                :
                                                <>
                                                </>
                                            ))}
                                          </div>
                                        </>
                                        :
                                        (toggleMatchInsight[3]) ?
                                          <>
                                            <div className='graph'>
                                              <ul className='menu-buttons'>
                                                <li>
                                                  <button className='gold-button' style={toggleGraphs[0] === true ? { borderBottom: `3px solid ${COLORS.neutral}`, color: COLORS.neutral } : {}}
                                                    onClick={() => toggleGraphsClick(0)}>Gold Earned
                                                  </button>
                                                </li>
                                                <li>
                                                  <button className='xp-button' style={toggleGraphs[1] === true ? { borderBottom: `3px solid ${COLORS.neutral}`, color: COLORS.neutral } : {}}
                                                    onClick={() => toggleGraphsClick(1)}>XP Gained
                                                  </button>
                                                </li>
                                                <li>
                                                  <button className='cs-button' style={toggleGraphs[2] === true ? { borderBottom: `3px solid ${COLORS.neutral}`, color: COLORS.neutral } : {}}
                                                    onClick={() => toggleGraphsClick(2)}>Minions Killed
                                                  </button>
                                                </li>
                                                <li>
                                                  <button className='damage-button' style={toggleGraphs[3] === true ? { borderBottom: `3px solid ${COLORS.neutral}`, color: COLORS.neutral } : {}}
                                                    onClick={() => toggleGraphsClick(3)}>Damage Dealt
                                                  </button>
                                                </li>
                                              </ul>
                                              <div class="graph-summoner-selector">
                                                <div className='graph-team-one'>
                                                  <div style={{ color: COLORS.white, fontSize: '22px', fontWeight: '700' }}>Blue Team {gameData.info.participants[0].win === true ?
                                                    <span style={{ color: gameData.info.participants[0].win === true ? COLORS.darkblue : COLORS.darkred, fontSize: '18px' }}>(Victory)</span> :
                                                    <span style={{ color: gameData.info.participants[0].win === true ? COLORS.darkblue : COLORS.darkred, fontSize: '18px' }}>(Defeat)</span>}
                                                  </div>
                                                  <div className='graph-team-one-summoners'>
                                                    {summonerColors.slice(0, 5).map((blueSummoner, blueSummonerIndex) =>
                                                      <ul style={{ padding: '0', margin: '1rem' }}>
                                                        <li>
                                                          <button onClick={() => { toggleSummonerGraphClick(blueSummonerIndex); getMatchData(index, blueSummonerIndex) }}
                                                            style={{
                                                              display: 'grid', placeItems: 'center', padding: '0.5rem', backgroundColor: summonerColors[blueSummonerIndex], cursor: 'pointer',
                                                              opacity: toggleSummonerGraph[blueSummonerIndex] == true ? '' : '0.3'
                                                            }}>{toggleSummonerGraph[blueSummonerIndex] == true ?
                                                              <span style={{ position: 'absolute', color: COLORS.white, fontSize: '26px', fontWeight: '700', marginBottom: '4rem' }}>&#10003;</span>
                                                              : <span style={{ position: 'absolute', color: COLORS.white, fontSize: '26px', fontWeight: '700', marginBottom: '4rem' }}>&#10005;</span>}
                                                            <img src={`${ddragonPath}/champion/${gameData.info.participants[blueSummonerIndex].championName}.png`} width='40' height='40' style={{ borderRadius: '4px' }}></img>
                                                          </button>
                                                        </li>
                                                      </ul>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className='graph-team-two'>
                                                  <div style={{ color: COLORS.white, fontSize: '22px', fontWeight: '700' }}>Red Team {gameData.info.participants[5].win === true ?
                                                    <span style={{ color: gameData.info.participants[5].win === true ? COLORS.darkblue : COLORS.darkred, fontSize: '18px' }}>(Victory)</span> :
                                                    <span style={{ color: gameData.info.participants[5].win === true ? COLORS.darkblue : COLORS.darkred, fontSize: '18px' }}>(Defeat)</span>}
                                                  </div>
                                                  <div className='graph-team-two-summoners'>
                                                    {summonerColors.slice(5, 10).map((redSummoner, redSummonerIndex) =>
                                                      <ul style={{ padding: '0', margin: '1rem' }}>
                                                        <li>
                                                          <button onClick={() => { toggleSummonerGraphClick(redSummonerIndex + 5); getMatchData(index, redSummonerIndex + 5) }}
                                                            style={{
                                                              display: 'grid', placeItems: 'center', padding: '0.5rem', backgroundColor: summonerColors[redSummonerIndex + 5], cursor: 'pointer',
                                                              opacity: toggleSummonerGraph[redSummonerIndex + 5] == true ? '' : '0.3'
                                                            }}>{toggleSummonerGraph[redSummonerIndex + 5] == true ?
                                                              <span style={{ position: 'absolute', color: COLORS.white, fontSize: '26px', fontWeight: '700', marginBottom: '4rem' }}>&#10003;</span>
                                                              : <span style={{ position: 'absolute', color: COLORS.white, fontSize: '26px', fontWeight: '700', marginBottom: '4rem' }}>&#10005;</span>}
                                                            <img src={`${ddragonPath}/champion/${gameData.info.participants[redSummonerIndex + 5].championName}.png`} width='40' height='40' style={{ borderRadius: '4px' }}></img>
                                                          </button>
                                                        </li>
                                                      </ul>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <>
                                                <ResponsiveContainer width="100%" aspect={3}>
                                                  <LineChart data={matchData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis tickFormatter={(label) => `${label} min`} />
                                                    <Tooltip />
                                                    <Legend />
                                                    {toggleGraphs[0] === true ?
                                                      <>
                                                        {toggleSummonerGraph.map((summoner, index) => (
                                                          <>
                                                            {summoner === true ?
                                                              <>
                                                                <Line name={gameData.info.participants[index].summonerName} type="monotone" dataKey={`participantFrames.${index + 1}.totalGold`} strokeWidth={5} stroke={`${summonerColors[index]}`} />
                                                                <YAxis tickFormatter={(label) => `${label / 1000}K`} />
                                                              </>
                                                              :
                                                              <></>
                                                            }
                                                          </>
                                                        ))}
                                                      </>
                                                      :
                                                      toggleGraphs[1] === true ?
                                                        <>
                                                          {toggleSummonerGraph.map((summoner, index) => (
                                                            <>
                                                              {summoner === true ?
                                                                <>
                                                                  <Line name={gameData.info.participants[index].summonerName} type="monotone" dataKey={`participantFrames.${index + 1}.xp`} strokeWidth={5} stroke={`${summonerColors[index]}`} />
                                                                  <YAxis tickFormatter={(label) => `${label / 1000}K`} />
                                                                </>
                                                                :
                                                                <></>
                                                              }
                                                            </>
                                                          ))}
                                                        </>
                                                        :
                                                        toggleGraphs[2] === true ?
                                                          <>
                                                            {toggleSummonerGraph.map((summoner, index) => (
                                                              <>
                                                                {summoner === true ?
                                                                  <>
                                                                    <Line name={gameData.info.participants[index].summonerName} type="monotone" dataKey={`participantFrames.${index + 1}.minionsKilled`} strokeWidth={5} stroke={`${summonerColors[index]}`} />
                                                                    {gameData.info.gameMode === 'ARAM' ? <></> : <Line name={gameData.info.participants[index].summonerName} type="monotone" dataKey={`participantFrames.${index + 1}.jungleMinionsKilled`} strokeWidth={5} stroke={`${summonerColors[index]}`} />}
                                                                    <YAxis tickFormatter={(label) => `${label}`} />
                                                                  </>
                                                                  :
                                                                  <></>
                                                                }
                                                              </>
                                                            ))}
                                                          </>
                                                          :
                                                          toggleGraphs[3] === true ?
                                                            <>
                                                              {toggleSummonerGraph.map((summoner, index) => (
                                                                <>
                                                                  {summoner === true ?
                                                                    <>
                                                                      <Line name={gameData.info.participants[index].summonerName} type="monotone" dataKey={`participantFrames.${index + 1}.damageStats.totalDamageDoneToChampions`} strokeWidth={5} stroke={`${summonerColors[index]}`} />
                                                                      <YAxis tickFormatter={(label) => `${label / 1000}K`} />
                                                                    </>
                                                                    :
                                                                    <></>
                                                                  }
                                                                </>
                                                              ))}
                                                            </>
                                                            :
                                                            <>
                                                            </>
                                                    }
                                                  </LineChart>
                                                </ResponsiveContainer>
                                              </>
                                            </div>
                                          </>
                                          :
                                          <>
                                          </>
                                  }
                                </>
                                :
                                <>
                                </>
                              }
                            </div>
                          </>
                          :
                          <>
                          </>
                        }</>
                    )}
                  </>
                )}
                <div className='third-container'>
                  <button className='show-more-button' onClick={() => { getPlayerGames(counter); getMatchTimeline(counter); updateChampionCounter() }}>Show More Games</button>
                </div>
              </div>
            </>
            :
            <>
              {console.log('Summoner not found. Try again.')}
              <div style={{ textAlign: 'center' }}>
                <img src={`background-displays/${backgroundDisplayCounter}.gif`} width='70%'></img>
              </div>
            </>
          }
        </>
      }
    </div>
  );
}

export default App;