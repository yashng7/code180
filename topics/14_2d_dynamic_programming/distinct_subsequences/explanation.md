# Distinct Subsequences

**Topic:** 2-D Dynamic Programming · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/distinct-subsequences/) · [NeetCode](https://neetcode.io/problems/count-subsequences)

## Problem

Given strings `s` and `t`, count the number of distinct subsequences of `s` that
equal `t`. A subsequence keeps the original order but may delete characters.

> Note the argument order used here: `num_distinct(s, t)` — **source first**.

## Examples

| `s` | `t` | Output | Why |
| --- | --- | --- | --- |
| `"rabbbit"` | `"rabbit"` | `3` | three ways to pick which `b` to drop |
| `"babgbag"` | `"bag"` | `5` | |
| `"abc"` | `""` | `1` | the empty subsequence |
| `""` | `"abc"` | `0` | nothing to draw from |

## Intuition

Scan `s` from left to right. At each character of `s` you either **use** it (if
it matches the next needed character of `t`) or **skip** it. The state is how
much of `s` and how much of `t` has been consumed.

## Approach

1. Let `dp[i][j]` = number of ways to form `t[:j]` from `s[:i]`.
2. Base cases: `dp[i][0] = 1` (the empty target), `dp[0][j] = 0` for `j > 0`.
3. Transition:

   ```
   dp[i][j] = dp[i-1][j]                          # skip s[i-1]
            + dp[i-1][j-1]  if s[i-1] == t[j-1]   # use s[i-1]
   ```

4. Answer is `dp[m][n]`.
5. **Space optimisation:** collapse to one array of size `len(t) + 1`, iterating
   `j` **downwards** so `dp[j-1]` still holds the previous row's value
   (`dp[i-1][j-1]`) and `dp[j]` holds `dp[i-1][j]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Full 2-D table | `O(m · n)` | `O(m · n)` |
| Rolling row | `O(m · n)` | `O(n)` |

Counts can exceed 32-bit range for long strings; Python integers handle that.

## Edge cases

- **`t` empty** — exactly one subsequence (the empty one), so `1`.
- **`s` empty** (and `t` non-empty) — `0`.
- **`s == t`** — exactly `1`.
- **Repeated characters** — `"aaaaa"` / `"aa"` = C(5, 2) = `10`.

## Solution (`solution.py`)

```python
def num_distinct(s: str, t: str) -> int:
    n = len(t)
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, len(s) + 1):
        ch = s[i - 1]
        for j in range(n, 0, -1):
            if ch == t[j - 1]:
                dp[j] += dp[j - 1]
    return dp[n]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py distinct_subsequences

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py distinct_subsequences -c '["rabbbit", "rabbit"]'
```
