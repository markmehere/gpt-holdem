"""
Prepare PokerPT vector set data for model training.
Reads vector sets from training-data-samp.txt, splits into train/val, and pickles as .bin files.
"""
import os
import pickle
import random

import numpy as np

# Path to the data file
input_file_path = os.path.join(os.path.dirname(__file__), 'elementary', 'training-data.txt')

# Read and parse the vector sets
def load_vector_sets(path):
    sets = []
    current = []
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                if current:
                    if len(current) > 0:
                        sets.append(current)
                    current = []
            else:
                # Parse the vector
                vec = eval(line)
                current.append(vec)
        if len(current) > 0:
            sets.append(current)
    return sets

vector_sets = load_vector_sets(input_file_path)

# Shuffle for randomization
random.shuffle(vector_sets)

# Split into train/val (90/10 split)
split = int(0.9 * len(vector_sets))
train_sets = vector_sets[:split]
val_sets = vector_sets[split:]

# Save as .bin pickles
def save_pickle_bin(obj, filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'wb') as f:
        pickle.dump(obj, f)

save_pickle_bin(train_sets, os.path.join('elementary', 'train.bin'))
save_pickle_bin(val_sets, os.path.join('elementary', 'val.bin'))

print(f"Prepared {len(train_sets)} train sets and {len(val_sets)} val sets.")
