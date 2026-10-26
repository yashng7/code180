# Target Sum

**Topic:** 2-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/target-sum/) · [NeetCode](https://neetcode.io/problems/target-sum)

## Problem

Given `nums` and an integer `target`, assign a `+` or `-` sign to every number
and count how many assignments evaluate to `target`.

## Examples

| `nums` | `target` | Output | Why |
| --- | --- | --- | --- |
| `[1, 1, 1, 1, 1]` | `3` | `5` | five ways to have one more `+` than `-` |
| `[1]` | `1` | `1` | `+1` |
| `[1]` | `-1` | `1` | `-1` |
| `[1, 0]` | `1` | `2` | `+0` and `-0` both work |

## Intuition

Split the numbers into the **plus** set `P` and the **minus** set `M`. Then

```
sum(P) - sum(M) = target
sum(P) - (sum(nums) - sum(P)) = target
sum(P) = (sum(nums) + target) / 2
```

So the problem becomes: count the subsets of `nums` whose sum is
`(sum(nums) + target) / 2`. If `|target| > sum(nums)` or the numerator is odd,
the answer is `0`.

## Approach

1. Compute `total = sum(nums)`. Bail out if `|target| > total` or
   `(total + target)` is odd.
2. Let `goal = (total + target) // 2` and `dp[s]` = number of subsets summing to
   `s`. Set `dp[0] = 1` (the empty subset).
3. For each number, sweep `s` from `goal` **down** to `num` (0/1 knapsack, each
   number used once):

   ```
   dp[s] += dp[s - num]
   ```

4. Answer is `dp[goal]`.
5. **Zeros** are handled automatically: for `num == 0` the loop also visits
   `s = 0`, doubling `dp[0]`, which correctly reflects that `+0` and `-0` are
   different assignments.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Subset-sum DP | `O(n · sum(nums))` | `O(sum(nums))` |
| 2-D `dp[i][s]` table | `O(n · sum(nums))` | `O(n · sum(nums))` |
| Brute force `2^n` signs | exponential | `O(n)` |

## Edge cases

- **Unreachable target** (`|target| > sum`) — `0`.
- **Odd `total + target`** — no subset can hit a non-integer goal, `0`.
- **`target = 0`** — counts every balanced split of `nums`.
- **Zero(s) present** — each zero doubles the number of assignments.
- **Negative target** — use `abs(target)` in the bounds check; the subset sum
  formula works unchanged.

## Solution (`solution.py`)

```python
def find_target_sum_ways(nums: List[int], target: int) -> int:
    total = sum(nums)
    if abs(target) > total or (total + target) % 2:
        return 0
    goal = (total + target) // 2
    dp = [0] * (goal + 1)
    dp[0] = 1
    for num in nums:
        for subtotal in range(goal, num - 1, -1):
            dp[subtotal] += dp[subtotal - num]
    return dp[goal]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py target_sum

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py target_sum -c '[[1,1,1,1,1], 3]'
```
