# Add Two Numbers

**Topic:** Linked List · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/add-two-numbers/) · [NeetCode](https://neetcode.io/problems/add-two-numbers)

## Problem

Two non-negative integers are stored in linked lists with digits in **reverse
order** (the units digit is the head). Add the two numbers and return the sum in
the same reversed-digit form.

## Examples

| `l1` | `l2` | Output | Sum |
| --- | --- | --- | --- |
| `[2, 4, 3]` | `[5, 6, 4]` | `[7, 0, 8]` | `342 + 465 = 807` |
| `[0]` | `[0]` | `[0]` | `0` |
| `[9, 9, 9, 9, 9, 9, 9]` | `[9, 9, 9, 9]` | `[8, 9, 9, 9, 0, 0, 0, 1]` | carry chain |

## Intuition

Because the digits are already reversed, the heads are the least-significant
digits — exactly the order in which we add by hand. Walk both lists together,
sum the digits plus any carry, emit `sum % 10`, and carry `sum // 10`.

## Approach

1. Create a `dummy` node and `carry = 0`.
2. While either list has digits **or** a carry remains:
   - `total = carry + (a.val if a else 0) + (b.val if b else 0)`;
   - append `total % 10`, set `carry = total // 10`, advance the used lists.
3. Return from `dummy.next`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Single pass (used) | `O(max(n, m))` | `O(max(n, m))` output |
| — | | |

## Edge cases

- **Both zero** → single `[0]`.
- **Different lengths** — the shorter list contributes `0` past its end.
- **Final carry** (`[9]+[1]`) — the loop condition `carry` adds the extra digit.
- **All nines** — carries propagate through the entire list.

## Solution (`solution.py`)

```python
def add_two_numbers(l1: List[int], l2: List[int]) -> List[int]:
    a, b = build_linked_list(l1), build_linked_list(l2)
    dummy = tail = ListNode()
    carry = 0
    while a is not None or b is not None or carry:
        total = carry
        if a: total += a.val; a = a.next
        if b: total += b.val; b = b.next
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit); tail = tail.next
    return linked_list_to_list(dummy.next)
```

## How to run the tests

```bash
python3 run.py add_two_numbers
pytest topics/06_linked_list/add_two_numbers -v
```
