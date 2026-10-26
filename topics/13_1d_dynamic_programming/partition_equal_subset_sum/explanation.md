# Partition Equal Subset Sum

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/partition-equal-subset-sum/) · [NeetCode](https://neetcode.io/problems/partition-equal-subset-sum)

## Problem

Given an integer array `nums`, return `true` if it can be partitioned into two
subsets whose sums are **equal**.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[1, 5, 11, 5]` | `true` | `{1, 5, 5}` and `{11}` both sum to `11` |
| `[1, 2, 3, 5]` | `false` | total `11`, impossible to halve |
| `[2, 2, 1, 1]` | `true` | `{2, 1}` and `{2, 1}` both sum to `3` |

## Intuition

If the two halves are equal, each must sum to `total / 2`. So the question
becomes: **can some subset reach `total / 2`?** That is the classic 0/1
subset-sum (knapsack) problem, where the single DP dimension is the running
subset sum.

## Approach

1. If `total` is odd, return `false` immediately.
2. Let `dp[t]` = can a subset reach sum `t`? Set `dp[0] = True`.
3. For each `num`, update **in place and in descending order** of `t`:

   ```
   dp[t] = dp[t] or dp[t - num]      for t = target down to num
   ```

   Descending order ensures each number is used at most once (0/1 knapsack);
   ascending order would allow unbounded reuse.
4. Return `dp[target]`.
5. **In-place optimisation:** the natural table is `O(n · target)`, but only one
   row is needed — overwriting the same array in the right direction shrinks
   space to `O(target)`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| 1-D in-place DP (optimal) | `O(n · target)` | `O(target)` |
| 2-D DP | `O(n · target)` | `O(n · target)` |
| Brute force (all subsets) | `O(2^n)` | `O(n)` |

## Edge cases

- **Odd total** — immediate `false`.
- **Single element** — cannot be split unless it is `0` and paired; with one
  number the total is odd or the subset can't reach half, so `false` here.
- **Duplicates** (`[2, 2, 1, 1]`) — the in-place order prevents a value being
  counted twice.
- **Exact half huge** — the target can be large, so the DP must be efficient;
  the `target = total // 2` bound keeps it to one sum dimension.

## Solution (`solution.py`)

```python
def can_partition(nums: List[int]) -> bool:
    total = sum(nums)
    if total % 2 != 0:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for num in nums:
        for total_so_far in range(target, num - 1, -1):
            dp[total_so_far] = dp[total_so_far] or dp[total_so_far - num]
    return dp[target]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py partition_equal_subset_sum

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py partition_equal_subset_sum -c '[[1,5,11,5]]'
```
