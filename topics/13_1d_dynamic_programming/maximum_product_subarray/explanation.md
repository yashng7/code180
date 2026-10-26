# Maximum Product Subarray

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/maximum-product-subarray/) · [NeetCode](https://neetcode.io/problems/maximum-product-subarray)

## Problem

Given an integer array `nums`, find the contiguous subarray with the largest
**product** and return that product.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[2, 3, -2, 4]` | `6` | `[2, 3]` |
| `[-2, 0, -1]` | `0` | `[0]` beats the negatives |
| `[-2, 3, -4]` | `24` | `[-2, 3, -4]` |

## Intuition

Products are not monotonic like sums: a **very negative** product can become
the maximum as soon as another negative arrives. So while scanning we keep two
values for the subarray ending at the current index:

- `current_max` — the largest product ending here,
- `current_min` — the smallest (most negative) product ending here.

When the next number is negative, the smallest becomes the largest, so we swap
before updating. The answer is the best `current_max` ever seen.

## Approach

1. Initialise `best = current_max = current_min = nums[0]`.
2. For each `value` in `nums[1:]`:
   - if `value < 0`, swap `current_max` and `current_min`;
   - `current_max = max(value, current_max * value)`;
   - `current_min = min(value, current_min * value)`;
   - `best = max(best, current_max)`.
3. Return `best`.
4. **Rolling variables:** only the two products ending at the previous index are
   kept, so the `O(n)` DP array collapses to `O(1)`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Rolling variables (optimal) | `O(n)` | `O(1)` |
| Array DP (`dp_max`, `dp_min`) | `O(n)` | `O(n)` |
| Brute force | `O(n^2)` | `O(1)` |

## Edge cases

- **Single element** — the answer is that element, even if negative.
- **Zero** — resets the running product; the subarray restarts.
- **Odd vs even count of negatives** — an odd number of negatives may require
  dropping one end (handled implicitly by tracking the running min).
- **All negatives** — the maximum is the best single element or the best
  even-length run.

## Solution (`solution.py`)

```python
def max_product(nums: List[int]) -> int:
    best = current_max = current_min = nums[0]
    for value in nums[1:]:
        if value < 0:
            current_max, current_min = current_min, current_max
        current_max = max(value, current_max * value)
        current_min = min(value, current_min * value)
        best = max(best, current_max)
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py maximum_product_subarray

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py maximum_product_subarray -c '[[2,3,-2,4]]'
```
