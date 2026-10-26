# 3Sum

**Topic:** Two Pointers · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/3sum/) · [NeetCode](https://neetcode.io/problems/three-integer-sum)

## Problem

Given an integer array `nums`, return all **unique** triplets
`[nums[i], nums[j], nums[k]]` such that the three indices are distinct and the
triplet sums to `0`. The result must not contain duplicate triplets.

## Examples

| `nums` | Output |
| --- | --- |
| `[-1, 0, 1, 2, -1, -4]` | `[[-1, -1, 2], [-1, 0, 1]]` |
| `[0, 1, 1]` | `[]` |
| `[0, 0, 0]` | `[[0, 0, 0]]` |

## Intuition

A brute-force check of every triple is `O(n^3)`. The key observation is that if
we **fix one number** `a = nums[i]`, the problem collapses to "find two numbers
that sum to `-a`" — exactly the sorted two-pointer problem (Two Sum II).

Sorting the array first makes the two-pointer scan possible. For each anchor we
aim `left` at the next element and `right` at the end; the sum with the anchor
tells us which pointer to move:

- sum `< 0` → move `left` right to a larger value,
- sum `> 0` → move `right` left to a smaller value,
- sum `= 0` → record the triplet, then move **both** pointers.

Duplicates are the only remaining wrinkle: identical anchors or identical inner
values would produce the same triplet twice, so we skip them.

## Approach

1. Sort `nums` in place.
2. For each index `i` from `0` to `n - 3`:
   - skip `i` if `nums[i] == nums[i - 1]` (duplicate anchor);
   - if `nums[i] > 0`, break — all remaining values are positive;
   - set `left = i + 1`, `right = n - 1` and run the two-pointer scan for
     `target = -nums[i]`;
   - on a match, record it, advance both pointers, and skip equal neighbours
     on both sides.
3. Return the collected triplets.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + two pointers (optimal) | `O(n^2)` | `O(1)` extra |
| Brute force triples | `O(n^3)` | `O(1)` extra |

- **Time `O(n^2)`** — one `O(n log n)` sort, then `O(n)` anchors each with an
  `O(n)` inward two-pointer scan.
- **Space `O(1)`** extra beyond the output (the sort recurses `O(log n)` deep in
  the worst case).

## Edge cases

- **Fewer than 3 elements** (`[]`, `[0]`) — no triplet, return `[]`.
- **All zeros** (`[0, 0, 0]`, `[0, 0, 0, 0]`) — exactly one triplet
  `[0, 0, 0]`; duplicate skipping guarantees it is emitted once.
- **Repeated values** (`[-2, 0, 0, 2, 2]`) — the triplet `[-2, 0, 2]` must
  appear only once.
- **Positive-only array** — the `nums[i] > 0` break exits early with `[]`.

## Solution (`solution.py`)

```python
def three_sum(nums: List[int]) -> List[List[int]]:
    nums.sort()
    result: List[List[int]] = []
    n = len(nums)

    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        if nums[i] > 0:
            break

        left, right = i + 1, n - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1

    return result
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py three_sum

# same tests through pytest
pytest topics/02_two_pointers/three_sum -v

# your own case, one-shot
python3 run.py three_sum -c '[[-1,0,1,2,-1,-4]]'
```

> Note: `compare` is set to `unordered_inner` in `problem.json`, so the order of
> triplets and the order of values inside a triplet do not matter.
