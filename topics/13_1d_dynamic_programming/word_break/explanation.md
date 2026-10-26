# Word Break

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/word-break/) · [NeetCode](https://neetcode.io/problems/word-break)

## Problem

Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s`
can be segmented into one or more dictionary words (words may be reused).

## Examples

| `s` | `wordDict` | Output |
| --- | --- | --- |
| `"leetcode"` | `["leet", "code"]` | `true` |
| `"applepenapple"` | `["apple", "pen"]` | `true` |
| `"catsandog"` | `["cats", "dog", "sand", "and", "cat"]` | `false` |

## Intuition

A prefix of `s` is segmentable if you can cut it into a **segmentable prefix**
followed by a dictionary word. So knowing whether all short prefixes are
segmentable lets us answer longer ones. The state is only a prefix length, so
this is 1-D DP.

## Approach

1. `dp[i]` = can `s[:i]` be segmented? `dp[0] = True` (empty string).
2. For each end `i` from `1` to `n`, try every split `j < i`:

   ```
   dp[i] = True  if  dp[j] and s[j:i] in word_dict   for some j
   ```

3. Return `dp[n]`.
4. A `set` makes membership `O(1)`, and the inner loop breaks on the first hit.
   Completely **iterative bottom-up**, so no recursion stack is used.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Bottom-up DP | `O(n^2)` | `O(n)` |
| Memoised recursion | `O(n^2)` | `O(n)` |
| Brute force | exponential | — |

## Edge cases

- **Single character** — succeeds only if that character is a word.
- **Reuse of words** — `"applepenapple"` uses `"apple"` twice.
- **Many overlapping splits** (`"aaaaaa"`) — each position may be reachable
  from several previous positions; the `any` covers them all.
- **Greedy traps** — `"cars"` with `["car", "ca", "rs"]` needs `ca + rs`; no
  greedy choice of the longest word works.
- **Empty `wordDict`** — nothing is segmentable except the empty string.

## Solution (`solution.py`)

```python
def word_break(s: str, word_dict: List[str]) -> bool:
    words = set(word_dict)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    for end in range(1, n + 1):
        for start in range(end):
            if dp[start] and s[start:end] in words:
                dp[end] = True
                break
    return dp[n]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py word_break

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py word_break -c '["leetcode", ["leet","code"]]'
```
