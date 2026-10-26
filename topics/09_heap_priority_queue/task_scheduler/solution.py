"""Task Scheduler — Heap / Priority Queue.

Given CPU tasks and a cooldown ``n`` between two runs of the same task, return
the minimum number of intervals (including idle slots) to finish all tasks.

Idea: the most frequent task dominates the schedule. If its frequency is ``f``
and there are ``m`` tasks with frequency ``f``, the answer is at least
``(f - 1) * (n + 1) + m``; idle gaps can be filled by other tasks, and if there
are more tasks than gaps they simply run back-to-back, so the answer is the
larger of that bound and ``len(tasks)``.

Time  O(t) · Space O(1) (26 possible task labels)
"""
from collections import Counter
from typing import List


def least_interval(tasks: List[str], n: int) -> int:
    """Return the least number of intervals needed to run every task."""
    counts = Counter(tasks)
    max_freq = max(counts.values())
    # how many distinct tasks share the maximum frequency
    max_freq_tasks = sum(1 for freq in counts.values() if freq == max_freq)
    return max((max_freq - 1) * (n + 1) + max_freq_tasks, len(tasks))


if __name__ == "__main__":
    print(least_interval(["A", "A", "A", "B", "B", "B"], 2))          # 8
    print(least_interval(["A", "C", "A", "B", "A", "B"], 1))          # 6
    print(least_interval(["A", "A", "A", "B", "B", "B"], 0))          # 6
