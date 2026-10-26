# Spiral Matrix

**Topic:** Math & Geometry · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/spiral-matrix/) · [NeetCode](https://neetcode.io/problems/spiral-matrix)

## Problem

Given an `m x n` matrix, return all of its elements in **spiral order**,
starting at the top-left corner and moving clockwise.

## Examples

| Input | Output |
| --- | --- |
| `[[1,2,3],[4,5,6],[7,8,9]]` | `[1,2,3,6,9,8,7,4,5]` |
| `[[1,2,3,4],[5,6,7,8],[9,10,11,12]]` | `[1,2,3,4,8,12,11,10,9,5,6,7]` |
| `[[1]]` | `[1]` |

## Intuition

Think of the matrix as a set of nested rectangular rings. Each ring is walked
along four sides: top row (left→right), right column (top→bottom), bottom row
(right→left), and left column (bottom→top). After finishing a ring, all four
boundaries move one step inward and the next, smaller ring begins.

The only trap is the **single row/column** case: after the top row and right
column are consumed the remaining bottom/left segments would repeat already
visited cells, so they must be guarded by boundary checks.

## Approach

1. Keep four boundaries `top, bottom, left, right`.
2. While `top <= bottom` and `left <= right`:
   - append the current top row, then `top += 1`;
   - append the current right column, then `right -= 1`;
   - if `top <= bottom`, append the bottom row right→left, then `bottom -= 1`;
   - if `left <= right`, append the left column bottom→top, then `left += 1`.
3. Return the accumulated list.

## Walkthrough

`[[1,2,3],[4,5,6],[7,8,9]]`

| Ring | Cells added |
| --- | --- |
| outer (top=0,bottom=2,left=0,right=2) | `1,2,3` then `6,9` then `8,7` then `4` |
| inner (top=1,bottom=1,left=1,right=1) | `5` |

Result: `[1,2,3,6,9,8,7,4,5]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Boundary walk (optimal) | `O(m·n)` | `O(1)` extra |

- **Time `O(m·n)`** — every cell is appended exactly once.
- **Space `O(1)`** extra — aside from the output list, only four indices are
  stored.

## Edge cases

- **Single row** — the guarded bottom/left passes are skipped.
- **Single column** — the guarded bottom row pass is skipped.
- **Single element** — one top-row append, then all boundaries cross.
- **Even dimensions** — the inner ring may collapse to one row or column.

## Solution (`solution.py`)

```python
def spiral_order(matrix: List[List[int]]) -> List[int]:
    if not matrix or not matrix[0]:
        return []
    result, top, bottom = [], 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for col in range(left, right + 1):
            result.append(matrix[top][col])
        top += 1
        for row in range(top, bottom + 1):
            result.append(matrix[row][right])
        right -= 1
        if top <= bottom:
            for col in range(right, left - 1, -1):
                result.append(matrix[bottom][col])
            bottom -= 1
        if left <= right:
            for row in range(bottom, top - 1, -1):
                result.append(matrix[row][left])
            left += 1
    return result
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py spiral_matrix

# same tests through pytest
pytest topics/17_math_and_geometry/spiral_matrix -v

# your own case, one-shot
python3 run.py spiral_matrix -c '[[[1,2],[3,4]]]'
```
