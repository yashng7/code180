# Rotate Image

**Topic:** Math & Geometry · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/rotate-image/) · [NeetCode](https://neetcode.io/problems/rotate-matrix)

## Problem

Given an `n x n` 2D matrix representing an image, rotate the image by **90
degrees clockwise**. You must rotate the image **in place**, i.e. modify the
input matrix directly. (The function also returns the rotated matrix.)

## Examples

| Input | Output |
| --- | --- |
| `[[1,2,3],[4,5,6],[7,8,9]]` | `[[7,4,1],[8,5,2],[9,6,3]]` |
| `[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]` | `[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]` |
| `[[1]]` | `[[1]]` |

## Intuition

A 90° clockwise rotation moves the element at `(i, j)` to `(j, n-1-i)`.
Doing that directly needs a temporary per element or a whole copy. But there is
a classic shortcut: the same result is produced by **transposing** the matrix
(swap across the main diagonal) and then **reversing each row**.

Transposing alone mirrors across the diagonal and yields a 90° *counter*-
clockwise rotation; mirroring each row afterwards flips it into the clockwise
rotation we want.

## Approach

1. For every `i`, for every `j > i`, swap `matrix[i][j]` with `matrix[j][i]`.
   Only the strictly-upper triangle is visited because each pair is swapped once.
2. Reverse every row in place.

Both passes move elements within the original array — no second matrix.

## Walkthrough

`[[1,2,3],[4,5,6],[7,8,9]]`

| Step | Matrix |
| --- | --- |
| start | `[[1,2,3],[4,5,6],[7,8,9]]` |
| transpose | `[[1,4,7],[2,5,8],[3,6,9]]` |
| reverse rows | `[[7,4,1],[8,5,2],[9,6,3]]` |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Transpose + reverse (optimal) | `O(n²)` | `O(1)` |
| Copy to a new matrix | `O(n²)` | `O(n²)` |

- **Time `O(n²)`** — every one of the `n²` cells is touched a constant number
  of times.
- **Space `O(1)`** — the rotation happens in place; only loop indices are used.

## Edge cases

- **`n = 1`** — the only element maps to itself; both passes are no-ops.
- **`n = 2`** — the smallest even size; good sanity check for index bounds.
- **Negative / zero values** — rotation is position-only, values are irrelevant.
- **Transpose-only bug** — output would be the counter-clockwise rotation
  `[[3,6,9],[2,5,8],[1,4,7]]` for the 3×3 case; reversing rows fixes it.

## Solution (`solution.py`)

```python
def rotate(matrix: List[List[int]]) -> List[List[int]]:
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
    return matrix
```

## How to run the tests

```bash
# built-in test cases (6 of them)
python3 run.py rotate_image

# same tests through pytest
pytest topics/17_math_and_geometry/rotate_image -v

# your own case, one-shot
python3 run.py rotate_image -c '[[[1,2],[3,4]]]'
```
