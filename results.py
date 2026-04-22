import sys
import re
import os
from collections import defaultdict

def parse_header(filename):
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        header = []
        in_block = False
        for line in f:
            if line.strip().startswith('/*'):
                in_block = True
                continue
            if in_block and line.strip().startswith(']'):
                break
            if in_block:
                header.append(line)
        # Extract bot name and win count
        pattern = re.compile(r"\[\s*'([^']+)',\s*(\d+),")
        results = {}
        for line in header:
            m = pattern.search(line)
            if m:
                bot, wins = m.group(1), int(m.group(2))
                results[bot] = wins
        return results

def core(files):
    bot_totals = defaultdict(int)
    for fname in files:
        results = parse_header(fname)
        for bot, wins in results.items():
            bot_totals[bot] += wins

    # Sort bots by total wins descending
    sorted_bots = sorted(bot_totals.items(), key=lambda x: x[1], reverse=True)
    worst = sorted_bots[-1][1]
    total = sum(w for _, w in sorted_bots)

    print()
    for i, (bot, wins) in enumerate(sorted_bots):
        if i == 0:
            next_wins = wins
        else:
            next_wins = sorted_bots[i-1][1]
        # Percentage improvement over next bot
        if i < len(sorted_bots) - 1:
            next_bot_wins = sorted_bots[i+1][1]
            pct_next = 100 * (wins - next_bot_wins) / next_bot_wins
        else:
            pct_next = 0
        # Percentage improvement over worst bot
        if wins != worst:
            pct_worst = 100 * (wins - worst) / worst
        else:
            pct_worst = 0
        print(f"{i+1}. {bot} - {wins} wins (+{pct_next:.1f}% over next/+{pct_worst:.1f}% over worst)")
    print(f"\nMatches played: {total}")

def count_winner(filenames):
    count = 0
    for filename in filenames:
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                count += line.count("WINNER:")
    return count


if __name__ == "__main__":
    rwhich = sys.argv[1:]
    which = rwhich
    canCount = True
    if len(rwhich) > 1 or os.path.exists(rwhich[0]):
        for p in rwhich:
            if not os.path.exists(p):
                canCount = False
    elif len(rwhich) == 0:
        canCount = False
    else:
        try:
            which = []
            dir = os.path.dirname(rwhich[0])
            if dir == '':
                dir = '.'
            for fname in os.listdir(dir):
                if fname.startswith(rwhich[0][len(dir) + 1:]):
                    which.append(os.path.join(dir, fname))
        except:
            canCount = False
    if len(which) == 0 or not canCount:
        print("Usage: python results.py filename1 [filename2] [filename3] ...")
        print("  filename1 can be a partial match in which case every matching file will be summed")
        sys.exit(1)
    core(which)
    print(f"Hands played: {count_winner(which)}")
