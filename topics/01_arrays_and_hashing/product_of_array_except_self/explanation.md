# Product of Array Except Self

**Topic:** Arrays & Hashing · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/product-of-array-except-self/) · [NeetCode](https://neetcode.io/problems/products-of-array-discluding-self)

## Problem

Given an integer array `nums`, return an array `out` such that `out[i]` is the
product of **all elements of `nums` except `nums[i]`**.

Constraints: solve it in `O(n)` time and **without using division**.

## Examples

| `nums` | Output |
| --- | --- |
| `[1, 2, 3, 4]` | `[24, 12, 8, 6]` |
| `[-1, 1, 0, -3, 3]` | `[0, 0, 9, 0, 0]` |

## Intuition

`out[i]` is just *(product of everything left of `i`) × (product of everything
right of `i`)*. If we precompute prefix products and suffix products, we can
combine them in one more pass — all linear, and no division, so zeros are fine.

The elegant part: we can **reuse the output array** to hold the prefix products,
then multiply in the suffix products on the way back. That keeps extra space at
`O(1)`.

## Approach

1. First pass (left → right): `result[i]` accumulates the product of all elements
   strictly to the left of `i`.
2. Second pass (right → left): maintain a running `suffix` product of everything
   to the right, and multiply it into `result[i]`.

At each index, `result[i]` ends up as `left_product × right_product`.

## Walkthrough

`nums = [1, 2, 3, 4]`

| i | after left pass (`result`) | suffix before multiply | after right pass |
| --- | --- | --- | --- |
| 0 | `[1,_,_,_]` | 24 | `[24,_,_,_]` |
| 1 | `[1,1,_,_]` | 12 | `[24,12,_,_]` |
| 2 | `[1,1,2,_]` | 4 | `[24,12,8,_]` |
| 3 | `[1,1,2,6]` | 1 | `[24,12,8,6]` |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Prefix + suffix | `O(n)` | `O(1)` extra |
| With division (forbidden, breaks on zeros) | `O(n)` | `O(1)` |

## Edge cases

- **One zero** — every position except the zero's index becomes `0`; the zero's
  own position gets the product of everything else.
- **Two or more zeros** — every output is `0`.
- **Negatives** — sign parity is handled automatically by multiplication.
- **Minimum length 2.**

## Solution

```python
def product_except_self(nums: List[int]) -> List[int]:
    n = len(nums)
    result = [1] * n

    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]

    return result
```

## How to run

```bash
python3 run.py product_of_array_except_self
python3 run.py product_of_array_except_self -c '[[1,2,3,4]]'
```
