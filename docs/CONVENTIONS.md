# Problem authoring conventions

This file is the single source of truth for how a problem is laid out. Follow it
exactly — the runner and the pytest wrappers depend on it.

## Files per problem

```
topics/<NN_topic>/<problem_id>/
├── solution.py        # the Python solution (required)
├── problem.json       # metadata (required)
├── test_cases.json    # built-in cases (required)
├── test_<problem_id>.py   # pytest wrapper (required)
├── explanation.md     # write-up (required)
├── visualize.py       # terminal animation (optional, see §8)
└── visualize.html     # HTML animation (optional, see §9)
```

`<problem_id>` is a snake_case slug, e.g. `two_sum`, `valid_palindrome`,
`lru_cache`. It must equal `problem.json`'s `"id"` and the directory name.

---

## 1. `solution.py` — regular problems

Expose a **top-level function** named in `problem.json` as `"function"`.

```python
"""Problem title — Topic.

One-line description.

Time O(...) · Space O(...)
"""
from typing import List


def entry_function(args...) -> ReturnType:
    ...
```

**Hard rules**

- Inputs and outputs must be **JSON-serializable only**: `int`, `float`, `str`,
  `bool`, `None`, `list`, `dict`. Never accept/return custom node objects.
- The function name must be snake_case and match `"function"`.
- Keep the docstring short but include the complexity line.

### Linked lists and trees

Test cases use plain lists, so convert internally with the shared helpers in
`framework.structures` (already importable because the repo root is on
`sys.path`):

```python
from framework.structures import (
    build_linked_list, linked_list_to_list,
    build_tree, tree_to_list,
    build_cyclic_linked_list, ListNode, TreeNode,
)


def reverse_list(head: List[int]) -> List[int]:
    node = build_linked_list(head)
    prev = None
    while node:
        node.next, prev, node = prev, node, node.next
    return linked_list_to_list(prev)
```

- Linked list input/output: `List[int]` (head first).
- Binary tree input/output: LeetCode level-order `List[Optional[int]]`, i.e.
  `[1, 2, 3, None, 4]`.
- A problem that returns a tree node (e.g. Invert Binary Tree) returns
  `tree_to_list(root)`.
- A problem that takes a node by value (e.g. Lowest Common Ancestor, with node
  values `p` and `q`) takes the tree as a list plus the two values, and returns
  the value `int`.
- A cycle problem (Linked List Cycle) takes the list plus `pos` and uses
  `build_cyclic_linked_list(values, pos)`; return `bool`.
- Round-trip design (Serialize/Deserialize, Clone Graph): expose one wrapper
  function that returns the re-parsed structure, e.g.
  `def serialize_and_deserialize(root: list) -> list`.

---

## 2. `solution.py` — design problems

Used for problems defined by a class with a sequence of method calls
(Min Stack, LRU Cache, Implement Trie, Time Based KV Store, Twitter, Median
Finder, Detect Squares, Kth Largest in a Stream, …).

Expose the **class** only, with exactly the method names from LeetCode:

```python
class MinStack:
    def __init__(self) -> None:
        ...

    def push(self, val: int) -> None:
        ...

    def pop(self) -> None:
        ...

    def top(self) -> int:
        ...

    def get_min(self) -> int:
        ...
```

> Method names must match the problem statement exactly (usually camelCase on
> LeetCode, but use the names listed for that problem). The test `ops` strings
> are the method names.

---

## 3. `problem.json`

```json
{
  "id": "two_sum",
  "title": "Two Sum",
  "topic": "Arrays & Hashing",
  "difficulty": "Easy",
  "function": "two_sum",
  "compare": "unordered",
  "tags": ["array", "hash-table"],
  "leetcode": "https://leetcode.com/problems/two-sum/",
  "neetcode": "https://neetcode.io/problems/two-sum"
}
```

| key | required | notes |
| --- | --- | --- |
| `id` | yes | snake_case, equals dir name |
| `title` | yes | display title |
| `topic` | yes | human topic label |
| `difficulty` | yes | `Easy` / `Medium` / `Hard` |
| `function` | regular only | snake_case entry point |
| `type` | design only | `"design"` |
| `class` | design only | class name, e.g. `"MinStack"` |
| `compare` | yes | see below |
| `tolerance` | for `float` | default `1e-6` |
| `tags`, `leetcode`, `neetcode` | recommended | |

### `compare` strategies

| value | use when |
| --- | --- |
| `exact` | default; deep equality |
| `unordered` | top-level list order is free (Two Sum, Top K Frequent) |
| `unordered_inner` | order free at every level (Group Anagrams, 3Sum, Subsets, Permutations) |
| `float` | numeric answer within `tolerance` |
| `any_of` | multiple acceptable answers; `expected` is a list of them |
| `custom` | problem-specific validator; also set `"checker"` (see below) |

Built-in `custom` checkers (in `framework/checkers.py`):

| `checker` | validates |
| --- | --- |
| `topo_order` | any valid topological order (Course Schedule II) |
| `alien_order` | any valid Alien Dictionary ordering, `""` if impossible |
| `longest_palindrome` | any longest palindromic substring (ties allowed) |

When `compare` is `custom`, still put a representative value in `expected` so
failure messages are readable — it is ignored by the checker.

---

## 4. `test_cases.json` — regular

```json
{
  "cases": [
    {"args": [[2, 7, 11, 15], 9], "expected": [0, 1], "note": "classic example"},
    {"args": [[]], "expected": false, "note": "empty input"}
  ]
}
```

- `args` is the positional argument list: `fn(*args)`.
- `expected` is the exact expected return value (JSON form).
- `note` is a short human label (used as the pytest test id).

### `test_cases.json` — design

```json
{
  "cases": [
    {
      "args": {
        "ops":  ["MinStack", "push", "push", "push", "getMin", "pop", "top", "getMin"],
        "vals": [[], [-2], [0], [-3], [], [], [], []]
      },
      "expected": [null, null, null, null, -3, null, 0, -2],
      "note": "classic example"
    }
  ]
}
```

- `ops[0]` is the class name; `vals[0]` are the constructor args.
- Every later `ops[i]` is a method name called with `vals[i]`.
- `expected[0]` is `null` (constructor). Void methods are also `null`.

**Coverage:** include the official example(s) plus at least: empty/singleton
input, a boundary case, and one case that catches a classic wrong approach
(e.g. Two Sum with duplicates, Product Except Self with a zero). Aim for 5–9
cases per problem.

> Expected values must be **hand-derived from the problem**, not copied from the
> programme output. If a case fails, fix the *solution*, not the expectation —
> unless you can prove the expectation was wrong.

---

## 5. `test_<id>.py`

Copy verbatim, only adjusting the docstring:

```python
"""Pytest wrapper for <Title>."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from framework.compare import compare  # noqa: E402
from framework.loader import load_problem  # noqa: E402

PROBLEM = load_problem(Path(__file__).resolve().parent)


def _ids():
    return [
        case.get("note") or f"case{index}"
        for index, case in enumerate(PROBLEM.cases, start=1)
    ]


@pytest.mark.parametrize("case", PROBLEM.cases, ids=_ids())
def test_case(case):
    actual = PROBLEM.run_case(case)
    assert compare(actual, case["expected"], PROBLEM.meta, case), (
        f"args={case['args']!r} expected={case['expected']!r} got={actual!r}"
    )
```

---

## 6. `explanation.md`

Follow this structure (see `topics/01_arrays_and_hashing/two_sum/explanation.md`
for a model):

```markdown
# <Title>

**Topic:** <topic> · **Difficulty:** <difficulty>
**Links:** [LeetCode](...) · [NeetCode](...)

## Problem            <- restate it
## Examples           <- markdown table
## Intuition          <- the "aha"
## Approach           <- numbered steps
## Complexity         <- time/space table, and alternatives
## Edge cases         <- bullet list
## Solution           <- fenced python block
## How to run         <- the two run.py commands
```

---

## 7. Verify

From the repo root, run:

```bash
python3 run.py <problem_id>            # must end with "1/1 problem(s) fully passed"
python3 run.py <topic_slug>            # e.g. two_pointers — whole topic green
```

Fix the solution until **all** cases pass. Never delete a case to make it pass.

Also tick your topic's `README.md` checklist rows from `⬜` to `✅`.

---

## 8. `visualize.py` (optional) — terminal animation

A problem may ship a step-by-step animation played in place by the CLI:

```bash
python3 run.py two_sum --animate                      # first built-in case
python3 run.py two_sum --animate --case 5             # 5th built-in case
python3 run.py two_sum --animate -c '[[3, 2, 4], 6]'  # custom input
python3 run.py two_sum --animate --speed 0.4          # seconds per frame
```

The file sits next to `solution.py` and must expose:

```python
def frames(*args, palette=None):
    """Yield one complete frame (multi-line string) per animation step."""
```

- `*args` are the same arguments as the solution function (for a design
  problem, the single `{"ops": [...], "vals": [...]}` payload).
- `palette` is a `framework.runner.Palette`; wrap text in
  `p.bold(p.yellow(...))` etc. so `--no-color` and piped runs degrade to
  plain text.
- `framework.animate.play` repaints frames in place (ANSI cursor movement)
  and prints only the **final** frame when stdout is not a TTY or
  `--speed 0` is used — so the last frame must be meaningful on its own.
- Keep frames narrow (a few dozen columns) and inputs small; long lines wrap
  but the art gets ugly.

`topics/01_arrays_and_hashing/two_sum/visualize.py` is the reference
implementation: array boxes, a pointer row, the current `complement` lookup
and the growing `seen` hash map.

---

## 9. `visualize.html` (optional) — animated HTML page

A problem may also ship a **self-contained** HTML page (no CDN, no external
requests) that tells the same story with smooth, 3blue1brown-style motion:

```bash
python3 run.py two_sum --html                      # first built-in case
python3 run.py two_sum --html -c '[[3, 2, 4], 6]'  # custom input
```

`framework/htmlviz.py` serves the problem directory on a random localhost
port (Ctrl+C stops it) and opens the URL best-effort; arguments travel in the
query string as `?args=<url-encoded JSON list>`.

### Generating it (recommended)

Don't hand-write the timeline machinery per problem. Ship a small *scene* file
and let the shared engine build the page:

```
<problem>/
├── visualize.scene.js     # the problem-specific story (you write this)
└── visualize.html         # generated — self-contained, committed
```

```bash
python3 -m framework.viz.build topics/<topic>/<problem>   # one
python3 -m framework.viz.build --all                      # every scene
```

`framework/viz/` holds the shared `engine.js`, `engine.css`, `shell.html` and
`build.py` (see `framework/viz/README.md` for the full contract). A scene
defines a global `SCENE = { meta, read, fromArgs, buildScene, buildTimeline }`:

- `meta` — title, subtitle, editable `inputs`, and a legend.
- `read(values)` — raw input strings → params, or `null` when invalid.
- `fromArgs(args)` — optional; `?args=` JSON list → `{ inputId: rawString }`.
- `buildScene(params, ctx)` — draw the SVG nodes through `ctx` and define
  `scene.reset` (the baseline the timeline replays from).
- `buildTimeline(scene, tl, ctx)` — schedule `tl.add(dur, u => …, easeFn)`,
  ending with `return tl.finish();`.

The engine supplies all the chrome: `ctx.backdrop`, `ctx.layer(name)`,
`ctx.glow`, `ctx.makeWritable`, `ctx.el`/`txt`, `ctx.C`/`ease`/`clamp`, the
seekable `Timeline`, the play/pause/step/speed/scrub controls and `?args=`
boot. Costs nothing to keep the terminal `visualize.py` (§8) alongside a
scene; ship both when a problem is worth animating.

### Rules of the road

- **No external requests**: the generated `visualize.html` inlines every
  style/script/asset so it also works opened directly, in Live Preview, or in
  VS Code's `Simple Browser: Show`.
- Keep the rendering deterministic in time (pure `state = f(t)` steps) so
  scrubbing backwards is correct — drive everything from `scene.reset`.

`topics/01_arrays_and_hashing/contains_duplicate/` is the reference scene (a
hash-set sweep that lights a duplicate up red under an arc).
`topics/01_arrays_and_hashing/two_sum/visualize.html` is the original
hand-written page the shared engine was extracted from.
