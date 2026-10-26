# Permutation in String

**Topic:** Sliding Window · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/permutation-in-string/) · [NeetCode](https://neetcode.io/problems/permutation-string)

## Problem

Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of
`s1` as a contiguous substring, otherwise return `false`.

A permutation of `s1` is a substring of `s2` when a window of `s2` has **exactly
the same letter counts** as `s1`.

## Examples

| `s1` | `s2` | Output | Why |
| --- | --- | --- | --- |
| `"ab"` | `"eidbaooo"` | `true` | contains `"ba"` |
| `"ab"` | `"eidboaoo"` | `false` | no `"ab"`/`"ba"` window |
| `"adc"` | `"dcda"` | `true` | contains `"cda"` |

## Intuition

A permutation has the **same multiset of letters** as the original, so two
strings are permutations exactly when their 26-letter frequency vectors match.

Since every permutation of `s1` has length `len(s1)`, we only need to slide a
window of that **fixed size** across `s2` and compare frequency vectors. This is
the fixed-size flavour of the sliding-window template — right edge expands,
left edge trails exactly `len(s1)` positions behind.

## Approach

1. If `len(s1) > len(s2)`, a permutation can never fit — return `False`.
2. Build the target frequency vector `need` from `s1`.
3. Slide a window over `s2`:
   - add `s2[right]` to `window`;
   - once the window is larger than `len(s1)`, subtract the character that just
     fell off the left edge (`s2[right - len(s1)]`);
   - whenever `window == need`, return `True`.
4. Return `False` if no window matched.

Comparing two 26-element lists is `O(1)` (bounded by the alphabet size), so the
whole scan is linear.

## Walkthrough

`s1 = "ab"` (so `need = {a:1, b:1}`), `s2 = "eidbaooo"`

| `right` | window | left char dropped | match? |
| --- | --- | --- | --- |
| 0 | `e` | — | no |
| 1 | `ei` | — | no |
| 2 | `id` | `e` | no |
| 3 | `db` | `i` | no |
| 4 | `ba` | `d` | **yes → `True`** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sliding window (optimal) | `O(n)` | `O(1)` |
| Sort every window | `O(n · m log m)` | `O(m)` |

- **Time `O(n)`** where `n = len(s2)` — each character enters and leaves once,
  and the vector comparison touches a fixed 26 slots.
- **Space `O(1)`** — two arrays of size 26.

## Edge cases

- **`s1` longer than `s2`** — impossible, return `False` early.
- **Equal-length strings** — a single window covers all of `s2`.
- **No matching window** — the scan finishes and returns `False`.
- **Non-contiguous repeats** (`"hello"` in `"ooolleoooleh"`) — matching total
  counts are not enough; the helper catches that the letters are never adjacent.
- **`s1` of length 1** — the window is a single character.

## Solution (`solution.py`)

```python
def check_inclusion(s1: str, s2: str) -> bool:
    if len(s1) > len(s2):
        return False
    if not s1:
        return True

    need = [0] * 26
    window = [0] * 26
    for ch in s1:
        need[ord(ch) - ord("a")] += 1

    size = len(s1)
    for right, ch in enumerate(s2):
        window[ord(ch) - ord("a")] += 1
        if right >= size:
            window[ord(s2[right - size]) - ord("a")] -= 1
        if window == need:
            return True
    return False
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py permutation_in_string

# same tests through pytest
pytest topics/03_sliding_window/permutation_in_string -v

# your own case, one-shot
python3 run.py permutation_in_string -c '["ab", "eidbaooo"]'
```
