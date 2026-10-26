# Regular Expression Matching

**Topic:** 2-D Dynamic Programming · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/regular-expression-matching/) · [NeetCode](https://neetcode.io/problems/regular-expression-matching)

## Problem

Implement matching for the pattern operators `.` (matches any single character)
and `*` (matches zero or more of the preceding element). The match must cover
the **entire** string `s`.

## Examples

| `s` | `p` | Output |
| --- | --- | --- |
| `"aa"` | `"a"` | `false` |
| `"aa"` | `"a*"` | `true` |
| `"ab"` | `".*"` | `true` |
| `"aab"` | `"c*a*b"` | `true` |
| `"mississippi"` | `"mis*is*p*."` | `false` |

## Intuition

Match from the front. Whether the first character of the pattern consumes one
character of `s` depends on whether it is followed by `*`. The state is the pair
`(i, j)` — how much of `s` and how much of `p` has been matched.

## Approach

1. Let `dp[i][j]` = does the pattern `p[:j]` match the string `s[:i]`?
2. Base cases: `dp[0][0] = True`, and `dp[0][j] = dp[0][j-2]` whenever
   `p[j-1] == '*'` (a `x*` group can match the empty string).
3. Transition when `p[j-1] == '*'`:

   ```
   dp[i][j] = dp[i][j-2]                                     # use x* zero times
           or (dp[i-1][j] and (p[j-2] == s[i-1] or p[j-2] == '.'))  # one more x
   ```

   Otherwise `dp[i][j] = dp[i-1][j-1] and p[j-1]` matches `s[i-1]`
   (equal, or `.`).
4. Answer is `dp[m][n]`.

The `dp[i-1][j]` term lets a `x*` group consume another copy of `x` without
consuming any of the pattern.

## Complexity

| | Time | Space |
| --- | --- | --- |
| 2-D DP | `O(m · n)` | `O(m · n)` |
| Rolling row | `O(m · n)` | `O(n)` |
| Naive recursion | exponential | `O(m + n)` |

## Edge cases

- **`p` can match the empty string** (`""` with `"c*"`) — `true`.
- **`.` needs one character** — `""` with `"."` is `false`.
- **Leading `x*`** (`"aab"` with `"c*a*b"`) — the `c*` matches nothing.
- **Greedy is wrong** — a `x*` may need to match fewer characters than possible,
  which is why the DP explores all counts.

## Solution (`solution.py`)

```python
def is_match(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(2, n + 1):
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2] or (
                    dp[i - 1][j] and (p[j - 2] == s[i - 1] or p[j - 2] == ".")
                )
            elif p[j - 1] == "." or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[m][n]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py regular_expression_matching

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py regular_expression_matching -c '["aa", "a*"]'
```
