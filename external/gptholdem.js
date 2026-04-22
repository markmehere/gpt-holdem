var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// external/gptholdem.ts
var gptholdem_exports = {};
__export(gptholdem_exports, {
  gptHoldemPlay: () => gptHoldemPlay
});
module.exports = __toCommonJS(gptholdem_exports);

// external/embedding.ts
var allNominations = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
var PreFlopOffsuit = {
  A: { A: 85.3, K: 65.4, Q: 64.5, J: 63.6, T: 62.9, 9: 60.9, 8: 60.1, 7: 59.1, 6: 57.8, 5: 57.7, 4: 56.4, 3: 55.6, 2: 54.6 },
  K: { A: 65.4, K: 82.4, Q: 61.4, J: 60.6, T: 59.9, 9: 58, 8: 56.3, 7: 55.4, 6: 54.3, 5: 53.3, 4: 52.1, 3: 51.2, 2: 50.2 },
  Q: { A: 64.5, K: 61.4, Q: 79.9, J: 58.2, T: 57.4, 9: 55.5, 8: 53.8, 7: 51.9, 6: 51.1, 5: 50.2, 4: 49, 3: 47.9, 2: 47 },
  J: { A: 63.6, K: 60.6, Q: 58.2, J: 77.5, T: 55.4, 9: 53.4, 8: 51.7, 7: 49.9, 6: 47.9, 5: 47.1, 4: 46.1, 3: 45, 2: 44 },
  T: { A: 62.9, K: 59.9, Q: 57.4, J: 55.4, T: 75.1, 9: 51.7, 8: 50, 7: 48.2, 6: 46.3, 5: 44.2, 4: 43.4, 3: 42.4, 2: 41.5 },
  9: { A: 60.9, K: 58, Q: 55.5, J: 53.4, T: 51.7, 9: 72.1, 8: 48.4, 7: 46.7, 6: 44.9, 5: 42.9, 4: 40.7, 3: 39.9, 2: 38.9 },
  8: { A: 60.1, K: 56.3, Q: 53.8, J: 51.7, T: 50, 9: 48.4, 8: 69.1, 7: 45.5, 6: 43.6, 5: 41.7, 4: 39.6, 3: 37.5, 2: 36.8 },
  7: { A: 59.1, K: 55.4, Q: 51.9, J: 49.9, T: 48.2, 9: 46.7, 8: 45.5, 7: 66.2, 6: 42.7, 5: 40.8, 4: 38.6, 3: 36.6, 2: 34.6 },
  6: { A: 57.8, K: 54.3, Q: 51.1, J: 47.9, T: 46.3, 9: 44.9, 8: 43.6, 7: 42.7, 6: 63.3, 5: 40.1, 4: 38, 3: 35.9, 2: 34 },
  5: { A: 57.7, K: 53.3, Q: 50.2, J: 47.1, T: 44.2, 9: 42.9, 8: 41.7, 7: 40.8, 6: 40.1, 5: 60.3, 4: 37.9, 3: 35.8, 2: 33.9 },
  4: { A: 56.4, K: 52.1, Q: 49, J: 46.1, T: 43.4, 9: 40.7, 8: 39.6, 7: 38.6, 6: 38, 5: 37.9, 4: 57, 3: 34.4, 2: 32.5 },
  3: { A: 55.6, K: 51.2, Q: 47.9, J: 45, T: 42.4, 9: 39.9, 8: 37.5, 7: 36.6, 6: 35.9, 5: 35.8, 4: 34.4, 3: 53.7, 2: 31.2 },
  2: { A: 54.6, K: 50.2, Q: 47, J: 44, T: 41.5, 9: 38.9, 8: 36.8, 7: 34.6, 6: 34, 5: 33.9, 4: 32.5, 3: 31.2, 2: 50.3 }
};
var PreFlopSuited = {
  A: { A: NaN, K: 67, Q: 66.1, J: 65.4, T: 64.7, 9: 63, 8: 62.1, 7: 61.1, 6: 60, 5: 59.9, 4: 58.9, 3: 58, 2: 57 },
  K: { A: 67, K: NaN, Q: 63.4, J: 62.6, T: 61.9, 9: 60, 8: 58.5, 7: 57.8, 6: 56.8, 5: 55.8, 4: 54.7, 3: 53.8, 2: 52.9 },
  Q: { A: 66.1, K: 63.4, Q: NaN, J: 60.3, T: 59.5, 9: 57.9, 8: 56.2, 7: 54.5, 6: 53.8, 5: 52.9, 4: 51.7, 3: 50.7, 2: 49.9 },
  J: { A: 65.4, K: 62.6, Q: 60.3, J: NaN, T: 57.5, 9: 55.8, 8: 54.2, 7: 52.4, 6: 50.8, 5: 50, 4: 49, 3: 47.9, 2: 47.1 },
  T: { A: 64.7, K: 61.9, Q: 59.5, J: 57.5, T: NaN, 9: 54.3, 8: 52.6, 7: 51, 6: 49.2, 5: 47.2, 4: 46.4, 3: 45.5, 2: 44.7 },
  9: { A: 63, K: 60, Q: 57.9, J: 55.8, T: 54.3, 9: NaN, 8: 51.1, 7: 49.5, 6: 47.7, 5: 45.9, 4: 43.8, 3: 43.2, 2: 42.3 },
  8: { A: 62.1, K: 58.5, Q: 56.2, J: 54.2, T: 52.6, 9: 51.1, 8: NaN, 7: 48.2, 6: 46.5, 5: 44.8, 4: 42.7, 3: 40.8, 2: 40.3 },
  7: { A: 61.1, K: 57.8, Q: 54.5, J: 52.4, T: 51, 9: 49.5, 8: 48.2, 7: NaN, 6: 45.7, 5: 43.8, 4: 41.8, 3: 40, 2: 38.1 },
  6: { A: 60, K: 56.8, Q: 53.8, J: 50.8, T: 49.2, 9: 47.7, 8: 46.5, 7: 45.7, 6: NaN, 5: 43.2, 4: 41.4, 3: 39.4, 2: 37.5 },
  5: { A: 59.9, K: 55.8, Q: 52.9, J: 50, T: 47.2, 9: 45.9, 8: 44.8, 7: 43.8, 6: 43.2, 5: NaN, 4: 41.1, 3: 39.3, 2: 37.5 },
  4: { A: 58.9, K: 54.7, Q: 51.7, J: 49, T: 46.4, 9: 43.8, 8: 42.7, 7: 41.8, 6: 41.4, 5: 41.1, 4: NaN, 3: 38, 2: 36.3 },
  3: { A: 58, K: 53.8, Q: 50.7, J: 47.9, T: 45.5, 9: 43.2, 8: 40.8, 7: 40, 6: 39.4, 5: 39.3, 4: 38, 3: NaN, 2: 35.1 },
  2: { A: 57, K: 52.9, Q: 49.9, J: 47.1, T: 44.7, 9: 42.3, 8: 40.3, 7: 38.1, 6: 37.5, 5: 37.5, 4: 36.3, 3: 35.1, 2: NaN }
};
var getPreFlopOddsDecimal = (cards) => {
  const card1 = cards[0].replace("10", "T");
  const card2 = cards[1].replace("10", "T");
  const isSuited = card1[1] === card2[1];
  const card1Value = card1[0] > "9" ? card1[0] : parseInt(card1[0], 10);
  const card2Value = card2[0] > "9" ? card2[0] : parseInt(card2[0], 10);
  if (isSuited) {
    return PreFlopSuited[card1Value][card2Value] / 100;
  } else {
    return PreFlopOffsuit[card1Value][card2Value] / 100;
  }
};
function getMaxBet(bets, table) {
  return Math.max(
    bets.reduce((acc, val) => Math.max(acc, val), 0),
    table.roundName === "Deal" ? table.bigBlind : 0
  );
}
function makePlayerEmbedding(player, table, choice, amountBet, run) {
  const getPersonality = () => {
    if (!player.inferences) return 0;
    if (player.inferences.always) {
      switch (player.inferences.always) {
        case "all-in":
          return 1;
        case "raise":
          return 0.96;
        case "call":
          return 0.9;
      }
    }
    ;
    const earlyFold = player.history.reduce((acc, hist) => {
      if (hist[0].find((x) => x.type === "fold") || hist[1].find((x) => x.type === "fold")) return acc + 1;
      return acc;
    }, 0);
    switch (player.inferences.style) {
      case "fearless":
        return (1 - earlyFold / player.totalHands) * 0.75 + 0.1;
      case "conservative":
        return -0.1 + earlyFold / player.totalHands * -0.9;
      default:
        return earlyFold / player.totalHands * 0.1 - 0.05;
    }
  };
  const getPersonalityAdjusted = () => {
    return getPersonality() * Math.min(player.totalHands + 2, 4) / 4;
  };
  const mySuits = (suit) => {
    return (player.cards[0][player.cards[0].length - 1] === suit ? 1 : 0) + (player.cards[1][player.cards[1].length - 1] === suit ? 1 : 0);
  };
  const boardSuits = (suit) => {
    return [0, 1, 2, 3, 4].reduce((acc, ind) => acc + (table.board[ind] && table.board[ind][table.board[ind].length - 1] === suit ? 1 : 0), 0);
  };
  const rank = (card) => {
    return 14 - allNominations.indexOf(card.substring(0, card.length - 1));
  };
  const straightWithGap = (cards) => {
    const gapCards = [];
    const topCards = [];
    const ranks = cards.map((card) => rank(card)).filter((idx) => idx !== -1);
    if (ranks.includes(14)) ranks.push(1);
    const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);
    for (let start = -1; start <= 8; start++) {
      let needed = 0;
      for (let offset = 0; offset < 5; offset++) {
        if (!uniqueRanks.includes(start + offset)) needed++;
      }
      if (needed === 1) gapCards.push(start);
      if (needed === 0) topCards.push(start + 5);
    }
    return { gaps: gapCards.reverse(), tops: topCards.reverse() };
  };
  const board = table.board || [];
  const boardGaps = straightWithGap(board);
  const myGaps = straightWithGap(board.concat(player.cards));
  const duplicates = (cards, required = -2) => {
    let masterCount = 0;
    let tentative = 0;
    for (let which = 14; which > 1; which--) {
      let count = 0;
      for (let ind = 0; ind < cards.length; ind++) {
        if (rank(cards[ind]) === which) count++;
      }
      if (count === required) return which;
      if (count === 2 && required == -2) {
        if (tentative < which) tentative = which;
        masterCount++;
      }
    }
    ;
    if (masterCount > 2) return tentative + 14;
    return tentative;
  };
  const maxbet = getMaxBet(table.bets, table);
  const postFlopProbs = table.board.length > 2 ? run.runBetterMonte() : { win: 0, draw: 0, loss: 0 };
  return {
    chips: player.chips / table.smallBlind,
    required: (maxbet - table.bets[player.index]) / Math.max(player.chips, 1),
    matchShare: player.chips / (table.players.reduce((acc, p) => acc + p.chips, 0) + table.pot + table.bets.reduce((acc, b) => acc + b, 0)),
    personality: getPersonalityAdjusted(),
    whichPlayer: player.index,
    stillLeft: table.players.filter((x) => !x.bankrupt && !x.folded).length,
    revealed: table.board.length / 5,
    boardSpades: boardSuits("S") / 5,
    mySpades: mySuits("S") / 2,
    boardHearts: boardSuits("H") / 5,
    myHearts: mySuits("H") / 2,
    boardDiamonds: boardSuits("D") / 5,
    myDiamonds: mySuits("D") / 2,
    boardClubs: boardSuits("C") / 5,
    myClubs: mySuits("C") / 2,
    boardStraights: (boardGaps.tops.length ? boardGaps.tops[0] + 14 : boardGaps.gaps[0] || 0) / 28,
    myStraights: (myGaps.tops.length ? myGaps.tops[0] + 14 : myGaps.gaps[0] || 0) / 28,
    boardHighcard: table.board.reduce((acc, card) => Math.max(acc, rank(card)), 0) / 14,
    myHighcard: Math.max(player.cards.concat(table.board).reduce((acc, card) => Math.max(acc, rank(card)), 0)) / 14,
    boardPairs: duplicates(table.board) / 28,
    myPairs: duplicates(player.cards.concat(table.board)) / 28,
    boardThrees: duplicates(table.board, 3) / 14,
    myThrees: duplicates(player.cards.concat(table.board), 3) / 14,
    boardFours: duplicates(table.board, 4) / 14,
    myFours: duplicates(player.cards.concat(table.board), 4) / 14,
    myPreflop: table.board.length > 2 ? postFlopProbs.win + postFlopProbs.draw / 2 : getPreFlopOddsDecimal(player.cards),
    hiddenRequired: maxbet - table.bets[player.index],
    hiddenSmall: table.smallBlind,
    hiddenMinimumRaise: table.minimumRaise,
    hiddenChips: player.chips,
    raisesTakenRatio: player.totalHands < 2 || player.raisesLeft + player.raisesTaken < 1 ? 0.5 : player.raisesTaken / (player.raisesLeft + player.raisesTaken),
    totalHandsPlayed: player.totalHands,
    foldsOnFirstRatio: player.history.slice(0, player.totalHands).reduce((acc, hist) => acc + (hist[0].find((x) => x.type === "fold") ? 1 : 0), 0) / Math.max(1, player.totalHands),
    totalRelFirstBets: player.totalRelFirstBets / Math.max(1, player.totalHands) * 2,
    totalRelOtherBets: player.totalRelOtherBets / Math.max(1, player.totalHands) * 2,
    didFoldRatio: player.history.slice(0, player.totalHands).reduce((acc, hist) => acc + (hist.find((x) => x.find((y) => y.type === "fold")) ? 1 : 0), 0) / Math.max(1, player.totalHands),
    allInStreak: player.history.slice(-5).reduce((acc, x) => {
      if (!x || !x[0] || !x[0][0]) return acc;
      if (x[0][0].type === "all-in") return acc + 1;
      if (x.reduce((acc2, y) => acc2 || y.reduce((acc3, z) => acc3 || z.type === "all-in", false), false)) return acc + 0.5;
      return acc;
    }, 0) / 5,
    amountBet,
    choice
  };
}
function prepareTableEmbedding(you, embedding) {
  const dropYou = (arr) => arr.filter((_, i) => embedding.indicies[i] !== you.index);
  const personalities = dropYou(embedding.personalities);
  const foldsOnFirstRatio = dropYou(embedding.foldsOnFirstRatio);
  const raisesTakenRatio = dropYou(embedding.raisesTakenRatio);
  const matchShare = dropYou(embedding.matchShare);
  const allInStreak = dropYou(embedding.allInStreak);
  return [
    embedding.playersLeft,
    embedding.handsPlayed,
    Math.min(...personalities),
    personalities.reduce((acc, val) => acc + val) / personalities.length,
    Math.max(...personalities),
    Math.min(...foldsOnFirstRatio),
    foldsOnFirstRatio.reduce((acc, val) => acc + val) / foldsOnFirstRatio.length,
    Math.max(...foldsOnFirstRatio),
    Math.min(...raisesTakenRatio),
    raisesTakenRatio.reduce((acc, val) => acc + val) / raisesTakenRatio.length,
    Math.max(...raisesTakenRatio),
    Math.min(...matchShare),
    matchShare.reduce((acc, val) => acc + val) / matchShare.length,
    Math.max(...matchShare),
    Math.max(...allInStreak),
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];
}
function prepareEmbedding(embedding, player, you, playerCount, raiseRules) {
  const choiceAsNumber = () => {
    const interaction = embedding.choice.toLowerCase();
    if (interaction === "fold") return -1;
    else if (interaction === "call") return 0;
    else if (interaction === "check") return 0;
    else if (interaction.startsWith("bet")) {
      switch (raiseRules) {
        case "smalls":
          return (parseInt(interaction.replace("bet ", ""), 10) - embedding.hiddenRequired) / embedding.hiddenSmall;
        case "social":
          return (parseInt(interaction.replace("bet ", ""), 10) - (embedding.hiddenRequired + embedding.hiddenSmall)) / embedding.hiddenSmall;
        case "standard":
          return (parseInt(interaction.replace("bet ", ""), 10) - (embedding.hiddenRequired + embedding.hiddenMinimumRaise - embedding.hiddenSmall)) / embedding.hiddenSmall;
      }
    } else if (interaction === "all in") return 100;
    return 0;
  };
  const mappedChoiceAsNumber = () => {
    const result = choiceAsNumber();
    if (result === void 0) return 0;
    else if (result < -1) return -1;
    else if (result > 99) return 7;
    else if (result > 6) return 6;
    return result;
  };
  if (player.index === you.index) {
    return new Float32Array([
      embedding.chips,
      embedding.required,
      embedding.matchShare,
      0,
      0,
      embedding.stillLeft,
      embedding.revealed,
      embedding.boardSpades,
      embedding.mySpades,
      embedding.boardHearts,
      embedding.myHearts,
      embedding.boardDiamonds,
      embedding.myDiamonds,
      embedding.boardClubs,
      embedding.myClubs,
      embedding.boardStraights,
      embedding.myStraights,
      embedding.boardHighcard,
      embedding.myHighcard,
      embedding.boardPairs,
      embedding.myPairs,
      embedding.boardThrees,
      embedding.myThrees,
      embedding.boardFours,
      embedding.myFours,
      embedding.myPreflop,
      0
    ]);
  } else {
    return new Float32Array([
      embedding.chips,
      embedding.amountBet / embedding.hiddenSmall,
      embedding.matchShare,
      embedding.personality,
      // if you are fifth (4) of 8, the first (0) player is index 4 to you
      (embedding.whichPlayer - you.index + playerCount) % playerCount,
      embedding.stillLeft,
      embedding.revealed,
      embedding.raisesTakenRatio,
      embedding.totalHandsPlayed,
      embedding.foldsOnFirstRatio,
      embedding.totalRelFirstBets,
      embedding.totalRelOtherBets,
      embedding.didFoldRatio,
      (embedding.amountBet - embedding.hiddenRequired) / embedding.hiddenSmall,
      embedding.amountBet / Math.max(embedding.hiddenChips + embedding.amountBet, 1),
      embedding.allInStreak,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      mappedChoiceAsNumber()
    ]);
  }
}

// external/gptholdem.ts
var ort = null;
try {
  if (typeof window !== "undefined" && window.ort) {
    ort = window.ort;
  } else {
    ort = require("onnxruntime-node");
  }
} catch (e) {
  console.error("ONNX Runtime not found. Please install onnxruntime-node or onnxruntime-web.");
  ort = null;
}
var blockSize = 26;
var n_embd = 27;
var temperature = 0.8;
var k3 = 0.54;
var k2 = 0.48;
var k1 = 0.22;
function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}
function sampleFromProbs(probs, rand) {
  let r = rand();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.length - 1;
}
function chooseTokenWithProbs(probs, minToken, maxToken, temperature2, rand) {
  const scaled = probs.map((p) => Math.pow(p, 1 / temperature2));
  const sum = scaled.slice(minToken, maxToken + 1).reduce((a, b) => a + b, 0);
  const norm = scaled.slice(minToken, maxToken + 1).map((p) => p / sum);
  const idx = sampleFromProbs(norm, rand);
  return minToken + idx;
}
var _session;
async function getSession() {
  if (!ort) throw new Error("ONNX Runtime not available");
  if (_session) return _session;
  let providers = [];
  if (ort.env && ort.env.webgpu) providers.push("webgpu");
  if (typeof window !== "undefined") providers.push("wasm");
  providers.push("cpu");
  try {
    _session = await ort.InferenceSession.create("poker.onnx", { logSeverityLevel: 3, executionProviders: providers });
  } catch (e) {
    _session = await ort.InferenceSession.create("poker.onnx", { logSeverityLevel: 3, executionProviders: ["cpu"] });
  }
  return _session;
}
async function gptHoldemPlay(you, table, run, rand) {
  const session = await getSession();
  if (!session) throw new Error("No ONNX session");
  const data = new Float32Array(blockSize * n_embd);
  const mask = new Uint8Array(blockSize);
  const embLen = table.embeddings.length;
  const playEmbedding = makePlayerEmbedding(you, table, "call", 0, run);
  for (let i = 1; i < blockSize; i++) {
    if (i === blockSize - 1) {
      const vec = prepareEmbedding(playEmbedding, you, you, table.players.length, "smalls");
      for (let j = 0; j < n_embd; j++) data[i * n_embd + j] = vec[j];
      mask[i] = 1;
    } else if (i >= blockSize - embLen - 1) {
      const embedding = table.embeddings[i - (blockSize - embLen - 1)];
      const player = table.players.find((p) => p.index === embedding.whichPlayer);
      const vec = prepareEmbedding(embedding, player, you, table.players.length, "smalls");
      for (let j = 0; j < n_embd; j++) data[i * n_embd + j] = vec[j];
      mask[i] = 1;
    } else {
      for (let j = 0; j < n_embd; j++) data[i * n_embd + j] = 0;
      mask[i] = 0;
    }
  }
  const firstOne = mask.findIndex((m) => m === 1);
  const tvec = prepareTableEmbedding(you, table.tableEmbedding);
  for (let j = 0; j < n_embd; j++) data[Math.max(firstOne - 1, 0) * n_embd + j] = tvec[j];
  mask[Math.max(firstOne - 1, 0)] = 1;
  const feeds = {
    x: new ort.Tensor("float32", data, [1, blockSize, n_embd]),
    mask: new ort.Tensor("bool", mask, [1, blockSize])
  };
  const output = await session.run(feeds);
  const logitsKey = Object.keys(output)[0];
  const logitsTensor = output[logitsKey];
  const logitsArr = logitsTensor.data;
  let lastIdx = blockSize - 1;
  for (let i = blockSize - 1; i >= 0; --i) {
    if (mask[i]) {
      lastIdx = i;
      break;
    }
  }
  const vocabSize = 9;
  const logits = logitsArr.length === vocabSize ? logitsArr : logitsArr.slice(0, vocabSize);
  if (logits.length !== vocabSize) {
    throw new Error("Logits extraction failed");
  }
  let choice = 0;
  const probs = softmax(logits);
  if (probs[0] > k2) {
    choice = 0;
  } else if (probs[0] > k1) {
    choice = chooseTokenWithProbs(probs, 0, 8, temperature, rand);
  } else if (probs[1] > k3) {
    choice = chooseTokenWithProbs(probs, 1, 8, temperature, rand);
  } else {
    choice = chooseTokenWithProbs(probs, 2, 8, temperature, rand);
  }
  if (choice === 0) {
    return { type: "fold" };
  } else if (choice === 8) {
    return { type: "all-in" };
  } else if (choice === 1) {
    return { type: "call" };
  } else {
    return { type: "raise-to", level: choice - 1, foldIfBeyond: false };
  }
}
