"""Pacific Atlantic Water Flow — Graphs.

Return every cell `[r, c]` from which water can flow to *both* the Pacific
(top/left edges) and the Atlantic (bottom/right edges) ocean, moving only to
neighbours of equal or lower height.

Time O(m · n) · Space O(m · n)
"""
from collections import deque
from typing import List, Set, Tuple


def pacific_atlantic(heights: List[List[int]]) -> List[List[int]]:
    """Two reverse BFS floods (one per ocean); intersect the reachable sets."""
    if not heights or not heights[0]:
        return []

    rows, cols = len(heights), len(heights[0])
    directions = ((1, 0), (-1, 0), (0, 1), (0, -1))

    def flood(starts: List[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        """Cells that can reach the given ocean set, searching *uphill*."""
        reachable = set(starts)
        queue = deque(starts)
        while queue:
            r, c = queue.popleft()
            for dr, dc in directions:
                nr, nc = r + dr, c + dc
                if (
                    0 <= nr < rows
                    and 0 <= nc < cols
                    and (nr, nc) not in reachable
                    and heights[nr][nc] >= heights[r][c]   # water flows r -> nr downhill
                ):
                    reachable.add((nr, nc))
                    queue.append((nr, nc))
        return reachable

    pacific = [(0, c) for c in range(cols)] + [(r, 0) for r in range(1, rows)]
    atlantic = [(rows - 1, c) for c in range(cols)] + [
        (r, cols - 1) for r in range(rows - 1)
    ]

    from_pacific = flood(pacific)
    from_atlantic = flood(atlantic)

    return [
        [r, c]
        for r in range(rows)
        for c in range(cols)
        if (r, c) in from_pacific and (r, c) in from_atlantic
    ]


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        return pacific_atlantic(heights)


if __name__ == "__main__":
    print(pacific_atlantic([[1]]))  # [[0, 0]]
