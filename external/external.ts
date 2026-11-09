export interface PlayerExternals {
  playerName: string;
  aiName: string;
  index: number;
  chips: number;
  initialChips: number;
  folded: boolean;
  allIn: boolean;
  bankrupt: boolean;
  cards: string[];
  totalFirstBets: number;
  totalOtherBets: number;
  totalRelFirstBets: number;
  totalRelOtherBets: number;
  raisesTaken: number;
  raisesLeft: number;
  totalHands: number;
  timesSeen: number;
  isHuman: boolean;
  sequoiaRating: number;
  history: {
    type: 'raise' | 'call' | 'fold' | 'all-in' | 'check' | 'show';
    level?: number;
    cards?: string[];
  }[][][];
  inferences?: {
    always: 'call' | 'raise' | 'all-in' | false;
    style: 'conservative' | 'fearless' | 'unsophisticated' | 'balanced' | 'emergent';
  };
}

export interface EmbeddingExternals {
  chips: number;
  required: number;
  matchShare: number;
  personality: number;
  whichPlayer: number;
  stillLeft: number;
  revealed: number;
  boardSpades: number;
  mySpades: number;
  boardHearts: number;
  myHearts: number;
  boardDiamonds: number;
  myDiamonds: number;
  boardClubs: number;
  myClubs: number;
  boardStraights: number;
  myStraights: number;
  boardHighcard: number;
  myHighcard: number;
  boardPairs: number;
  myPairs: number;
  boardThrees: number;
  myThrees: number;
  boardFours: number;
  myFours: number;
  myPreflop: number;
  hiddenRequired: number;
  hiddenSmall: number;
  hiddenChips: number;
  hiddenMinimumRaise: number;
  choice: string;
  raisesTakenRatio: number;
  totalHandsPlayed: number;
  foldsOnFirstRatio: number;
  totalRelFirstBets: number;
  totalRelOtherBets: number;
  didFoldRatio: number;
  allInStreak: number;
  amountBet: number;
}

export interface TableEmbeddingExternals {
  playersLeft: number;
  handsPlayed: number;
  indicies: number[];
  personalities: number[];
  foldsOnFirstRatio: number[];
  raisesTakenRatio: number[];
  matchShare: number[];
  allInStreak: number[];
}

export interface TableExternals {
  originalBlind: number;
  smallBlindInd: number;
  bigBlindInd: number;
  smallBlind: number;
  bigBlind: number;
  minimumRaise: number;
  raiseRules: 'smalls' | 'social' | 'standard';
  dealer: number;
  currentPlayer: number;
  embeddings: EmbeddingExternals[];
  tableEmbedding: TableEmbeddingExternals;
  pot: number;
  roundName: "Deal" | "Flop" | "Turn" | "River" | "Showdown";
  bets: number[];
  forcedBets: number[];
  clearedBets: number[];
  gameBets: number[];
  board: string[];
  players: PlayerExternals[];
}

export type RandomExternal = () => number;

export type MonteResult = {
  win: number,
  draw: number,
  loss: number
};

export type RunExternals = {
  runStandardMonte: () => MonteResult;
  runBetterMonte: () => MonteResult;
};

export type ExternalAction = {
  type: 'call'
} | {
  type: 'raise',
  level: number
} | {
  type: 'fold'
} | {
  type: 'all-in'
} | {
  type: 'raise-to',
  level: number;
  foldIfBeyond: boolean;
};
