"""LRU Cache — Linked List.

Design a data structure for a least-recently-used cache with ``get`` and
``put`` in O(1) time. Combines a hash map with a doubly linked list.

Time O(1) per operation · Space O(capacity)
"""
from typing import Dict, Optional


class _Node:
    """Doubly linked list node holding a cache key and value."""

    __slots__ = ("key", "value", "prev", "next")

    def __init__(self, key: int = 0, value: int = 0) -> None:
        self.key = key
        self.value = value
        self.prev: Optional["_Node"] = None
        self.next: Optional["_Node"] = None


class LRUCache:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self._map: Dict[int, _Node] = {}
        # Sentinels: head.next is the least recent, tail.prev the most recent.
        self._head = _Node()
        self._tail = _Node()
        self._head.next = self._tail
        self._tail.prev = self._head

    def _remove(self, node: _Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add(self, node: _Node) -> None:
        """Insert ``node`` right before the tail sentinel (most recent)."""
        last = self._tail.prev
        last.next = node
        node.prev = last
        node.next = self._tail
        self._tail.prev = node

    def get(self, key: int) -> int:
        node = self._map.get(key)
        if node is None:
            return -1
        self._remove(node)
        self._add(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        existing = self._map.get(key)
        if existing is not None:
            self._remove(existing)
        node = _Node(key, value)
        self._map[key] = node
        self._add(node)
        if len(self._map) > self.capacity:
            lru = self._head.next
            self._remove(lru)
            del self._map[lru.key]


if __name__ == "__main__":
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    print(cache.get(1))  # 1
    cache.put(3, 3)      # evicts key 2
    print(cache.get(2))  # -1
