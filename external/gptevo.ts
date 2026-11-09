import { getMaxBet, makePlayerEmbedding } from "./embedding";
import { ExternalAction, PlayerExternals, RandomExternal, RunExternals, TableExternals } from "./external";
import { prepareEmbedding, prepareTableEmbedding } from "./embedding";
import type { InferenceSession, Tensor } from "onnxruntime-node";
import { getPreFlopOdds } from "./preflop";

type OrtModule = typeof import("onnxruntime-node");
let ort: OrtModule | null = null;
try {
  if (typeof window !== "undefined" && (window as any).ort) {
    ort = (window as any).ort;
  } else {
    ort = require("onnxruntime-node");
  }
} catch (e) {
  console.error("ONNX Runtime not found. Please install onnxruntime-node or onnxruntime-web.");
  ort = null;
}

const blockSize = 26;
const n_embd = 27;
const temperature = 0.9;
const k4 = 0.22;
const k3 = 0.52;
const k2 = 0.40;
const k1 = 0.18;

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function sampleFromProbs(probs: number[], rand: () => number): number {
  let r = rand();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.length - 1;
}

function chooseTokenWithProbs(probs: number[], minToken: number, maxToken: number, temperature: number, rand: () => number) {
  const scaled = probs.map(p => Math.pow(p, 1 / temperature));
  const sum = scaled.slice(minToken, maxToken + 1).reduce((a, b) => a + b, 0);
  const norm = scaled.slice(minToken, maxToken + 1).map(p => p / sum);
  const idx = sampleFromProbs(norm, rand);
  return minToken + idx;
}

let _session: InferenceSession;

async function getSession() {
  if (!ort) throw new Error("ONNX Runtime not available");
  if (_session) return _session;
  let providers = [];
  if (ort.env && ort.env.webgpu) providers.push("webgpu");
  if (typeof window !== "undefined") providers.push("wasm");
  providers.push("cpu");
  try {
    _session = await ort.InferenceSession.create("epoker.onnx", { logSeverityLevel: 3, executionProviders: providers });
  } catch (e) {
    _session = await ort.InferenceSession.create("epoker.onnx", { logSeverityLevel: 3, executionProviders: ["cpu"] });
  }

  return _session;
}

export async function gptHoldemPlay(you: PlayerExternals, table: TableExternals, run: RunExternals, rand: RandomExternal): Promise<ExternalAction> {
  const session = await getSession();

  if (!session) throw new Error("No ONNX session");

  const data = new Float32Array(blockSize * n_embd);
  const mask = new Uint8Array(blockSize); // 1 for real, 0 for pad
  const embLen = table.embeddings.length;
  const playEmbedding = makePlayerEmbedding(you, table, 'call', 0, run);

  for (let i = 1; i < blockSize; i++) {
    if (i === blockSize - 1) {
      const vec = prepareEmbedding(playEmbedding, you, you, table.players.length, 'smalls');
      for (let j = 0; j < n_embd; j++) data[i * n_embd + j] = vec[j];
      mask[i] = 1;
    }
    else if (i >= blockSize - embLen - 1) {
      const embedding = table.embeddings[i - (blockSize - embLen - 1)];
      const player = table.players.find((p) => p.index === embedding.whichPlayer);
      const vec = prepareEmbedding(embedding, player!, you, table.players.length, 'smalls');
      for (let j = 0; j < n_embd; j++) data[i * n_embd + j] = vec[j];
      mask[i] = 1;
    } else {
      for (let j = 0; j < n_embd; j++) data[i * n_embd + j] = 0.0;
      mask[i] = 0;
    }
  }

  const firstOne = mask.findIndex(m => m === 1);
  const tvec = prepareTableEmbedding(you, table.tableEmbedding);
  for (let j = 0; j < n_embd; j++) data[Math.max(firstOne - 1, 0) * n_embd + j] = tvec[j];
  mask[Math.max(firstOne - 1, 0)] = 1;

  const feeds: { x: Tensor; mask: Tensor; } = {
    x: new ort!.Tensor("float32", data, [1, blockSize, n_embd]),
    mask: new ort!.Tensor("bool", mask, [1, blockSize])
  };

  const output = await session.run(feeds);
  const logitsKey = Object.keys(output)[0];
  const logitsTensor = output[logitsKey]; // shape: [1, blockSize, vocab_size]
  const logitsArr = logitsTensor.data; // flat array

  // Find last real position
  let lastIdx = blockSize - 1;
  for (let i = blockSize - 1; i >= 0; --i) {
    if (mask[i]) { lastIdx = i; break; }
  }

  const vocabSize = 9;
  // Always extract the first 9 logits, regardless of block count
  const logits = (logitsArr.length === vocabSize ? logitsArr : logitsArr.slice(0, vocabSize)) as unknown as number[];
  if (logits.length !== vocabSize) {
    throw new Error("Logits extraction failed");
  }

  let choice = 0;
  const probs = softmax(logits);

  const firstHandAdj = Math.max(((3 - you.totalHands) / 3) * 0.16, 0);
  if (you.cards && you.totalHands === 0 && getPreFlopOdds(you.cards) < 60) {
    // Fold with bad cards on the first round
    choice = 0;
  } else if (probs[8] > k4) {
    // All in if probability is promising
    choice = 8;
  } else if (probs[0] > k2 - firstHandAdj) {
    // Fold if fold probability is high
    choice = 0;
  } else if (probs[0] > k1 - firstHandAdj) {
    // Weighted decision including fold
    choice = chooseTokenWithProbs(probs, 0, 8, temperature, rand);
  } else if (probs[1] > k3 - firstHandAdj) {
    // Weighted decison including call
    choice = chooseTokenWithProbs(probs, 1, 8, temperature, rand);
  } else {
    // Weighted decision excluding fold and call
    choice = chooseTokenWithProbs(probs, 2, 8, temperature, rand);
  }

  if (choice === 0) {
    return { type: 'fold' };
  } else if (choice === 8) {
    return { type: 'all-in' };
  } else if (choice === 1) {
    if (
      getMaxBet(table.bets, table) > you.chips * 0.9
    ) return { type: 'fold' };
    return { type: 'call' };
  } else {
    return { type: 'raise-to', level: choice - 1, foldIfBeyond: false };
  }
}
