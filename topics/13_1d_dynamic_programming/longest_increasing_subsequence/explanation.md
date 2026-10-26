# Longest Increasing Subsequence

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/longest-increasing-subsequence/) · [NeetCode](https://neetcode.io/problems/longest-increasing-subsequence)

## Problem

Given an integer array `nums`, return the length of the longest **strictly
increasing subsequence**. A subsequence keeps the original order but may skip
elements.

## Examples

| `nums` | Output | Subsequence |
| --- | --- | --- |
| `[10, 9, 2, 5, 3, 7, 101, 18]` | `4` | `[2, 3, 7, 101]` |
| `[0, 1, 0, 3, 2, 3]` | `4` | `[0, 1, 2, 3]` |
| `[7, 7, 7, 7, 7]` | `1` | any single `7` |

## Intuition

Let `dp[i]` be the length of the longest increasing subsequence that **ends at
index `i`**. For it to end at `i`, the previous element can be any earlier
`j` with a smaller value, so we extend the best such chain by one. The overall
answer is the best `dp[i]` anywhere.

## Approach

1. Initialise `dp[i] = 1` for all `i`.
2. For each `i`, scan all `j < i`:

   ```
   if nums[j] < nums[i]:
       dp[i] = max(dp[i], dp[j] + 1)
   ```

3. Return `max(dp)`.
4. **Space note:** the `O(n)` `dp` array can be replaced by patience sorting
   (tails + binary search) for `O(n log n)` time, or, when only the length is
   wanted, the tails array is itself the rolling state.

## Complexity

| | Time | Space |
| --- | --- | --- |
| DP (this solution) | `O(n^2)` | `O(n)` |
| Patience sorting (optimal) | `O(n log n)` | `O(n)` |
| Brute force (all subsets) | `O(2^n)` | `O(n)` |

## Edge cases

- **Empty / single element** — answer `0` / `1`.
- **All equal** — strictly increasing means equal values do not extend a
  chain, so the answer is `1`.
- **Decreasing array** — answer `1`.
- **Non-contiguous** — `[3, 4, -1, 0, 6, 2, 3]` gives `[-1, 0, 2, 3]` (length
  `4`); note the subsequence is not a subarray.

## Solution (`solution.py`)

```python
def length_of_lis(nums: List[int]) -> int:
    if not nums:
        return 0
    dp = [1] * len(nums)
    best = 1
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
        best = max(best, dp[i])
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py longest_increasing_subsequence

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py longest_increasing_subsequence -c '[[10,9,2,5,3,7,101,18]]'
```
