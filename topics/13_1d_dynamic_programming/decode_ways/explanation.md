# Decode Ways

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/decode-ways/) · [NeetCode](https://neetcode.io/problems/decode-ways)

## Problem

A message containing digits can be decoded with the mapping `'1' -> 'A'`,
`'2' -> 'B'`, …, `'26' -> 'Z'`. Given the digit string `s`, return the number
of ways to decode it. A `'0'` cannot be decoded on its own, and a two-digit
group must read as `10`–`26`.

## Examples

| `s` | Output | Why |
| --- | --- | --- |
| `"12"` | `2` | `"AB"` (1,2) or `"L"` (12) |
| `"226"` | `3` | `"BBF"`, `"BZ"`, `"VF"` |
| `"06"` | `0` | a leading `0` cannot be decoded |

## Intuition

Reading left to right, the last decoded letter covers either **one** digit
(`s[i-1]`) or **two** digits (`s[i-2:i]`). Each choice reduces the problem to a
shorter prefix, so `dp[i]` (ways for `s[:i]`) is the sum of the valid
continuations.

## Approach

1. `dp[0] = 1` (the empty string has one decoding) and
   `dp[1] = 1 if s[0] != '0' else 0`.
2. Recurrence for `i >= 2`:

   ```
   dp[i] = (dp[i-1] if 1 <= int(s[i-1])   <= 9  else 0)
         + (dp[i-2] if 10 <= int(s[i-2:i]) <= 26 else 0)
   ```

3. Answer: `dp[n]`.
4. **Rolling-variable optimisation:** each state needs only `dp[i-1]` and
   `dp[i-2]`, kept in `prev1`/`prev2`, so space is `O(1)`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Rolling variables (optimal) | `O(n)` | `O(1)` |
| Array DP | `O(n)` | `O(n)` |
| Recursion | `O(2^n)` | `O(n)` |

## Edge cases

- **Leading zero** (`"06"`) — `dp[1] = 0`, and the pair `"06"` is invalid, so
  the answer is `0`.
- **Bare zero** (`"0"`) — no valid decoding.
- **Forced pairs** (`"10"`, `"210"`) — the `0` must attach to the previous
  digit.
- **`27` and above** — two-digit groups above `26` are invalid, leaving a
  single interpretation.
- **Embedded zeros** (`"11106"`) — zeros break some branches but others
  survive.

## Solution (`solution.py`)

```python
def num_decodings(s: str) -> int:
    if not s:
        return 0
    prev2 = 1
    prev1 = 0 if s[0] == "0" else 1
    for i in range(2, len(s) + 1):
        single = 1 <= int(s[i - 1]) <= 9
        pair = 10 <= int(s[i - 2 : i]) <= 26
        current = (prev1 if single else 0) + (prev2 if pair else 0)
        prev2, prev1 = prev1, current
    return prev1
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py decode_ways

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py decode_ways -c '["226"]'
```
