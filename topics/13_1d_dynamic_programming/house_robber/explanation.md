# House Robber

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/house-robber/) · [NeetCode](https://neetcode.io/problems/house-robber)

## Problem

You are a robber planning to rob houses along a street. `nums[i]` is the money
in house `i`. Adjacent houses share a security system, so you **cannot rob two
adjacent houses**. Return the maximum amount you can rob.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[1, 2, 3, 1]` | `4` | rob houses 0 and 2 (`1 + 3`) |
| `[2, 7, 9, 3, 1]` | `12` | rob houses 0, 2 and 4 (`2 + 9 + 1`) |
| `[2, 1, 1, 2]` | `4` | rob the two ends (`2 + 2`) |

## Intuition

At each house you make a binary choice: **rob it** (and be forced to skip the
next) or **skip it**. Defining `dp[i]` as the best haul using houses `0..i`:

- rob house `i`: gain `nums[i]` plus the best from `0..i-2`;
- skip house `i`: keep the best from `0..i-1`.

This is the classic "include or exclude" DP, and it needs only the previous two
states.

## Approach

1. Base case: `dp[-1] = 0` (no houses) and `dp[0] = nums[0]`.
2. Recurrence for `i >= 1`:

   ```
   dp[i] = max(dp[i-1], dp[i-2] + nums[i])
   ```

3. The answer is `dp[n-1]`.
4. **Rolling-variable optimisation:** replacing the array with `prev2` and
   `prev1` reduces space from `O(n)` to `O(1)`. There is also an **in-place**
   variant that overwrites `nums[i]` with `dp[i]` (`O(1)` extra space, but it
   mutates the input).

## Complexity

| | Time | Space |
| --- | --- | --- |
| Rolling variables (optimal) | `O(n)` | `O(1)` |
| Array DP | `O(n)` | `O(n)` |
| Brute force (all subsets) | `O(2^n)` | `O(n)` |

## Edge cases

- **Single house** — rob it; `prev1` ends up as `nums[0]`.
- **Two houses** — take the larger one.
- **All zeros** — the answer is `0`.
- **Large houses at both ends** — the DP must be able to take both (e.g.
  `[100, 1, 1, 100] -> 200`); a local greedy rule fails here.

## Solution (`solution.py`)

```python
def rob(nums: List[int]) -> int:
    prev2, prev1 = 0, 0
    for value in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + value)
    return prev1
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py house_robber

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py house_robber -c '[[2,7,9,3,1]]'
```
