"""Time Based Key-Value Store — Binary Search.

Store ``(timestamp, value)`` per key and return the value with the largest
timestamp less than or equal to a query timestamp.

set: O(1) amortized · get: O(log n) · Space O(n)
"""
from typing import Dict, List, Tuple


class TimeMap:
    """Append-only store; timestamps arrive strictly increasing per key."""

    def __init__(self) -> None:
        self._store: Dict[str, List[Tuple[int, str]]] = {}

    def set(self, key: str, value: str, timestamp: int) -> None:
        self._store.setdefault(key, []).append((timestamp, value))

    def get(self, key: str, timestamp: int) -> str:
        entries = self._store.get(key)
        if not entries:
            return ""
        # Largest timestamp <= query: rightmost entry that is not too new.
        lo, hi = 0, len(entries) - 1
        result = ""
        while lo <= hi:
            mid = (lo + hi) // 2
            if entries[mid][0] <= timestamp:
                result = entries[mid][1]
                lo = mid + 1          # look for something even closer
            else:
                hi = mid - 1
        return result


if __name__ == "__main__":
    tm = TimeMap()
    tm.set("foo", "bar", 1)
    print(tm.get("foo", 1))    # "bar"
    print(tm.get("foo", 3))    # "bar"
    tm.set("foo", "bar2", 4)
    print(tm.get("foo", 4))    # "bar2"
    print(tm.get("foo", 5))    # "bar2"
