# Clone Graph

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/clone-graph/) · [NeetCode](https://neetcode.io/problems/clone-graph)

## Problem

Given a reference to a node in a **connected undirected graph**, return a
**deep copy** (clone) of the graph. Every node holds an integer value and a list
of its neighbours.

Because this repo only passes JSON, the problem is posed as an **adjacency-list
round trip**: `clone_graph(adj_list)` builds the graph, deep-copies it, and
returns the *copy's* adjacency list. `adj_list[i]` holds the 1-based labels of
node `i + 1`'s neighbours. The empty graph is `[]`, and a lone node is `[[]]`.

## Examples

| `adj_list` | Output | Why |
| --- | --- | --- |
| `[[2,4],[1,3],[2,4],[1,3]]` | identical | a 4-cycle clones to itself |
| `[[]]` | `[[]]` | one isolated node |
| `[]` | `[]` | no nodes at all |

## Intuition

A naive copy fails on cycles: node 1 points to node 2 which points back to
node 1, and chasing that recursion forever loops. The fix is a **hash map from
original node → its clone**. The first time we meet a node we create its clone,
record the mapping, and *then* recurse into neighbours; on any later visit the
map hands back the already-created clone, which also wires up the back edge.

This is exactly a DFS/BFS with a `visited` map, except the "visit" is "create
the copy".

## Approach

1. Materialize the adjacency list into real `_Node` objects.
2. Run a DFS from each node (looping over all nodes also handles disconnected
   input even though LeetCode guarantees connectivity):
   - if the node already has a clone, return it;
   - otherwise create a clone, store `copies[node] = clone`, and append the DFS
     of each neighbour to `clone.neighbors`.
3. Serialize each clone's neighbours back to their 1-based labels.

## Complexity

| | Time | Space |
| --- | --- | --- |
| DFS with hash map | `O(V + E)` | `O(V + E)` |

- **Time `O(V + E)`** — every node is cloned once and every edge traversed once.
- **Space `O(V + E)`** — the clone map holds `V` entries and the adjacency copy
  holds `E` directed entries (`2E` for an undirected graph).

## Edge cases

- **Empty graph** (`[]`) → `[]`.
- **Single node** (`[[]]`) → one clone with no neighbours.
- **Self-loop** (`[[1]]`) → the map stops the recursion from looping.
- **Cycles** → handled precisely because we memoise before recursing.
- **Neighbour order** → preserved, so the round trip compares `exact`.

## Solution (`solution.py`)

```python
class _Node:
    def __init__(self, val):
        self.val = val
        self.neighbors = []


def clone_graph(adj_list):
    if not adj_list:
        return []

    nodes = [_Node(i + 1) for i in range(len(adj_list))]
    for i, neighbors in enumerate(adj_list):
        nodes[i].neighbors = [nodes[label - 1] for label in neighbors]

    copies = {}

    def dfs(node):
        if node in copies:
            return copies[node]
        duplicate = _Node(node.val)
        copies[node] = duplicate
        for neighbor in node.neighbors:
            duplicate.neighbors.append(dfs(neighbor))
        return duplicate

    for node in nodes:
        dfs(node)

    return [[n.val for n in copies[node].neighbors] for node in nodes]
```

## How to run the tests

```bash
python3 run.py clone_graph
pytest topics/11_graphs/clone_graph -v
```
