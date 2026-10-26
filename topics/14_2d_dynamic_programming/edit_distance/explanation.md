# Edit Distance

**Topic:** 2-D Dynamic Programming · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/edit-distance/) · [NeetCode](https://neetcode.io/problems/edit-distance)

## Problem

Given `word1` and `word2`, return the minimum number of single-character
insertions, deletions or replacements needed to turn `word1` into `word2`
(the Levenshtein distance).

## Examples

| `word1` | `word2` | Output | Why |
| --- | --- | --- | --- |
| `"horse"` | `"ros"` | `3` | replace `h`, drop `r`, drop `e` |
| `"intention"` | `"execution"` | `5` | |
| `"abc"` | `"abc"` | `0` | identical |
| `""` | `"a"` | `1` | insert one character |

## Intuition

Look at the last characters of the two prefixes. They either match (cost `0`) or
must be reconciled with a `replace`. Alternatively drop the last character of
`word1` (a **delete**) or the last character of `word2` (an **insert**),
whichever is cheaper. Each choice reduces one index.

## Approach

1. Let `dp[i][j]` = edit distance between `word1[:i]` and `word2[:j]`.
2. Base cases: `dp[i][0] = i` (delete all of `word1`), `dp[0][j] = j` (insert all
   of `word2`).
3. Transition:

   ```
   dp[i][j] = dp[i-1][j-1]                       if word1[i-1] == word2[j-1]
            = 1 + min(dp[i-1][j],      # delete word1[i-1]
                      dp[i][j-1],      # insert word2[j-1]
                      dp[i-1][j-1])    # replace
   ```

4. Answer is `dp[m][n]`.
5. **Space optimisation:** row `i` needs only row `i-1` plus the left neighbour,
   so one array of size `n + 1` suffices. `prev` holds `dp[i-1][j-1]` and
   `saved` holds `dp[i-1][j]` before it is overwritten.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Full 2-D table | `O(m · n)` | `O(m · n)` |
| Rolling row | `O(m · n)` | `O(n)` |

## Edge cases

- **Both empty** — distance `0`.
- **One empty** — distance is the length of the other (all inserts or deletes).
- **Identical strings** — `0`.
- **Only replacements needed** (`"ab"` → `"ba"`) — `2`.

## Solution (`solution.py`)

```python
def min_distance(word1: str, word2: str) -> int:
    n = len(word2)
    dp = list(range(n + 1))
    for i in range(1, len(word1) + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            saved = dp[j]
            if word1[i - 1] == word2[j - 1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, saved, dp[j - 1])
            prev = saved
    return dp[n]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py edit_distance

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py edit_distance -c '["horse", "ros"]'
```
