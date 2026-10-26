# Detect Squares

**Topic:** Math & Geometry · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/detect-squares/) · [NeetCode](https://neetcode.io/problems/count-squares)

## Problem

Design a data structure that supports two operations:

- `add(point)` — add a point `[x, y]` to the structure.
- `count(point)` — return the number of ways to choose **three** previously
  added points such that, together with the given `point`, they form an
  **axis-aligned square** with positive area.

## Examples

| Call | Result |
| --- | --- |
| `DetectSquares()` | `null` |
| `add([3, 10])` | `null` |
| `add([11, 2])` | `null` |
| `add([3, 2])` | `null` |
| `count([11, 10])` | `1` |
| `count([14, 8])` | `0` |
| `add([11, 2])` | `null` |
| `count([11, 10])` | `2` |

## Intuition

Every axis-aligned square containing the query point `(px, py)` has exactly one
**vertical edge** on the line `x = px`. That edge is the query point together
with some stored point `(px, y)`, and its length is `side = |y - py|`. The other
two corners are then fully determined: they sit a distance `side` to the left or
to the right, at `(px ± side, py)` and `(px ± side, y)`.

So we store how many times each point was added, and for a query we walk every
stored point on the line `x = px`, forming the candidate square on both sides.
The number of ways for one candidate is the product of the three multiplicities.

## Approach

1. `__init__`: `self._counts = {}` mapping `(x, y) -> multiplicity`.
2. `add(point)`: increment `self._counts[(x, y)]`.
3. `count(point)`:
   - for each stored `((x, y), freq)` with `x == px` and `y != py`:
     - `side = abs(y - py)`;
     - for `nx in (px + side, px - side)`:
       - add `freq * counts[(nx, py)] * counts[(nx, y)]`.
4. Return the total.

Each square is counted exactly once because it has a unique vertical edge on
the line `x = px`.

## Walkthrough

After `add([3,10])`, `add([11,2])`, `add([3,2])`, query `count([11,10])`:

| stored `(x, y)` with `x = 11` | side | `nx` | other corners | product |
| --- | --- | --- | --- | --- |
| `(11, 2)` | `8` | `19` | `(19,10)`, `(19,2)` | `0` (missing) |
| `(11, 2)` | `8` | `3` | `(3,10)`, `(3,2)` | `1 · 1 · 1 = 1` |

Total `= 1`. After adding `[11, 2]` again the same product becomes `2`.

## Complexity

| Operation | Time | Space |
| --- | --- | --- |
| `add` | `O(1)` | `O(1)` amortized |
| `count` | `O(P)` | `O(1)` |
| Overall storage | — | `O(P)` |

`P` is the number of **distinct** points stored. Counting walks all distinct
points (a small constant per point), so it is linear in `P`.

## Edge cases

- **Empty structure** — `count` returns `0`.
- **Side length zero** — a point cannot pair with itself; points on the same
  horizontal line as the query are skipped (`y == py`).
- **Duplicates** — multiplicities multiply, so repeated corners scale the count.
- **Rectangles** — non-square quadrilaterals are rejected because the third and
  fourth corners would be missing.
- **Both directions** — squares may extend left or right of `x = px`; both are
  probed.

## Solution (`solution.py`)

```python
class DetectSquares:
    def __init__(self) -> None:
        self._counts: dict[tuple[int, int], int] = {}

    def add(self, point: List[int]) -> None:
        key = (point[0], point[1])
        self._counts[key] = self._counts.get(key, 0) + 1

    def count(self, point: List[int]) -> int:
        px, py = point
        total = 0
        for (x, y), freq in self._counts.items():
            if x != px or y == py:
                continue
            side = abs(y - py)
            for nx in (px + side, px - side):
                total += freq * self._counts.get((nx, py), 0) \
                    * self._counts.get((nx, y), 0)
        return total
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py detect_squares

# same tests through pytest
pytest topics/17_math_and_geometry/detect_squares -v

# your own case, interactive
python3 run.py detect_squares -c
```
