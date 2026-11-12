# gpt-holdem

#### By Mark Pazolli

**gpt-holdem** is a poker bot built around the [GPT architecture](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer#/media/File:Full_GPT_architecture.svg). Unlike [generative pre-trained transformers](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer) such as Claude, ChatGPT or Gemini, *gpt-holdem* is trained on vectors of data - not words.

The project suggests small transformer models may be effective at mimicking more advanced players.

## Scripts

This project requires Python 3. With `python` installed, you may be able to play immediately using `npm start` and opening [http://localhost:8000](http://localhost:8000).

### Initialise venv

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt # nvidia
pip install -r requirements-mac.txt # non-nvidia
```

### Train original

```
python prepare.py
python train.py
python makeonnx.py
```

### Train evo

```
python pepare.py evo
python unonnx.py
python finetune.py
python makeonnx.py evo
```

### Benchmark

```
npm install
npm run benchmark
```

### Play

```
python -m http.server
open http://localhost:8000
```

## Specifications

### Input and output

The input to the model is up to twenty-six 27-dimension embedding vectors.

The first vector is a table-setting vector and all other vectors except the last present a play in the hand. The final vector presents the bot's cards, the current board and the heads-up probability of winning.

The model output is a set of logits representing one of the nine actions the bot might take:

* fold (-1)
* call/check (0)
* raise level 1 (1)
* ...
* raise level 6 (6)
* all-in (7)

For a better understanding review the `external` directory that contains the full [gptholdem.ts](external/gptholdem.ts) and [gptevo.ts](external/gptevo.ts) source code.

### Training set

#### Original model

The original model was trained on data from the play of existing bots. You can view the games [here](elementary/human-readable.txt) or alternatively the raw 114,000 vectors [here](elementary/training-data.txt). Each vector appears in a set with the last element of the last vector in the set representing the preferred action based upon preceding information.

Training is done using [train.py](train.py), which is based upon Andrej Karpathy's [nanoGPT](https://github.com/karpathy/nanoGPT). Training takes around twenty minutes on either an NVIDIA 5060 Ti 16G or MacBook Pro M2. The model is very small (smaller than even simple language models) so VRAM or unified memory is unlikely to be an issue.

The training set derives from good play in...

* 240 seven-player matches that start from an equal 40-chip starting point
* 240 matches that start from randomized starting points
* 240 matches but recording only hands where the same player wins multiple times in a row
* 120 matches focusing on the previous leading bot (called "MCCFR" though it is not true MCCFR)
* 60 matches to train the bot to defend against always all-in behaviour
* 60 matches to train the bot to both make and call bluffs effectively

The model is limited by the quality of other bots in its training set.

#### Evo model

The second model, _evo_, is trained based upon the optimal decision of four to five alternate rivers in varied game conditions played to completion. You can view the games [here](evolution/human-readable-1.txt) or alternatively the raw 86,500 vectors [here](evolution/training-data.txt). An additional set of training vectors were added when trying to improve performance against Sequoia that you can view [here](evolution/human-readable-10.txt).

_Evo_ was fine tuned from the original model using [finetune.py](finetune.py). Fine-tuning is somewhat faster than training from scratch, so most computers will complete the workload in matter of minutes.

The learning rate is far larger than would usually be used in fine-tuning making it somewhat different from its base model. This is a feature, not a bug, as a similar model might compete for the same wins as its parent ultimately lessening the performance of both.

### Model specs

Both models are 4-layer transformer models with 36.2k parameters translating to just under 350kB as an ONNX file. Further work may consider if _evo_ might work better with a higher parameter count or more layers.

### Performance

#### Original model

The original model performed well against existing bots (these results were not rerun with the changes made for _evo_):

1. gptholdem - 962 wins (+8.9% over next/+95.1% over worst)
2. mccfrfinisher - 883 wins (+17.3% over next/+79.1% over worst)
3. gbr - 753 wins (+7.3% over next/+52.7% over worst)
4. mccfr - 702 wins (+10.4% over next/+42.4% over worst)
5. amalgamatedalt - 636 wins (+4.1% over next/+29.0% over worst)
6. wildlike - 611 wins (+23.9% over next/+23.9% over worst)
7. aggressive - 493 wins (+0.0% over next/+0.0% over worst)

Matches played: 5040; Hands played: 91846

#### Evo model

_Evo_ also performed well...

1. gptevo - 883 wins (+5.6% over next/+43.3% over worst)
2. sequoia - 836 wins (+17.6% over next/+35.7% over worst)
3. gbr - 711 wins (+2.4% over next/+15.4% over worst)
4. mccfrfinisher - 694 wins (+2.5% over next/+12.7% over worst)
5. amalgamatedalt - 677 wins (+8.7% over next/+9.9% over worst)
6. wildlike - 623 wins (+1.1% over next/+1.1% over worst)
7. wild - 616 wins (+0.0% over next/+0.0% over worst)

Matches played: 5040; Hands played: 76484

#### Head-to-head

 The two models do not occupy first and second place when playing head-to-head. This may be because the two transformer models fight for a contested game space.

1. gptevo - 304 wins (+5.9% over next/+58.3% over worst)
2. sequoia - 287 wins (+14.3% over next/+49.5% over worst)
3. gptholdem - 251 wins (+9.1% over next/+30.7% over worst)
4. wildlike - 230 wins (+10.0% over next/+19.8% over worst)
5. wild - 209 wins (+1.0% over next/+8.9% over worst)
6. gbr - 207 wins (+7.8% over next/+7.8% over worst)
7. mccfrfinisher - 192 wins (+0.0% over next/+0.0% over worst)

Matches played: 1680; Hands played: 27054

## Miscellania

### Sequoia

In 2026, Sequoia Capital and OpenAI brought back a computer poker competition after Carnegie Mellon University and Noam Brown ended [their competition](http://www.computerpokercompetition.org/) in 2019.

Sequoia's competition is unusual in that it is only open to graduates and recent graduates and asks players to code their bots in 60 minutes. An all-in strategy might be extremely effective here—amateur players and bots often under-risk their play and an all-in bot takes advantage of this.

But there are counters to all-in play and it got me thinking about my 60-minute strategy. My bot, Sequoia, named after the trees not the company:

1. Calls then raises if the pre-flop heads-up probability is 63% or more
2. Goes all-in if the pre-flop heads-up probability is 61 - 2(_n_ - 1)% or more in the _n_ th hand of play
3. Folds otherwise

This causes emergent aggression from Sequoia where it plays very aggressively towards the end of the match. The Sequoia strategy proved extremely effective and I had to modify the other bots specifically to detect and counter it.

I have included Sequoia as one of the external playable bots if you wish to see the code.

### External play

External play is currently only implemented for the [benchmark tool](benchmark.js). Near `let settings = [` add  `external` in place of one of the other players.

You can then switch to your preferred external model by modifying the line under the comment `// change to externalgptevo or externalsequoia if desired`.

Currently only one external model is supported at a time.

### Limitations

* The models are limited by the quality of the training data.
* Raising is incorrect. Texas Hold 'em only allows raises that are greater than both the last raise that round and the big blind - not in increments of the small bind as implemented.
* Although the program has been adapted for conventional raising because the models were trained for small-blind raising their performance will likely suffer.

## License

Per the MIT license, you are free to deal with the software and its training data as you please. However the source code for some parts of the software is not provided. Contact the author for this. Decompiling, modification and redistribution of the compiled code is allowed too—just try to be original.

The Perth font is a variation of [Jost](https://github.com/indestructible-type/Jost) and is available under the [SIL Open Font Licence](https://github.com/indestructible-type/Jost/blob/master/OFL.txt).

## Citation

If you use this code or model, please cite:

```bibtex
@software{
  gpt-holdem,
  author = {Pazolli, Mark},
  title  = {gpt-holdem},
  url    = {https://github.com/markmehere/gpt-holdem},
  year   = {2026}
}
```
