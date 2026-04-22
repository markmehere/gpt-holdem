# gpt-holdem

#### By Mark Pazolli

**gpt-holdem** is a poker bot built around the [GPT architecture](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer#/media/File:Full_GPT_architecture.svg). Unlike [generative pre-trained transformers](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer) such as Claude, ChatGPT or Gemini, *gpt-holdem* is trained on vectors of data - not words.

The project suggests small transformer models may be highly effective at modelling more advanced players.

## Train

```
python prepare.py
python train.py
python makeonnx.py
```

## Benchmark

```
npm install
npm run benchmark
```

## Play

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

For a better understanding review the `external` directory which contians the full gptholdem.ts source code.

### Training set

The was trained on data from the play of existing bots. You can view the games [here](elementary/human-readable.txt) or alternatively the raw 130,000 vectors [here](elementary/training-data.txt). Each vector appears in a set with the last element of the last vector in the set representing the preferred action based upon preceeding information.

Training is done using the code in this repository which is based upon Andrej Karpathy's [nanoGPT](https://github.com/karpathy/nanoGPT). Training takes around 26 minutes on NVIDIA 5060 Ti 16G.

The training set derives from good play in...

* 240 seven-player matches standard matches that start from an equal 40-chip starting point
* 240 matches variable player from randomized starting points
* 240 matches but recording only hands where the same player wins multiple times in a row
* 120 matches but focusing on the previous leading bot
* 60 matches to train the bot to defend against always all-in behaviour
* 60 matches to train the bot to both bluff and call-bluffs effectively

The model is limited by the quality of other bots in its training set but suggests the potential for the transformer model to cheaply mimic good poker play.

### Model specs

The model is 36.2k parameters or 331kB as an ONNX file.

### Performance

The model performs well against existing bots:

1. gptholdem - 962 wins (+8.9% over next/+95.1% over worst)
2. mccfrfinisher - 883 wins (+17.3% over next/+79.1% over worst)
3. gbr - 753 wins (+7.3% over next/+52.7% over worst)
4. mccfr - 702 wins (+10.4% over next/+42.4% over worst)
5. amalgamatedalt - 636 wins (+4.1% over next/+29.0% over worst)
6. wildlike - 611 wins (+23.9% over next/+23.9% over worst)
7. aggressive - 493 wins (+0.0% over next/+0.0% over worst)

Matches played: 5040; Hands played: 91846

## Limitations

* The model is limited by the quality of the training data.
* Raising is incorrect. Texas Hold 'em only allows raises that are greater than both the last raise that round and the big blind - not in increments of the small bind as implemented.
* Although the models have been adapted for conventional raising, as the models were trained for small-blind raising, their performance will likely suffer.

## License

Per the MIT license, you are free to deal with the software and its training data as you please. However the source code for some parts of the product is not provided. Contact the author for licensing this. Decompiling, modification and redistribution of the compiled is allowed too - just try to be original.

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