import { getPreFlopOdds } from "./preflop";

export async function gptHoldemPlay(you: PlayerExternals, table: TableExternals, run: RunExternals, rand: RandomExternal): Promise<ExternalAction> {

  if (table.roundName === 'Deal') {
    if (getPreFlopOdds(you.cards) > 63) return { type: 'call' };
    else if (getPreFlopOdds(you.cards) > 61 - you.totalHands * 2) return { type: 'all-in' };
  }
  else {
    return { type: 'raise', level: 2 };
  }
  
  return { type: 'fold' };
}
