# Time Based Key-Value Store

**Topic:** Binary Search · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/time-based-key-value-store/) · [NeetCode](https://neetcode.io/problems/time-based-key-value-store)

## Problem

Design a time-based key-value store that supports two operations:

- `set(key, value, timestamp)` — store `value` for `key` at `timestamp`.
- `get(key, timestamp)` — return the value stored for `key` at the largest
  timestamp **less than or equal to** the query `timestamp`, or `""` if there is
  none.

All `set` calls for a given key arrive with **strictly increasing** timestamps.

## Examples

Official sequence:

```
set("foo", "bar",  1)
get("foo", 1)   -> "bar"
get("foo", 3)   -> "bar"     # only earlier timestamp is 1
set("foo", "bar2", 4)
get("foo", 4)   -> "bar2"
get("foo", 5)   -> "bar2"
```

| `op` | `key` | `timestamp` | result |
| --- | --- | --- | --- |
| `set` | `foo` | `1` | — |
| `get` | `foo` | `1` | `"bar"` |
| `get` | `foo` | `3` | `"bar"` |
| `set` | `foo` | `4` | — |
| `get` | `foo` | `4` | `"bar2"` |
| `get` | `foo` | `5` | `"bar2"` |

## Intuition

`set` only ever appends, and timestamps are strictly increasing per key — so the
list of `(timestamp, value)` pairs for a key is **already sorted** by timestamp.

`get` is then a classic "find the rightmost element not greater than `x`"
query, which is a binary search:

- if the entry at `mid` has `timestamp <= query`, it is a candidate; remember it
  and search **right** for a possibly larger (closer) timestamp;
- otherwise the entry is too new, search **left**.

A hash map from key → list keeps `set` `O(1)` amortized and the search `O(log n)`.

## Approach

1. In `__init__`, create `self._store: dict[str, list[tuple[int, str]]]`.
2. `set(key, value, timestamp)`: `self._store.setdefault(key, []).append((timestamp, value))`.
3. `get(key, timestamp)`:
   - return `""` if the key is unknown;
   - binary search the list for the rightmost `timestamp <= query`, tracking the
     best value seen; return `""` if none qualifies.

An alternative is `bisect_right` on a list of timestamps, which finds the same
insertion point in library code.

## Complexity

| Operation | Time | Space |
| --- | --- | --- |
| `set` | `O(1)` amortized | `O(1)` |
| `get` | `O(log n)` where `n` = entries for that key | `O(1)` |

Overall space is `O(N)` for `N` total `set` calls.

## Edge cases

- **Unknown key** — `get` returns `""`.
- **Query before the earliest timestamp** — no candidate, returns `""`.
- **Query after the latest timestamp** — the last value is returned.
- **Duplicate timestamps** — the latest `set` for that timestamp wins because it
  was appended last and the search prefers the rightmost match.
- **Multiple keys** — each key has its own independent timestamp list.
- **Timestamps in gaps** — the search naturally returns the preceding value.

## Solution (`solution.py`)

```python
class TimeMap:
    def __init__(self) -> None:
        self._store: Dict[str, List[Tuple[int, str]]] = {}

    def set(self, key: str, value: str, timestamp: int) -> None:
        self._store.setdefault(key, []).append((timestamp, value))

    def get(self, key: str, timestamp: int) -> str:
        entries = self._store.get(key)
        if not entries:
            return ""
        lo, hi = 0, len(entries) - 1
        result = ""
        while lo <= hi:
            mid = (lo + hi) // 2
            if entries[mid][0] <= timestamp:
                result = entries[mid][1]
                lo = mid + 1
            else:
                hi = mid - 1
        return result
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py time_based_key_value_store

# same tests through pytest
pytest topics/05_binary_search/time_based_key_value_store -v
```
