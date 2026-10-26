# Longest Substring Without Repeating Characters

**Topic:** Sliding Window · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/longest-substring-without-repeating-characters/) · [NeetCode](https://neetcode.io/problems/longest-substring-without-duplicates)

## Problem

Given a string `s`, find the length of the **longest substring** that contains
no repeating characters. A substring is a contiguous, non-empty run of
characters.

## Examples

| `s` | Output | Why |
| --- | --- | --- |
| `"abcabcbb"` | `3` | `"abc"` |
| `"bbbbb"` | `1` | `"b"` |
| `"pwwkew"` | `3` | `"wke"` |

## Intuition

A substring is a window over the string, so we can grow a window on the right
and only ever need to **shrink it from the left** when a duplicate appears.

Suppose we extend the window to include a new character `c` that is already
inside the window. The window is invalid, but the fix is cheap: the new valid
window must start **just after** the previous occurrence of `c`. We never need
to restart the scan — every character enters and leaves the window at most once.

## Approach

1. Keep a map `last` from character → the index where it was most recently
   seen, and a `left` pointer for the window's left edge.
2. For each `right` and character `ch`:
   - if `ch` was seen **and its old index is at least `left`** (it is really
     inside the window), move `left` to `last[ch] + 1`;
   - record `last[ch] = right`;
   - the window is now valid, so update `best = max(best, right - left + 1)`.
3. Return `best`.

The `last[ch] >= left` guard is the key detail: an old occurrence that has
already fallen out of the window must **not** pull `left` backwards.

## Walkthrough

`s = "pwwkew"`

| `right` | `ch` | `left` after | window | `best` |
| --- | --- | --- | --- | --- |
| 0 | p | 0 | `p` | 1 |
| 1 | w | 0 | `pw` | 2 |
| 2 | w | 2 | `w` | 2 |
| 3 | k | 2 | `wk` | 2 |
| 4 | e | 2 | `wke` | 3 |
| 5 | w | 3 | `kew` | 3 |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sliding window (optimal) | `O(n)` | `O(min(n, σ))` |
| Brute force (check every substring) | `O(n²)` (`O(n³)` naive) | `O(n)` |

- **Time `O(n)`** — `right` advances `n` times and `left` only ever advances
  forward, so each index is touched a constant number of times.
- **Space `O(min(n, σ))`** — the map holds at most the number of distinct
  characters `σ` (or the string length).

## Edge cases

- **Empty string** — the loop never runs and we return `0`.
- **All identical characters** (`"bbbbb"`) — every step shrinks the window back
  to length `1`.
- **Duplicate already outside the window** (`"abba"`) — the second `b` is behind
  `left`, so the guard prevents `left` from moving backwards.
- **Non-alphabetic characters** (spaces, digits, symbols) — the map keys are
  arbitrary characters, so they work unchanged.
- **Whole string unique** — every step grows the window, giving `len(s)`.

## Solution (`solution.py`)

```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py longest_substring_without_repeating_characters

# same tests through pytest
pytest topics/03_sliding_window/longest_substring_without_repeating_characters -v

# your own case, one-shot
python3 run.py longest_substring_without_repeating_characters -c '["abcabcbb"]'
```
