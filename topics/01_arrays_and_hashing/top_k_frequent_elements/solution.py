"""Top K Frequent Elements — Arrays & Hashing.

Return the k most frequent elements (any order).

Time  O(n)  using bucket sort  · Space O(n)
"""
from typing import List


def top_k_frequent(nums: List[int], k: int) -> List[int]:
    counts: dict[int, int] = {}
    for value in nums:
        counts[value] = counts.get(value, 0) + 1

    # buckets[f] = list of values that appear exactly f times
    buckets: List[List[int]] = [[] for _ in range(len(nums) + 1)]
    for value, freq in counts.items():
        buckets[freq].append(value)

    result: List[int] = []
    for freq in range(len(buckets) - 1, 0, -1):
        for value in buckets[freq]:
            result.append(value)
            if len(result) == k:
                return result
    return result


# Simpler O(n log n) version:
#     return [v for v, _ in Counter(nums).most_common(k)]


if __name__ == "__main__":
    print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))  # [1, 2] (any order)
