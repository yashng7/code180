# Letter Combinations of a Phone Number

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) · [NeetCode](https://neetcode.io/problems/letter-combinations-of-a-phone-number)

## Problem

Given a string `digits` containing digits from `2` to `9`, return all letter
combinations the number could spell, using the standard phone mapping below.
The answer may be in any order.

```
2: abc   3: def   4: ghi   5: jkl
6: mno   7: pqrs  8: tuv   9: wxyz
```

## Examples

| `digits` | Output |
| --- | --- |
| `"23"` | `["ad","ae","af","bd","be","bf","cd","ce","cf"]` |
| `"2"` | `["a","b","c"]` |
| `""` | `[]` |

## Intuition

Each digit offers a small set of letters; the answer is the Cartesian product of
those sets. We build it one digit at a time with choose → recurse → un-choose:

- *choose* a letter for the current digit,
- *recurse* into the next digit,
- *un-choose* it before trying the next letter.

## Approach

1. Store the keypad as a dict from digit to letters.
2. If `digits` is empty, return `[]` (the official convention — not `[""]`).
3. `backtrack(index)`:
   - if `index == len(digits)`, join `path` and record it;
   - otherwise loop over every letter of `digits[index]`: append it (choose),
     recurse with `index + 1` (recurse), pop it (un-choose).

## Complexity

Let `n = len(digits)`; each digit has 3 or 4 letters.

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(4^n · n)` | `O(n)` |

There are at most `4^n` combinations and joining each costs `O(n)`; the
recursion stack and `path` hold at most `n` characters.

## Edge cases

- **Empty digits** → `[]` (a common trap is returning `[""]`).
- **Single digit** → the digit's letters, e.g. `"9"` → `["w","x","y","z"]`.
- **Mixed 3- and 4-letter digits** (`"79"`) → `4 × 4 = 16` combinations.
- The order of the combinations is free, so the harness compares with
  `unordered`.

## Solution (`solution.py`)

```python
def letter_combinations(digits):
    if not digits:
        return []
    keypad = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
              "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    result, path = [], []

    def backtrack(index):
        if index == len(digits):
            result.append("".join(path))
            return
        for ch in keypad[digits[index]]:
            path.append(ch)             # choose
            backtrack(index + 1)        # recurse
            path.pop()                  # un-choose

    backtrack(0)
    return result
```

## How to run the tests

```bash
python3 run.py letter_combinations_of_a_phone_number
pytest topics/10_backtracking/letter_combinations_of_a_phone_number -v
python3 run.py letter_combinations_of_a_phone_number -c '["23"]'
```
