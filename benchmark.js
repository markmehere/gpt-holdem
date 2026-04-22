require("./poker.js");

const seedrandom = require("seedrandom");
const fs = require("fs");
const { JSONFilePreset } = require("lowdb/node");
const externalgpt = require("./external/gptholdem");

const debug = false;
const use_external = true;

global.externalPlay = async (you, table, run, rand) => {
  if (debug) {
    console.log(you);
    console.log(table);
    console.log(run.runBetterMonte())
  }
  if (use_external) {
    return await externalgpt.gptHoldemPlay(you, table, run, rand);
  }
  else {
    return { type: 'all-in' };
  }
}

const NO_OF_MATCHES = 4;

const seeder =  '8QEO5tHIK7CsmDDf7rIhlKVJu3qK2oQs8lWjxlvy7lGANG5uLwTc19TlH8MIU7M1'
              + 'udpK0WrnCEUob2uwuWvqPX42wWhV0TG4rNmztIm7YKyiaQs2rhGIGsYyIFkVsNZQ'
              + 'wF7oJy58bN1l12TCvXBp4E45Pxtov9CKIxeRO0ePOdRhTMSGMFrG4WCteWt8vzEh'
              + 'S2WrJ9ymNoem9mW90nqt0uebNhZDQlXlGmumvUoJVJEXrp9lYcuqsoTziJKF0nsO'
              + 'ksqPYc27GOMVvPDJDVsQHJv7Y9L890Hs2xxyIneFeSwRaNnVolEfiBYLQczrrewW'
              + 'nDHZqp6B32nHZFhFKECzddQ5F2GDbU4BGXrA8gKZpRwo4sqpg6RlyAMzN4IMYS5F';

console.log("using seed: " + seeder.substring(0, 4))

function getSeed(i) {
  return seeder.substr((i * 4) % 512, 4) + seeder.substr((10 + i * 3) % 500, 3) + seeder.substr((10 + i * 2) % 200, 2);
}

let settings = [
  "gbr",
  "mccfrfinisher",
  "mccfr",
  "gptholdem",
  "wildlike",
  "alwaysallin",
  "amalgamatedalt"
];
const tally = [0, 0, 0, 0, 0, 0, 0];
const tlen = [0, 0, 0, 0, 0, 0, 0];
const details = [];
let actions = [];

async function run() {
  // Setup lowdb
  const db = await JSONFilePreset(`bcache${seeder.substring(0, 4)}.json`, { cache: {} });
  await db.read();
  let dbKeyCount = Object.keys(db.data.cache).length;

  if (dbKeyCount > 400e3) {
    console.log("purging cache to 400,000 keys...");
    const keys = Object.keys(db.data.cache);
    for (let i = 0; dbKeyCount > 398e3; i++) {
      delete db.data.cache[keys[i]];
      dbKeyCount--;
    }
    db.write()
    console.log("cache purge complete")
  }

  const getMonteHash = (board, player, nopp, n, seed) => {
    return `${board.join(',')};${player.join(',')};${nopp};${n};${seed}`;
  };

  for (let i = 0; i < NO_OF_MATCHES; i++) {
    for (let pos = 0; pos < settings.length; pos++) {
      const table = new global.Poker.Table(2, 'smalls');

      for (let cpi = 0; cpi < settings.length; cpi++) {
        const tpi = (settings.length + cpi - pos) % settings.length;
        table.AddComputerPlayer(`P${tpi + 1} ${settings[tpi]}`, 40, settings[tpi]);
      }

      const seed = getSeed(i);
      const rand = seedrandom(seed);
      const cacher = (
        board, player, nopp, n, style
      ) => {
        const boardSnap = [ ...board ];
        const playerSnap = [ ...player ];
        const altSeed = `${i * 4 + pos}${boardSnap.join('')}${playerSnap.join('')}${style ? '-' + style : ''}`;
        const key = getMonteHash(boardSnap, playerSnap, nopp, n, altSeed);
        let result = db.data.cache[key];
        if (result) return result;
        return {
          seed: altSeed,
          generator: seedrandom(altSeed),
          callback: async (result) => {
            db.data.cache[key] = result;
          }
        };
      };

      let curlen = 0;
      actions.push(`BEGIN ${seed} {\n`);
      do {
        curlen++;
        table.Deal(rand);

        table.players.forEach((player) => {
          player.SetMonteRandom(rand, cacher);
        });

        let curRound = table.game.roundName;

        do {
          const initRoundname = table.game.roundName;
          const activePlayer = table.players[table.currentPlayer];
          const interaction = await table.needsInteraction(false, true);
          if (interaction && activePlayer && table.game.board.length && initRoundname !== 'Deal') {
            const betAmt = table.game.roundName === initRoundname ? table.game.bets[activePlayer.index] : table.game.clearedBets[activePlayer.index];
            actions.push(`  ${activePlayer.playerName}: ${interaction} with ${JSON.stringify(activePlayer.cards)}/${JSON.stringify(table.game.board)} (${betAmt})`);
          }
          else if (interaction && activePlayer) {
            const betAmt = table.game.roundName === initRoundname ? table.game.bets[activePlayer.index] : table.game.clearedBets[activePlayer.index];
            actions.push(`  ${activePlayer.playerName}: ${interaction} with ${JSON.stringify(activePlayer.cards)} (${betAmt})`);
          }
          else if (table.game.board.length) {
            actions.push('  ' + JSON.stringify(initRoundname !== table.game.roundName && table.game.roundName !== "Showdown" ? table.game.board.slice(0, table.game.board.length - 1) : table.game.board));
          }
          curRound = table.game.roundName;
        } while (curRound !== 'Showdown');
        actions.push(`  WINNER: ${(table.gameWinners.map(x => `${x.player.playerName}/${x.amount} with ${x.hand?.message || 'fold out'}`)).join(' ')}\n`);
      } while (!table.matchWinner);

      actions.push(`} /* END ${seed} */\n\n`);

      const twi = (settings.length + table.matchWinner.index - pos) % settings.length;
      tally[twi]++;
      tlen[twi] += curlen;
      details.push(`${settings[twi]}-${twi} won in seat ${table.matchWinner.index} with seed ${seed}`)
    }
    if (Object.keys(db.data.cache).length > dbKeyCount) {
      console.log("writing cache...")
      db.write();
      dbKeyCount = Object.keys(db.data.cache).length;
    }
    else {
      console.log("run completed from cache...")
    }
  }
}

run().then(() => {
  console.log(details);
  const results = settings.map((setting, i) => [ setting, tally[i], tlen[i] / Math.max(tally[i], 1) ]);
  console.log(results);
  fs.writeFileSync(
    `results/benchmark-result-${seeder.substring(0, 4)}.txt`,
    `/*\n[  \n  ${results.map(c => JSON.stringify(c).replace(/"/g, "'")).join(',\n  ')}\n]\n*/\n\n` + actions.join('\n')
  );
});
