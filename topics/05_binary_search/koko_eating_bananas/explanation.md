# Koko Eating Bananas

**Topic:** Binary Search · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/koko-eating-bananas/) · [NeetCode](https://neetcode.io/problems/eating-bananas)

## Problem

Koko has `piles` of bananas and `h` hours before the guards return. She picks an
integer eating speed `k` (bananas per hour) and each hour eats from a single
pile:

- if the pile has fewer than `k` bananas she finishes it and stops for that hour;
- if the pile has more, she eats exactly `k` and continues the same pile next
  hour.

Return the **minimum** integer `k` such that she can finish all piles within `h`
hours.

## Examples

| `piles` | `h` | Output | Why |
| --- | --- | --- | --- |
| `[3, 6, 7, 11]` | `8` | `4` | at speed 4 she needs 1+2+2+3 = 8 hours |
| `[30, 11, 23, 4, 20]` | `5` | `30` | only one hour per pile |
| `[30, 11, 23, 4, 20]` | `6` | `23` | speed 22 needs 8 hours, speed 23 needs 6 |

## Intuition — binary search on the **answer**

Normally binary search needs a sorted array. Here there is no array to search —
the thing we are choosing is the **speed `k`** itself. The key observation is
that the *feasibility* of `k` is **monotonic**:

> If speed `k` finishes all piles within `h` hours, then **any faster** speed
> `k + 1` also finishes within `h` hours.

So the set of feasible speeds looks like:

```
infeasible ... infeasible | feasible feasible feasible ...
                          ^
                   the answer: the smallest feasible k
```

That "sorted yes/no boundary" is exactly what binary search finds. We binary
search over the **range of possible answers** `[1, max(piles)]` using a
`feasible(k)` predicate, instead of over an index range.

Why the bounds?

- **`lo = 1`** — the smallest legal speed; if `h >= sum(piles)` it is feasible.
- **`hi = max(piles)`** — at this speed every pile takes exactly one hour, so
  the total is `len(piles)` hours, the fastest possible completion.

The predicate `hours_needed(k) = Σ ceil(pile / k)` is a plain `O(n)` scan, and
binary search runs it `O(log max(piles))` times.

## Approach

1. Define `hours_needed(speed) = sum((pile + speed - 1) // speed for pile in
   piles)` — the integer ceiling of `pile / speed` is `(pile + speed - 1) // speed`.
2. Set `lo = 1`, `hi = max(piles)`.
3. While `lo < hi`:
   - `mid = (lo + hi) // 2`;
   - if `hours_needed(mid) <= h`, `mid` works, but a slower speed might too →
     `hi = mid`;
   - otherwise `mid` is too slow → `lo = mid + 1`.
4. When the window collapses to one value, `lo` is the smallest feasible speed.

Using `lo < hi` with `hi = mid` (not `mid - 1`) keeps the final answer in the
window and avoids an off-by-one.

## Walkthrough

`piles = [3, 6, 7, 11]`, `h = 8`, `lo = 1`, `hi = 11`

| `lo` | `hi` | `mid` | hours at `mid` | ≤ 8? | action |
| --- | --- | --- | --- | --- | --- |
| 1 | 11 | 6 | 1+1+2+2 = 6 | yes | `hi = 6` |
| 1 | 6 | 3 | 1+2+3+4 = 10 | no | `lo = 4` |
| 4 | 6 | 5 | 1+2+2+3 = 8 | yes | `hi = 5` |
| 4 | 5 | 4 | 1+2+2+3 = 8 | yes | `hi = 4` |
| 4 | 4 | — | — | — | **answer = 4** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Binary search on answer | `O(n log max(piles))` | `O(1)` |
| Linear scan over all speeds | `O(n · max(piles))` | `O(1)` |

- **Time `O(n log max(piles))`** — `log max(piles)` feasibility checks, each
  `O(n)`.
- **Space `O(1)`** — only counters are kept.

## Edge cases

- **One pile** — answer is `ceil(pile / h)`, found by the same search.
- **`h == len(piles)`** — every pile must be finished in one hour, so the answer
  is `max(piles)`.
- **Very large `h`** — speed `1` is feasible; the lower bound returns it.
- **Huge pile values** (`10⁹`) — must use ceiling division, not floats, to avoid
  precision problems.
- **`h < len(piles)`** is impossible per the constraints, so `hi = max(piles)` is
  always feasible.

## Solution (`solution.py`)

```python
def min_eating_speed(piles: List[int], h: int) -> int:
    def hours_needed(speed: int) -> int:
        return sum((pile + speed - 1) // speed for pile in piles)

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours_needed(mid) <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py koko_eating_bananas

# same tests through pytest
pytest topics/05_binary_search/koko_eating_bananas -v

# your own case, one-shot
python3 run.py koko_eating_bananas -c '[[3,6,7,11], 8]'
```
