export const ddragonPath = '/ddragon-12.13.1/12.13.1/img'; // https://developer.riotgames.com/docs/lol (patch specific folder for images)

// https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/
export const profileIcons = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/';
export const summonerIcons = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/';
export const summonerRunes = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/';
export const summonerRunesStats = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/'
export const championIcons = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/';
export const championSkins = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/';

export const summonerColors = [['#3366FF'], ['#99FFFF'], ['#0099FF'], ['#00CCCC'], ['#66B2FF'], ['#990000'], ['#990099'], ['#FF3399'], ['#FF9999'], ['#FF0000']];
export const regions = [{ value: 'na1', label: 'North America' }, { value: 'euw1', label: 'Europe West' }, { value: 'eun', label: 'Europe Nordic' }, { value: 'kr', label: 'Korea' }, 
{ value: 'jp1', label: 'Japan' }, { value: 'oc1', label: 'Oceania' }, { value: 'la1', label: 'Latin America 1' }, { value: 'la2', label: 'Latin America 2' }, { value: 'br1', label: 'Brazil', }, 
{ value: 'ru', label: 'Russia' }, { value: 'tr1', label: 'Turkey' }];
export const getQueueType = { 'RANKED_SOLO_5x5': 'Ranked Solo', 'RANKED_FLEX_SR': 'Ranked Flex', "RANKED_TFT_DOUBLE_UP": 'TFT Double-Up' }
export const getDivision = { 'I': '1', 'II': '2', 'III': '3', 'IV': '4' };
export const precisionRuneTree = [['presstheattack/presstheattack', 'lethaltempo/lethaltempotemp', 'fleetfootwork/fleetfootwork', 'conqueror/conqueror'], ['overheal', 'triumph', 'presenceofmind/presenceofmind',
  'legendalacrity/legendalacrity', 'legendtenacity/legendtenacity', 'legendbloodline/legendbloodline', 'coupdegrace/coupdegrace', 'cutdown/cutdown']];
export const dominationRuneTree = [['electrocute/electrocute', 'predator/predator', 'darkharvest/darkharvest', 'hailofblades/hailofblades'], [
  'cheapshot/cheapshot', 'tasteofblood/greenterror_tasteofblood', 'suddenimpact/suddenimpact', 'zombieward/zombieward', 'ghostporo/ghostporo', 'eyeballcollection/eyeballcollection'], [
  'treasurehunter/treasurehunter', 'ingenioushunter/ingenioushunter', 'relentlesshunter/relentlesshunter', 'ultimatehunter/ultimatehunter']];
export const sorceryRuneTree = [['summonaery/summonaery', 'arcanecomet/arcanecomet', 'phaserush/phaserush'], ['nullifyingorb/pokeshield', 'manaflowband/manaflowband',
  'nimbuscloak/6361', 'transcendence/transcendence', 'celerity/celeritytemp', 'absolutefocus/absolutefocus', 'scorch/scorch', 'waterwalking/waterwalking', 'gatheringstorm/gatheringstorm']];
export const inspirationRuneTree = [['glacialaugment/glacialaugment', 'unsealedspellbook/unsealedspellbook', 'firststrike/firststrike'], ['hextechflashtraption/hextechflashtraption', 'magicalfootwear/magicalfootwear',
  'perfecttiming/perfecttiming', 'futuresmarket/futuresmarket', 'miniondematerializer/miniondematerializer', 'biscuitdelivery/biscuitdelivery', 'cosmicinsight/cosmicinsight']];
export const resolveRuneTree = [['graspoftheundying/graspoftheundying', 'veteranaftershock/veteranaftershock', 'guardian/guardian'], ['demolish/demolish', 'fontoflife/fontoflife', 'mirrorshell/mirrorshell',
  'conditioning/conditioning', 'secondwind/secondwind', 'boneplating/boneplating', 'overgrowth/overgrowth', 'revitalize/revitalize']];
export const statRuneTree = ['statmodsadaptiveforceicon', 'statmodsattackspeedicon', 'statmodscdrscalingicon', 'statmodsadaptiveforceicon', 'statmodsarmoricon', 'statmodsmagicresicon.magicresist_fix',
  'statmodshealthscalingicon', 'statmodsarmoricon', 'statmodsmagicresicon.magicresist_fix'];
export const COLORS = {
  white: '#ffffff', lightblack: '#1c1c1c', black: '#000000', lightgray: '#6f6f6f', gray: '#515163', grayhover: '#282830', darkgray: '#31313c', gold: '#bbb134', orange: '#cc6600',
  lightblue: '#a3cfec', blue: '#64b1e4', darkblue: '#1a78ae', lightred: '#e2b6b3', red: '#ff7777', darkred: '#c6443e', neutral: '#ffffcc', purple: '#b266ff'};

//takes an integer as parameter and returns the name of the spell
export function getSummonerSpell(spellId) {
  switch (spellId) {
    case 1:
      return 'summoner_boost.png';
    case 3:
      return 'summoner_exhaust.png';
    case 4:
      return 'summoner_flash.png';
    case 6:
      return 'summoner_haste.png';
    case 7:
      return 'summoner_heal.png';
    case 11:
      return 'summoner_smite.png';
    case 12:
      return 'summoner_teleport.png';
    case 13:
      return 'summonermana.png';
    case 14:
      return 'summonerignite.png';
    case 21:
      return 'summonerbarrier.png';
    case 32:
      return 'summoner_mark.png';
  }
}

//takes an integer as parameter and returns the name of the rune
export function getSummonerRunes(runeId) {
  switch (runeId) {
    case 8000:
      return '7201_precision.png';
    case 8005:
      return 'precision/presstheattack/presstheattack.png';
    case 8008:
      return 'precision/lethaltempo/lethaltempotemp.png';
    case 8009:
      return 'precision/presenceofmind/presenceofmind.png'
    case 8010:
      return 'precision/conqueror/conqueror.png';
    case 8014:
      return 'precision/coupdegrace/coupdegrace.png';
    case 8017:
      return 'precision/cutdown/cutdown.png';
    case 8021:
      return 'precision/fleetfootwork/fleetfootwork.png';
    case 8100:
      return '7200_domination.png';
    case 8105:
      return 'domination/relentlesshunter/relentlesshunter.png';
    case 8106:
      return 'domination/ultimatehunter/ultimatehunter.png';
    case 8112:
      return 'domination/electrocute/electrocute.png';
    case 8120:
      return 'domination/ghostporo/ghostporo.png';
    case 8124:
      return 'domination/predator/predator.png';
    case 8126:
      return 'domination/cheapshot/cheapshot.png';
    case 8128:
      return 'domination/darkharvest/darkharvest.png';
    case 8134:
      return 'domination/ingenioushunter/ingenioushunter.png';
    case 8135:
      return 'domination/treasurehunter/treasurehunter.png';
    case 8136:
      return 'domination/zombieward/zombieward.png';
    case 8138:
      return 'domination/eyeballcollection/eyeballcollection.png';
    case 8139:
      return 'domination/tasteofblood/greenterror_tasteofblood.png';
    case 8143:
      return 'domination/suddenimpact/suddenimpact.png';
    case 8200:
      return '7202_sorcery.png';
    case 8210:
      return 'sorcery/transcendence/transcendence.png';
    case 8214:
      return 'sorcery/summonaery/summonaery.png';
    case 8224:
      return 'sorcery/nullifyingorb/pokeshield.png';
    case 8226:
      return 'sorcery/manaflowband/manaflowband.png';
    case 8229:
      return 'sorcery/arcanecomet/arcanecomet.png';
    case 8230:
      return 'sorcery/phaserush/phaserush.png';
    case 8232:
      return 'sorcery/waterwalking/waterwalking.png';
    case 8233:
      return 'sorcery/absolutefocus/absolutefocus.png';
    case 8234:
      return 'sorcery/celerity/celeritytemp.png';
    case 8236:
      return 'sorcery/gatheringstorm/gatheringstorm.png';
    case 8237:
      return 'sorcery/scorch/scorch.png';
    case 8242:
      return 'sorcery/unflinching/unflinching.png';
    case 8275:
      return 'sorcery/nimbuscloak/6361.png';
    case 8299:
      return 'sorcery/laststand/laststand.png'
    case 8300:
      return '7203_whimsy.png';
    case 8304:
      return 'inspiration/magicalfootwear/magicalfootwear.png';
    case 8306:
      return 'inspiration/hextechflashtraption/hextechflashtraption.png';
    case 8313:
      return 'inspiration/perfecttiming/perfecttiming.png';
    case 8316:
      return 'inspiration/miniondematerializer/miniondematerializer.png';
    case 8321:
      return 'inspiration/futuresmarket/futuresmarket.png';
    case 8345:
      return 'inspiration/biscuitdelivery/biscuitdelivery.png';
    case 8347:
      return 'inspiration/cosmicinsight/cosmicinsight.png';
    case 8351:
      return 'inspiration/glacialaugment/glacialaugment.png';
    case 8352:
      return 'inspiration/timewarptonic/timewarptonic.png';
    case 8358:
      return 'inspiration/masterkey/masterkey.png';
    case 8360:
      return 'inspiration/unsealedspellbook/unsealedspellbook.png';
    case 8369:
      return 'inspiration/firststrike/firststrike.png';
    case 8400:
      return '7204_resolve.png';
    case 8401:
      return 'resolve/mirrorshell/mirrorshell.png';
    case 8410:
      return 'resolve/approachvelocity/approachvelocity.png';
    case 8429:
      return 'resolve/conditioning/conditioning.png';
    case 8437:
      return 'resolve/graspoftheundying/graspoftheundying.png';
    case 8439:
      return 'resolve/veteranaftershock/veteranaftershock.png'
    case 8444:
      return 'resolve/secondwind/secondwind.png'
    case 8446:
      return 'resolve/demolish/demolish.png';
    case 8451:
      return 'resolve/overgrowth/overgrowth.png';
    case 8453:
      return 'resolve/revitalize/revitalize.png';
    case 8463:
      return 'resolve/fontoflife/fontoflife.png';
    case 8465:
      return 'resolve/guardian/guardian.png';
    case 8473:
      return 'resolve/boneplating/boneplating.png';
    case 9101:
      return 'precision/overheal.png';
    case 9103:
      return 'precision/legendbloodline/legendbloodline.png';
    case 9104:
      return 'precision/legendalacrity/legendalacrity.png';
    case 9105:
      return 'precision/legendtenacity/legendtenacity.png';
    case 9111:
      return 'precision/triumph.png';
    case 9923:
      return 'domination/hailofblades/hailofblades.png';
    case 5001:
      return 'statmodshealthscalingicon.png';
    case 5002:
      return 'statmodsarmoricon.png';
    case 5003:
      return 'statmodsmagicresicon.magicresist_fix.png';
    case 5005:
      return 'statmodsattackspeedicon.png';
    case 5007:
      return 'statmodscdrscalingicon.png';
    case 5008:
      return 'statmodsadaptiveforceicon.png';
  }
}

//takes an integer as a parameter and returns the number of kills
export function getKillingSpree(killingSpree) {
  switch (killingSpree) {
    case 1:
      return null;
    case 2:
      return 'Double Kill';
    case 3:
      return 'Triple Kill';
    case 4:
      return 'Quadra Kill';
    case 5:
      return 'Penta Kill';
  }
}

//takes an integer as a parameter and returns the game mode for that specific game
export function getGameMode(queueId) {
  switch (queueId) {
    case 0:
      return 'Custom';
    case 400:
      return 'Normal Draft';
    case 420:
      return 'Ranked Solo';
    case 430:
      return 'Normal Blind';
    case 440:
      return 'Ranked Flex';
    case 450:
      return 'ARAM';
    case 700:
      return 'Clash';
    case 830:
      return 'Intro Bots';
    case 840:
      return 'Beginner Bots';
    case 850:
      return 'Intermediate Bots';
    case 900:
      return 'ARURF';
    case 1020:
      return 'One for All';
    case 1400:
      return 'Ultimate Spellbook';
  }
}