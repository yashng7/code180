# LRU Cache

**Topic:** Linked List · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/lru-cache/) · [NeetCode](https://neetcode.io/problems/lru-cache)

## Problem

Design a **Least Recently Used** cache:

- `LRUCache(capacity)` — construct with a positive capacity.
- `get(key) -> int` — return the value, or `-1` if absent; marks the key as most
  recently used.
- `put(key, value)` — insert or update; marks the key as most recently used, and
  evicts the **least recently used** key if over capacity.

Both operations must run in `O(1)` average time.

## Examples

The official sequence (capacity 2):

| Op | Result |
| --- | --- |
| `LRUCache(2)` | `null` |
| `put(1, 1)` | `null` |
| `put(2, 2)` | `null` |
| `get(1)` | `1` |
| `put(3, 3)` | `null` (evicts key 2) |
| `get(2)` | `-1` |
| `put(4, 4)` | `null` (evicts key 1) |
| `get(1)` | `-1` |
| `get(3)` | `3` |
| `get(4)` | `4` |

## Intuition

We need `O(1)` lookup **and** `O(1)` reordering by recency. A hash map gives the
lookup; a **doubly linked list** gives `O(1)` move-to-front and evict-from-back.
Each map value stores the node so we can splice it out without searching.

## Approach

Keep two sentinels: `head` (least recent side) and `tail` (most recent side).

1. `_add(node)` inserts a node just before `tail` (i.e. marks it most recent).
2. `_remove(node)` unlinks a node in `O(1)`.
3. `get` — if missing, `-1`; otherwise move the node to most recent and return it.
4. `put` — if the key exists, unlink the old node; insert the new one; if size
   exceeds capacity, drop `head.next` (the LRU) from both list and map.

## Complexity

| Operation | Time |
| --- | --- |
| `get` | `O(1)` average |
| `put` | `O(1)` average |
| Space | `O(capacity)` |

## Edge cases

- **get on an empty cache** → `-1`.
- **capacity 1** → every `put` of a new key evicts the previous one.
- **put on an existing key** → updates the value and refreshes recency (no size
  growth).
- **`get` refreshes recency**, changing which key is evicted next.
- **Zero / negative keys** — keys are arbitrary integers.

## Solution (`solution.py`)

```python
class LRUCache:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self._map = {}
        self._head, self._tail = _Node(), _Node()
        self._head.next, self._tail.prev = self._tail, self._head

    def get(self, key: int) -> int:
        node = self._map.get(key)
        if node is None:
            return -1
        self._remove(node); self._add(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if key in self._map:
            self._remove(self._map[key])
        node = _Node(key, value)
        self._map[key] = node
        self._add(node)
        if len(self._map) > self.capacity:
            lru = self._head.next
            self._remove(lru)
            del self._map[lru.key]
```

## How to run the tests

```bash
python3 run.py lru_cache
pytest topics/06_linked_list/lru_cache -v
```
