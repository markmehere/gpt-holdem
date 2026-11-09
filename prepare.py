"""
Prepare PokerPT vector set data for model training.
Reads vector sets from training-data.txt (and optionally refinement-data.txt for evo fine-tuning),
mixes them according to recipe, and pickles as .bin files.

Usage:
    Standard:   python prepare.py
    Evolution:  python prepare.py evo
"""

import os
import pickle
import random
import sys

def load_vector_sets(path):
    sets = []
    current = []
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                if current:
                    sets.append(current)
                current = []
            else:
                # Parse the vector
                vec = eval(line)
                current.append(vec)
        if current:
            sets.append(current)
    return sets

def save_pickle_bin(obj, filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'wb') as f:
        pickle.dump(obj, f)

# Check if 'evo' flag was passed in command line arguments
is_evo = "evo" in sys.argv

if is_evo:
    print("-> Evolution fine-tuning mode detected.")
    elem_path = os.path.join(os.path.dirname(__file__), 'elementary', 'training-data.txt')
    evo_path = os.path.join(os.path.dirname(__file__), 'evolution', 'refinement-data.txt')

    elem_sets = load_vector_sets(elem_path)
    evo_sets = load_vector_sets(evo_path)

    # 1. Randomize and sample 10% from Elementary
    random.shuffle(elem_sets)
    elem_sample_count = int(0.15 * len(elem_sets))
    elem_subset = elem_sets[:elem_sample_count]

    # Split that 10% sample 90/10 for train/val (yielding 9% train, 1% val of total elementary)
    elem_split_idx = int(0.9 * len(elem_subset))
    elem_train = elem_subset[:elem_split_idx]
    elem_val = elem_subset[elem_split_idx:]

    # 2. Randomize and split Evolution sets 90/10 for train/val
    random.shuffle(evo_sets)
    evo_split_idx = int(0.9 * len(evo_sets))
    evo_train = evo_sets[:evo_split_idx]
    evo_val = evo_sets[evo_split_idx:]

    # 3. Combine components
    train_sets = elem_train + evo_train
    val_sets = elem_val + evo_val

    # Final shuffle at the set level to blend elementary and evolution data together
    random.shuffle(train_sets)
    random.shuffle(val_sets)

    out_dir = 'evolution'

else:
    print("-> Standard elementary mode detected.")
    input_file_path = os.path.join(os.path.dirname(__file__), 'elementary', 'training-data.txt')
    vector_sets = load_vector_sets(input_file_path)

    # Shuffle for randomization at the set level
    random.shuffle(vector_sets)

    # Split into train/val (90/10 split)
    split = int(0.9 * len(vector_sets))
    train_sets = vector_sets[:split]
    val_sets = vector_sets[split:]

    out_dir = 'elementary'

# Ensure output directory exists
os.makedirs(os.path.join(os.path.dirname(__file__), out_dir), exist_ok=True)

# Save as .bin pickles
save_pickle_bin(train_sets, os.path.join(out_dir, 'train.bin'))
save_pickle_bin(val_sets, os.path.join(out_dir, 'val.bin'))

print(f"Prepared {len(train_sets)} train sets and {len(val_sets)} val sets in '{out_dir}/'.")
