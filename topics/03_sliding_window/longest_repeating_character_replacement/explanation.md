# Longest Repeating Character Replacement

**Topic:** Sliding Window · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/longest-repeating-character-replacement/) · [NeetCode](https://neetcode.io/problems/longest-repeating-substring-with-replacement)

## Problem

You are given a string `s` and an integer `k`. You can choose any character of
the string and change it to any other uppercase English character, at most `k`
times.

Return the length of the **longest substring** containing the same letter you
can get after performing the above operations.

## Examples

| `s` | `k` | Output | Why |
| --- | --- | --- | --- |
| `"ABAB"` | `2` | `4` | change both `A`s (or both `B`s) |
| `"AABABBA"` | `1` | `4` | `"AABA"` → `"AAAA"` |
| `"BAAAB"` | `2` | `5` | change the two `B`s → `"AAAAA"` |

## Intuition

For any window, the cheapest way to make it uniform is to keep its **most
frequent** character and replace everything else. So the cost of a window is:

```
cost = window_length - (count of the most frequent letter in the window)
```

A window is achievable when `cost <= k`. This immediately gives a sliding-window
recipe: grow the window on the right, and whenever it becomes too expensive,
shrink it from the left until it is affordable again.

## Approach

1. Keep a frequency map `count`, a `left` pointer, the window's majority count
   `max_count`, and the best length `best`.
2. For each `right` and character `ch`:
   - add `ch` to `count` and refresh `max_count`;
   - while the window is too expensive
     (`(right - left + 1) - max_count > k`), remove `s[left]` from the map and
     advance `left`;
   - update `best`.
3. Return `best`.

A subtle but safe simplification: `max_count` is **never decreased** as the
window shrinks. It can only lag behind the true current majority, which only
makes the window look more expensive — never cheaper — so it can never produce a
too-large `best`. The window that produced the maximum is still valid when it
was measured.

## Walkthrough

`s = "AABABBA"`, `k = 1`

| `right` | `ch` | window | `max_count` | cost | action | `best` |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | A | `A` | 1 | 0 | — | 1 |
| 1 | A | `AA` | 2 | 0 | — | 2 |
| 2 | B | `AAB` | 2 | 1 | — | 3 |
| 3 | A | `AABA` | 3 | 1 | — | 4 |
| 4 | B | `AABAB` | 3 | 2 | shrink `left`→1 | 4 |
| 5 | B | `ABABB` | 3 | 2 | shrink `left`→2 | 4 |
| 6 | A | `ABBA` | 3 | 1 | — | 4 |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sliding window (optimal) | `O(n)` | `O(1)` |
| Brute force (every window, recount) | `O(n²)` | `O(1)` |

- **Time `O(n)`** — each character is added once and removed at most once.
- **Space `O(1)`** — the map holds at most 26 uppercase letters.

## Edge cases

- **`k = 0`** — the answer collapses to the longest run of equal characters.
- **All characters distinct** — a window of length `k + 1` is achievable.
- **Already uniform** — the window can be the whole string.
- **`k` larger than the needed changes** — the whole string is achievable.
- **Single character** — answer is `1` (or `0` for the empty string).

## Solution (`solution.py`)

```python
def character_replacement(s: str, k: int) -> int:
    count: dict[str, int] = {}
    left = 0
    best = 0
    max_count = 0
    for right, ch in enumerate(s):
        count[ch] = count.get(ch, 0) + 1
        max_count = max(max_count, count[ch])
        while (right - left + 1) - max_count > k:
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py longest_repeating_character_replacement

# same tests through pytest
pytest topics/03_sliding_window/longest_repeating_character_replacement -v

# your own case, one-shot
python3 run.py longest_repeating_character_replacement -c '["AABABBA", 1]'
```
