# Two Sum II - Input Array Is Sorted

**Topic:** Two Pointers · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) · [NeetCode](https://neetcode.io/problems/two-integer-sum-ii)

## Problem

Given a **1-indexed** array `numbers` that is sorted in **non-decreasing
order**, find two numbers that add up to `target` and return their 1-indexed
indices `[i, j]`. Exactly one solution exists, and you may not use the same
element twice. Your solution must use **`O(1)` extra space**.

## Examples

| `numbers` | `target` | Output | Why |
| --- | --- | --- | --- |
| `[2, 7, 11, 15]` | `9` | `[1, 2]` | `numbers[1] + numbers[2] = 2 + 7 = 9` |
| `[2, 3, 4]` | `6` | `[1, 3]` | `2 + 4 = 6` |
| `[-1, 0]` | `-1` | `[1, 2]` | `-1 + 0 = -1` |

## Intuition

The array is **sorted**, so the smallest element is at the left and the largest
is at the right. Aim two pointers at those extremes and let the current sum
guide you:

- If the sum is **too small**, the only way to increase it is to move `left`
  right (to a bigger number).
- If the sum is **too large**, move `right` left (to a smaller number).
- If it matches, we are done.

Every move eliminates an element that can never be part of a valid pair, so we
never have to look back — a single linear scan replaces the `O(n log n)`
binary-search or `O(n)` hash-map approaches, and it uses no extra memory.

## Approach

1. Set `left = 0` and `right = len(numbers) - 1`.
2. While `left < right`:
   - compute `total = numbers[left] + numbers[right]`;
   - if `total == target`, return `[left + 1, right + 1]` (1-indexed);
   - if `total < target`, increment `left`;
   - otherwise decrement `right`.
3. The constraints guarantee a unique solution, so the loop always returns.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Two pointers (optimal) | `O(n)` | `O(1)` |
| Hash map | `O(n)` | `O(n)` |
| Binary search per element | `O(n log n)` | `O(1)` |

- **Time `O(n)`** — each iteration moves exactly one pointer inward, so there
  are at most `n - 1` iterations.
- **Space `O(1)`** — only two indices are kept.

## Edge cases

- **Two elements** (`[1, 2], 3`) — the single pair is the answer.
- **Negatives** (`[-3, 3, 4, 90], 0`) — the sum logic is unchanged.
- **Duplicates** (`[1, 2, 3, 4, 4, 9, 56, 90], 8`) — the pair `[4, 5]` is found
  because both pointers still meet it before crossing.
- **1-indexing** — remember to add `1` to each index before returning.

## Solution (`solution.py`)

```python
def two_sum(numbers: List[int], target: int) -> List[int]:
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]
        if total < target:
            left += 1
        else:
            right -= 1
    return []
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py two_sum_ii

# same tests through pytest
pytest topics/02_two_pointers/two_sum_ii -v

# your own case, one-shot
python3 run.py two_sum_ii -c '[[2,7,11,15], 9]'
```

> Note: `compare` is set to `unordered` in `problem.json`, so `[2, 1]` is
> accepted wherever `[1, 2]` is.
