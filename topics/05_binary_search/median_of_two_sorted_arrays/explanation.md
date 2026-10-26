# Median of Two Sorted Arrays

**Topic:** Binary Search · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/median-of-two-sorted-arrays/) · [NeetCode](https://neetcode.io/problems/median-of-two-sorted-arrays)

## Problem

Given two sorted arrays `nums1` and `nums2`, return the median of the combined
data. The overall run time complexity should be `O(log(min(m, n)))`.

## Examples

| `nums1` | `nums2` | Output |
| --- | --- | --- |
| `[1, 3]` | `[2]` | `2.0` |
| `[1, 2]` | `[3, 4]` | `2.5` |
| `[]` | `[1]` | `1.0` |

## Intuition

The median splits the combined data into a **left half** and a **right half** of
(almost) equal size, where every value on the left is `<=` every value on the
right.

Instead of merging, we can *choose the split point* with binary search. Take
`i` elements from `nums1` and `j = half - i` from `nums2`, where

```
half = (m + n + 1) // 2
```

This guarantees the combined left half has the right size regardless of parity
(the `+ 1` makes odd totals keep the extra element on the left).

The split is correct exactly when the two "seam" conditions hold:

```
max(left1, left2) <= min(right1, right2)
```

which we check as `left1 <= right2 and left2 <= right1`. If `left1 > right2` we
took too many from `nums1`, so we move `i` left; otherwise we move `i` right.
Only **one** variable (`i`) needs searching, and we search the shorter array so
`j` is always valid — hence `O(log(min(m, n)))`.

Sentinels `-inf` / `+inf` stand in for the boundaries of empty partitions.

## Approach

1. Ensure `nums1` is the shorter array (swap if not).
2. Set `half = (m + n + 1) // 2` and search `i` in `[0, m]`.
3. For a candidate `i`, compute `j = half - i` and the four neighbours:
   `left1 = nums1[i-1]`, `right1 = nums1[i]`, `left2 = nums2[j-1]`,
   `right2 = nums2[j]` (using `±inf` at the edges).
4. If `left1 <= right2 and left2 <= right1`, the partition is valid:
   - odd total → `max(left1, left2)`;
   - even total → average of `max(left1, left2)` and `min(right1, right2)`.
5. Otherwise adjust the binary search bounds and repeat.

## Walkthrough

`nums1 = [1, 2]`, `nums2 = [3, 4]`, `half = 2`, search `i ∈ [0, 2]`

| `i` | `j = 2-i` | `left1` | `right1` | `left2` | `right2` | valid? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1 | 2 | 3 | 4 | `1 ≤ 4` ✓ and `3 ≤ 2` ✗ → `i` too small |
| 2 | 0 | 2 | `inf` | `-inf` | 3 | `2 ≤ 3` ✓ and `-inf ≤ inf` ✓ → valid |

Even total → `(max(2, -inf) + min(inf, 3)) / 2 = (2 + 3) / 2 = 2.5`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Partition binary search (optimal) | `O(log(min(m, n)))` | `O(1)` |
| Merge then pick the middle | `O(m + n)` | `O(m + n)` |

- **Time `O(log(min(m, n)))`** — binary search over the shorter array only.
- **Space `O(1)`** — four boundary values, no merge buffer.

## Edge cases

- **One array empty** — the sentinels make it a valid partition immediately; the
  median is just the middle of the other array.
- **All values of one array smaller** — the partition lands at an endpoint.
- **Odd vs even totals** — handled by the `(m + n) % 2` branch.
- **Duplicates / zeros** — comparisons are non-strict, so ties are fine.
- **Uneven lengths** — searching the shorter array keeps `j = half - i` inside
  `[0, n]`.

## Solution (`solution.py`)

```python
def find_median_sorted_arrays(nums1: List[int], nums2: List[int]) -> float:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    half = (m + n + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        left1 = nums1[i - 1] if i > 0 else float("-inf")
        right1 = nums1[i] if i < m else float("inf")
        left2 = nums2[j - 1] if j > 0 else float("-inf")
        right2 = nums2[j] if j < n else float("inf")
        if left1 <= right2 and left2 <= right1:
            if (m + n) % 2 == 1:
                return float(max(left1, left2))
            return (max(left1, left2) + min(right1, right2)) / 2.0
        if left1 > right2:
            hi = i - 1
        else:
            lo = i + 1
    raise ValueError("Input arrays are not sorted")
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py median_of_two_sorted_arrays

# same tests through pytest
pytest topics/05_binary_search/median_of_two_sorted_arrays -v

# your own case, one-shot
python3 run.py median_of_two_sorted_arrays -c '[[1,3], [2]]'
```
