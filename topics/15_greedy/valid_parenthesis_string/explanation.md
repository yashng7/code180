# Valid Parenthesis String

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/valid-parenthesis-string/) · [NeetCode](https://neetcode.io/problems/valid-parenthesis-string)

## Problem

Given a string `s` of `'('`, `')'` and `'*'`, where `'*'` can act as an opening
bracket, a closing bracket, or an empty string, return whether `s` can be a valid
parenthesis string.

## Examples

| `s` | Output |
| --- | --- |
| `"()"` | `True` |
| `"(*)"` | `True` |
| `"(*))"` | `True` |
| `"(((*)"` | `False` |
| `")*("` | `False` |

## Intuition

Instead of committing each `'*'` to a role, track the **range** of possible open
counts. Let `lo` be the smallest feasible number of open brackets and `hi` the
largest. A `'('` pushes both up; a `')'` pulls both down; a `'*'` can be a `')'`
(lowering `lo`) or a `'('` (raising `hi`).

The string is valid iff `0` lies in the final range — but we can be smarter:
if the maximum possible opens ever goes negative (`hi < 0`), there are too many
closing brackets to fix, so fail immediately. At the end, `lo == 0` decides it.

## Approach

1. `lo = hi = 0`.
2. For each character:
   - `'('` → `lo += 1`, `hi += 1`;
   - `')'` → `lo = max(lo - 1, 0)`, `hi -= 1`;
   - `'*'` → `lo = max(lo - 1, 0)`, `hi += 1`.
   - If `hi < 0`, return `False`.
3. Return `lo == 0`.

## Why the greedy choice is safe

Maintain the invariant that after processing a prefix the set of achievable open
counts is exactly the integer interval `[lo, hi]`.

- **`'('` / `')'`** shift every achievable balance by `±1`, preserving the
  interval shape.
- **`'*'`** can realise either a `-1` or a `+1` step. The reachable balances are
  the union of `[lo-1, hi-1]` and `[lo+1, hi+1]`, whose union is `[lo-1, hi+1]`.
  Clamping `lo` at `0` is safe because a negative running balance is already
  invalid (never clamp `hi`).

The interval is *exact* — it contains no balance that is unachievable and omits
none that is. Therefore asking at the end whether `0 ∈ [lo, hi]` is correct. The
`hi < 0` early exit is just the special case "even the most generous reading has
more closes than can be matched". Because we never commit a star prematurely,
the greedy range never loses a valid assignment.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Greedy range (this) | `O(n)` | `O(1)` |
| 2-D DP over (index, open) | `O(n²)` | `O(n²)` |
| Recursion with memo | `O(n²)` | `O(n²)` |

## Edge cases

- **Empty string** — trivially valid (`lo == 0`).
- **A lone `'*'`** — treat it as empty → valid.
- **Leading `')'`** — `hi` goes negative → `False` immediately.
- **Too many opens** (`"((("`) — `lo` ends `> 0` → `False`.
- **A star as a closing bracket finishes two pairs** (`"((*)"` → `True`).
- **Exactly zero balance mid-string** — allowed; `lo` clamps at `0`.

## Solution (`solution.py`)

```python
def check_valid_string(s: str) -> bool:
    lo = 0
    hi = 0
    for char in s:
        if char == "(":
            lo += 1
            hi += 1
        elif char == ")":
            lo = max(lo - 1, 0)
            hi -= 1
        else:
            lo = max(lo - 1, 0)
            hi += 1
        if hi < 0:
            return False
    return lo == 0
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py valid_parenthesis_string

# same tests through pytest
pytest topics/15_greedy/valid_parenthesis_string -v

# your own case
python3 run.py valid_parenthesis_string -c '["(*))"]'
```
