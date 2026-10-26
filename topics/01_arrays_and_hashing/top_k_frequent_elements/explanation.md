# Top K Frequent Elements

**Topic:** Arrays & Hashing · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) · [NeetCode](https://neetcode.io/problems/top-k-elements-in-list)

## Problem

Given an integer array `nums` and an integer `k`, return the `k` most frequent
elements **in any order**. The answer is guaranteed to be unique in the sense
that the set of top-`k` elements is well-defined.

## Examples

| `nums` | `k` | Output (any order) |
| --- | --- | --- |
| `[1,1,1,2,2,3]` | `2` | `[1, 2]` |
| `[1]` | `1` | `[1]` |

## Intuition

Two independent steps: **count** frequencies, then **select** the `k` highest.
A hash map handles counting. For selection we can either sort by frequency
(`O(n log n)`) or, since frequencies lie in `[1, n]`, use **bucket sort** to get
`O(n)`.

## Approach (bucket sort)

1. Count occurrences into `counts` (value → frequency).
2. Create `n + 1` buckets where `buckets[f]` holds every value with frequency `f`.
3. Walk buckets from the highest frequency down, collecting values until we have
   `k` of them.

Because a frequency is at most `n`, the bucket array is linear and no comparison
sort is needed.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Bucket sort (optimal) | `O(n)` | `O(n)` |
| Heap of size k | `O(n log k)` | `O(n + k)` |
| Sort by count | `O(n log n)` | `O(n)` |

## Edge cases

- `k` equals the number of distinct values → return all of them.
- All values share the same frequency → output order is free, hence
  `compare: "unordered"`.
- Single element array.

## Solution

```python
def top_k_frequent(nums: List[int], k: int) -> List[int]:
    counts = {}
    for value in nums:
        counts[value] = counts.get(value, 0) + 1

    buckets = [[] for _ in range(len(nums) + 1)]
    for value, freq in counts.items():
        buckets[freq].append(value)

    result = []
    for freq in range(len(buckets) - 1, 0, -1):
        for value in buckets[freq]:
            result.append(value)
            if len(result) == k:
                return result
    return result
```

## How to run

```bash
python3 run.py top_k_frequent_elements
python3 run.py top_k_frequent_elements -c '[[1,1,1,2,2,3], 2]'
```
