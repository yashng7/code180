# Burst Balloons

**Topic:** 2-D Dynamic Programming · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/burst-balloons/) · [NeetCode](https://neetcode.io/problems/burst-balloons)

## Problem

Given `nums`, each burst of balloon `i` yields
`nums[i-1] * nums[i] * nums[i+1]` coins, where the neighbours are the balloons
still standing (out-of-range neighbours count as `1`). Burst all balloons and
return the maximum coins.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[3, 1, 5, 8]` | `167` | burst `1`, `5`, `3`, then `8` |
| `[1, 5]` | `10` | burst `1` first (`1·1·5`), then `5` |
| `[5]` | `5` | single balloon |
| `[1, 2, 3]` | `12` | burst `2` first |

## Intuition

Choosing the **first** balloon to burst is hard because it changes the
neighbours of everything around it. Flip the order of thinking: choose which
balloon is burst **last** in an interval. When `k` is burst last between
boundaries `left` and `right`, its neighbours are exactly those boundaries, and
the two sides become independent sub-problems. This is **interval DP**.

## Approach

1. Pad the array with a virtual `1` on each side: `arr = [1] + nums + [1]`.
   These boundary balloons are never burst and always remain.
2. Let `dp[left][right]` = max coins from bursting every balloon strictly
   between `left` and `right`.
3. Fill intervals by **width** (small to large); for each choose the last
   balloon `k` in `(left, right)`:

   ```
   dp[left][right] = max( arr[left] * arr[k] * arr[right]
                          + dp[left][k] + dp[k][right] )
   ```

4. Answer is `dp[0][n-1]` over the padded array.
5. **Space:** the full `O(n^2)` table is needed because entries overlap across
   widths; the time cannot easily drop below `O(n^3)`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Interval DP | `O(n^3)` | `O(n^2)` |
| Brute force over burst orders | exponential | — |

## Edge cases

- **Single balloon `[x]`** — payout `1 · x · 1 = x`.
- **Empty `nums`** — `0` (nothing to burst).
- **Zero-valued balloons** — bursting a `0` pays `0`; the DP still considers it
  as a possible last balloon.
- **Choosing the last balloon, not the first** — the boundary trick is what
  makes the sub-problems independent.

## Solution (`solution.py`)

```python
def max_coins(nums: List[int]) -> int:
    arr = [1] + nums + [1]
    n = len(arr)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for left in range(0, n - length):
            right = left + length
            for k in range(left + 1, right):
                coins = (
                    arr[left] * arr[k] * arr[right]
                    + dp[left][k]
                    + dp[k][right]
                )
                if coins > dp[left][right]:
                    dp[left][right] = coins
    return dp[0][n - 1]
```

## How to run the tests

```bash
# built-in test cases (6 of them)
python3 run.py burst_balloons

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py burst_balloons -c '[[3,1,5,8]]'
```
