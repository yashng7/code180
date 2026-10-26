# Alien Dictionary

**Topic:** Advanced Graphs · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/alien-dictionary/) · [NeetCode](https://neetcode.io/problems/foreign-dictionary)

## Problem

You are given a list of words `words` that is sorted lexicographically according
to the rules of an alien language. Derive the order of the letters in that
alphabet. Return **any** valid ordering, or `""` if:

- the ordering contradicts itself (a **cycle**), or
- the list is impossible because a longer word appears **before** one of its
  prefixes.

## Examples

| `words` | Output |
| --- | --- |
| `["wrt","wrf","er","ett","rftt"]` | `"wertf"` |
| `["z","x"]` | `"zx"` |
| `["z","x","z"]` | `""` |
| `["abc","ab"]` | `""` |

## Intuition

In a sorted list, each **adjacent pair** reveals at most one letter rule. Walk the
two words together until they first differ at index `i`: the character in the
first word must come **before** the character in the second word. That is a
directed edge `first[i] -> second[i]` in the letter graph.

Once every adjacent pair has contributed its edge (deduplicated), any **valid
topological order** of the letters is a valid alien alphabet — that is why the
answer is not unique and the runner uses the `alien_order` checker to accept any
of them.

Kahn's algorithm also detects the impossible cases for free:

- **Cycle** — if fewer than `V` letters leave the queue, some letters were never
  freed by indegree reaching zero.
- **Prefix violation** — if two words share every common character and the first
  is *longer*, the shorter (its prefix) should have come first. This is detected
  while deriving edges (the inner loop never `break`s out on a difference).

## Approach

1. Collect every distinct letter into `letters`.
2. For each adjacent pair `(first, second)`:
   - scan both words in parallel; at the first differing character `(a, b)`, add
     a deduplicated edge `a -> b` and `break`;
   - if no differing character exists and `len(first) > len(second)`, return `""`
     (prefix violation).
3. Initialise `indegree[x]` for every letter and seed a queue with all
   indegree-`0` letters.
4. Process the queue, decrementing neighbours' indegrees; append letters to
   `order` as they are dequeued.
5. If `len(order) < len(letters)`, a cycle remains → `""`; otherwise join `order`.

## Walkthrough

`words = ["wrt","wrf","er","ett","rftt"]`

| pair | first difference | edge |
| --- | --- | --- |
| `wrt` / `wrf` | `t` vs `f` | `t -> f` |
| `wrf` / `er` | `w` vs `e` | `w -> e` |
| `er` / `ett` | `r` vs `t` | `r -> t` |
| `ett` / `rftt` | `e` vs `r` | `e -> r` |

Edges: `t->f`, `w->e`, `r->t`, `e->r`. Only `w` has indegree `0`, so the peel
order is `w, e, r, t, f` → `"wertf"`. Other valid orders (e.g. `"wertf"` is the
only one here) are accepted by the checker. ✅

## Complexity

| | Time | Space |
| --- | --- | --- |
| Edge derivation + Kahn (optimal) | `O(C + V + E)` | `O(V + E)` |
| Pairwise all-pairs comparison | `O(n² · L)` | `O(V + E)` |

- **Time `O(C + V + E)`** — `C` = total characters scanned once, `V` distinct
  letters, `E` derived ordering constraints (`E < V²`).
- **Space `O(V + E)`** — adjacency sets and indegree table.

## Edge cases

- **Cycle** (`["z","x","z"]`) — Kahn leaves letters unprocessed → `""`.
- **Prefix violation** (`["abc","ab"]`) — the longer word is placed first → `""`.
- **Single letter / single word** — no constraints, so any permutation of the
  letters is accepted; the checker only verifies the edge constraints.
- **Duplicate edges** — deduplicated with a `set` so indegrees stay correct.
- **Unconstrained letters** — they may appear anywhere; the checker does not
  require a specific spot.
- **All letters distinct, no relation** — returning the letters in any order is
  valid.

## Solution (`solution.py`)

```python
def alien_order(words: List[str]) -> str:
    letters = set("".join(words))
    graph = defaultdict(set)
    indegree = {ch: 0 for ch in letters}

    for first, second in zip(words, words[1:]):
        for a, b in zip(first, second):
            if a != b:
                if b not in graph[a]:
                    graph[a].add(b)
                    indegree[b] += 1
                break
        else:
            if len(first) > len(second):
                return ""

    if not letters:
        return ""

    queue = deque(sorted(ch for ch in letters if indegree[ch] == 0))
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in sorted(graph[node]):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(letters):
        return ""
    return "".join(order)
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py alien_dictionary

# same tests through pytest
pytest topics/12_advanced_graphs/alien_dictionary -v

# your own case, one-shot
python3 run.py alien_dictionary -c '[["wrt","wrf","er","ett","rftt"]]'
```

> Because `compare` is `custom` with checker `alien_order`, **any** valid
> ordering passes — `"wertf"` here is just one example.
