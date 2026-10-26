# Minimum Window Substring

**Topic:** Sliding Window · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/minimum-window-substring/) · [NeetCode](https://neetcode.io/problems/minimum-window-with-characters)

## Problem

Given two strings `s` and `t`, return the **minimum window substring** of `s`
such that every character in `t` (including duplicates) is included in the
window. If there is no such window, return the empty string `""`.

The answer is **guaranteed to be unique**.

## Examples

| `s` | `t` | Output |
| --- | --- | --- |
| `"ADOBECODEBANC"` | `"ABC"` | `"BANC"` |
| `"a"` | `"a"` | `"a"` |
| `"a"` | `"aa"` | `""` |

## Intuition

This is the variable-size sliding window at its most demanding. We need a window
that **covers** the multiset `t`, and among all such windows we want the
shortest. Two observations make it linear:

- A window can only become valid by **expanding** the right edge.
- Once a window is valid, we should keep **shrinking** the left edge as long as
  it stays valid — that is how we discover the minimum.

So the template becomes: expand right until valid, then contract left while
still valid, recording the best window at each valid state.

## Approach

1. Build `need`: the count of every character required by `t`, and let
   `required` be the number of **distinct** required characters.
2. Keep a `window` count map, a counter `formed` of distinct characters whose
   window count meets the requirement, and a `left` pointer.
3. For each `right` and character `ch`:
   - add `ch` to `window`; if it now exactly meets `need[ch]`, increment
     `formed`;
   - while `formed == required` (the window is valid):
     - record the window if it is the shortest so far;
     - remove `s[left]` from `window`; if a required character drops **below**
       its target, decrement `formed`;
     - advance `left`.
4. Return the recorded window, or `""` if none was ever valid.

Tracking `formed` and `required` by distinct character count avoids rescanning
the alphabet, keeping every step `O(1)`.

## Walkthrough

`s = "ADOBECODEBANC"`, `t = "ABC"` → `need = {A:1, B:1, C:1}`, `required = 3`

| window found | valid? | best so far |
| --- | --- | --- |
| `ADOBE` | A,B present but no C | — |
| `ADOBEC` | yes | `ADOBEC` (6) |
| `DOBEC` → … shrink | yes until `C` alone fails | `ADOBEC` (6) |
| `BANC` | yes | **`BANC` (4)** |

The final contraction leaves `BANC` as the shortest covering window.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sliding window (optimal) | `O(n + m)` | `O(n + m)` |
| Check every substring | `O(n² · m)` | `O(m)` |

- **Time `O(n + m)`** where `n = len(s)`, `m = len(t)` — each character of `s`
  is added once and removed at most once.
- **Space `O(n + m)`** — the two count maps.

## Edge cases

- **`t` longer than `s`** — impossible, return `""`.
- **Required character absent from `s`** — `formed` never reaches `required`.
- **Duplicates in `t`** (`"aa"`) — the window must include both copies, so a
  single `a` is not enough.
- **A single window covers all of `s`** — the contraction stops at the left
  edge.
- **Empty `t`** — treated as no constraint; this implementation returns `""`.

## Solution (`solution.py`)

```python
def min_window(s: str, t: str) -> str:
    if not t or not s or len(t) > len(s):
        return ""

    need = {}
    for ch in t:
        need[ch] = need.get(ch, 0) + 1
    required = len(need)

    window = {}
    formed = 0
    left = 0
    best = None

    for right, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1
        if ch in need and window[ch] == need[ch]:
            formed += 1

        while formed == required:
            if best is None or right - left + 1 < best[1]:
                best = (left, right - left + 1)
            outgoing = s[left]
            window[outgoing] -= 1
            if outgoing in need and window[outgoing] < need[outgoing]:
                formed -= 1
            left += 1

    if best is None:
        return ""
    start, length = best
    return s[start:start + length]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py minimum_window_substring

# same tests through pytest
pytest topics/03_sliding_window/minimum_window_substring -v

# your own case, one-shot
python3 run.py minimum_window_substring -c '["ADOBECODEBANC", "ABC"]'
```
