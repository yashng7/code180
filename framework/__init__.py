"""Tiny, dependency-free test harness for the code180 practice repo.

Modules
-------
compare  -- output comparison strategies (exact, unordered, float, ...)
loader   -- find and import problems from ``topics/<topic>/<problem>/``
runner   -- run a problem's test cases and print a readable report
custom   -- run ad-hoc / interactive test cases against a single problem
animate  -- play per-problem terminal animations (``visualize.py``)
htmlviz  -- serve + open per-problem HTML animations (``visualize.html``)
"""

__all__ = ["animate", "compare", "custom", "htmlviz", "loader", "runner"]
