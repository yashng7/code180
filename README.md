# code180 — NeetCode practice environment

A structured, self-contained Python workspace for the full NeetCode roadmap:
**150 problems across 18 topics**, each with a solution, a written explanation,
built-in test cases, and an interactive custom-test mode.

Only the standard library is needed to run the tests (`pytest` is optional).

## Quickstart

```bash
cd code180

python3 run.py --list            # the whole catalog
python3 run.py two_sum           # one problem's built-in cases
python3 run.py arrays            # every problem in a topic
python3 run.py --all             # everything (150 problems)
python3 run.py -v two_sum        # show passing cases too

# custom test cases
python3 run.py two_sum -c                       # interactive
python3 run.py two_sum -c '[[2,7,11,15], 9]'    # one-shot

# terminal animation of the algorithm (VS Code terminal included)
python3 run.py two_sum --animate
python3 run.py two_sum --animate --speed 0.4           # faster frames
python3 run.py two_sum --animate -c '[[3,2,4], 6]'     # custom input
python3 run.py two_sum --animate --case 3              # 3rd built-in case

# 3blue1brown-style HTML animation (served locally; Ctrl+C to stop)
python3 run.py two_sum --html
```

Optional pytest route (same data):

```bash
pip install -r requirements.txt
pytest                                  # 1189 tests
pytest topics/07_trees -v
```

### Topic CLI slugs

`arrays`, `two_pointers`, `sliding_window`, `stack`, `binary_search`,
`linked_list`, `trees`, `tries`, `heap`, `backtracking`, `graphs`, `advanced`,
`1d_dynamic`, `2d_dynamic`, `greedy`, `intervals`, `math`, `bit`.

> `binary_search` is both a topic and a problem name. An exact topic slug wins,
> so `run.py binary_search` runs the whole topic. Target the single problem with
> `run.py 05_binary_search/binary_search` or `--list`.

## Repository layout

```
code180/
├── run.py                     # CLI entry point
├── framework/
│   ├── compare.py             # output comparison strategies
│   ├── checkers.py            # validators for multi-answer problems
│   ├── loader.py              # find + import problems (function & design)
│   ├── structures.py          # ListNode / TreeNode + (de)serializers
│   ├── runner.py              # run cases, print report
│   ├── custom.py              # interactive / ad-hoc cases
│   ├── animate.py             # terminal animation player (visualize.py)
│   ├── htmlviz.py             # HTML animation server (visualize.html)
│   └── viz/                   # shared animation engine + page builder
├── docs/CONVENTIONS.md        # how a problem is authored  ← read this to add one
├── conftest.py · pytest.ini · requirements.txt
└── topics/
    └── 01_arrays_and_hashing/
        ├── README.md              # topic checklist
        └── two_sum/
            ├── solution.py
            ├── explanation.md
            ├── problem.json       # metadata (entry point, compare strategy)
            ├── test_cases.json    # built-in cases
            ├── test_two_sum.py    # pytest wrapper
            ├── visualize.py       # terminal animation (optional)
            ├── visualize.scene.js # HTML animation source (optional)
            └── visualize.html     # HTML animation, generated (optional)
```

## How a problem is described

`problem.json` declares the entry point and how the output is checked.

| `compare` | when |
| --- | --- |
| `exact` | deep equality (default) |
| `unordered` | top-level list order free (Two Sum, Top K Frequent) |
| `unordered_inner` | order free at every level (Group Anagrams, 3Sum) |
| `float` | numeric, within `tolerance` |
| `any_of` | `expected` is a list of acceptable answers |
| `custom` | problem-specific `checker` (see below) |

Two entry-point styles are supported:

```python
def two_sum(nums, target): ...           # preferred: top-level snake_case fn

class Solution:                          # NeetCode style also works
    def twoSum(self, nums, target): ...
```

### Design problems

Problems defined by a class (Min Stack, LRU Cache, Trie, TimeMap, Twitter,
MedianFinder, DetectSquares, KthLargest) use `"type": "design"` and an
operation sequence:

```json
{
  "args": {
    "ops":  ["MinStack", "push", "push", "getMin", "pop", "top"],
    "vals": [[], [-2], [0], [], [], []]
  },
  "expected": [null, null, null, -2, null, 0]
}
```

### Multi-answer problems

A few problems accept several correct outputs, so they use
`"compare": "custom"` with a registered checker in `framework/checkers.py`:
`topo_order` (Course Schedule II), `alien_order` (Alien Dictionary),
`longest_palindrome` (Longest Palindromic Substring).

### Linked lists & trees

Test cases stay JSON-serializable: linked lists are `List[int]` and trees are
LeetCode level-order (`[1, 2, 3, None, 4]`). Solutions convert internally with
`framework/structures.py`.

### Animations (optional)

A problem can ship visualizations next to `solution.py`:

**Terminal** — a `visualize.py` exposing a `frames(*args, palette=...)`
generator; `--animate` replays it in place (VS Code integrated terminal
included):

```bash
python3 run.py two_sum --animate
python3 run.py two_sum --animate -c '[[3,2,4], 6]' --speed 0.4
```

Frames are repainted with ANSI cursor movement; when stdout is not a TTY
(pipes, CI) only the final frame is printed, so logs stay readable.

**HTML** — a 3blue1brown-style, self-contained `visualize.html` (dark stage,
eased motion, glowing highlights, write-on labels; play/pause, step, speed and
scrub controls, plus editable inputs). `--html` serves it locally and opens the
browser with the case arguments in the query string:

```bash
python3 run.py two_sum --html
```

Pages are **generated** from a small scene file so we never hand-write a
timeline per problem:

```
<problem>/visualize.scene.js   # you write the story
<problem>/visualize.html       # generated, self-contained (committed)
```

```bash
python3 -m framework.viz.build topics/01_arrays_and_hashing/contains_duplicate
python3 -m framework.viz.build --all
```

The shared engine lives in `framework/viz/` (see its README). `two_sum` keeps
its original hand-written page; `contains_duplicate` is the reference generated
scene. In VS Code, bring a page into an editor tab via Command Palette →
`Simple Browser: Show`.

Every **Arrays & Hashing** problem ships both a terminal animation and a
generated HTML page. Contracts: `docs/CONVENTIONS.md` §8 (terminal) and §9
(HTML).


## Roadmap (150/150 complete)

| # | Topic | Folder | Problems |
| --- | --- | --- | --- |
| 1 | Arrays & Hashing | `01_arrays_and_hashing` | 9 ✅ |
| 2 | Two Pointers | `02_two_pointers` | 5 ✅ |
| 3 | Sliding Window | `03_sliding_window` | 6 ✅ |
| 4 | Stack | `04_stack` | 7 ✅ |
| 5 | Binary Search | `05_binary_search` | 7 ✅ |
| 6 | Linked List | `06_linked_list` | 11 ✅ |
| 7 | Trees | `07_trees` | 15 ✅ |
| 8 | Tries | `08_tries` | 3 ✅ |
| 9 | Heap / Priority Queue | `09_heap_priority_queue` | 7 ✅ |
| 10 | Backtracking | `10_backtracking` | 9 ✅ |
| 11 | Graphs | `11_graphs` | 13 ✅ |
| 12 | Advanced Graphs | `12_advanced_graphs` | 6 ✅ |
| 13 | 1-D DP | `13_1d_dynamic_programming` | 12 ✅ |
| 14 | 2-D DP | `14_2d_dynamic_programming` | 11 ✅ |
| 15 | Greedy | `15_greedy` | 8 ✅ |
| 16 | Intervals | `16_intervals` | 6 ✅ |
| 17 | Math & Geometry | `17_math_and_geometry` | 8 ✅ |
| 18 | Bit Manipulation | `18_bit_manipulation` | 7 ✅ |

The core 150 is complete; any extra problems added later fold into the matching
topic. See `docs/CONVENTIONS.md` for how to add one, and each topic's
`README.md` for its checklist.
