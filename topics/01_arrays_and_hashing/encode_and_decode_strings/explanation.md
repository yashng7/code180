# Encode and Decode Strings

**Topic:** Arrays & Hashing · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/encode-and-decode-strings/) · [NeetCode](https://neetcode.io/problems/string-encode-and-decode)

## Problem

Design two functions:

- `encode(strs) -> str` — serialize a list of strings into one string;
- `decode(data) -> List[str]` — reconstruct the original list.

The strings may contain **any** characters, so a naive delimiter (e.g. join on
`","`) is not safe.

> The test harness runs a full **round trip**: it calls
> `encode_and_decode(strs) == decode(encode(strs))` and checks the result equals
> the original list.

## Intuition

If a string can contain the delimiter, the decoder cannot tell data from
structure. The fix is to make the *structure* self-describing: store the
**length** of each string before its contents. Then the decoder always knows
exactly how many characters to read, regardless of what they are.

Format for one string: `<length>#<data>`.

```
["hello", "wor#ld"]  ->  "5#hello6#wor#ld"
```

## Approach

**encode**: for each string, emit `str(len(s)) + "#" + s`, concatenated.

**decode**: walk the encoded string with an index `i`:

1. find the next `#` — the digits before it are the length;
2. slice out exactly `length` characters (this is the payload);
3. advance `i` past the payload and repeat.

The `#` inside a payload never confuses the decoder, because we always read the
length prefix first.

## Complexity

| | Time | Space |
| --- | --- | --- |
| encode | `O(n)` total chars | `O(n)` |
| decode | `O(n)` total chars | `O(n)` |

(`n` = total number of characters across all strings.)

## Edge cases

- **Empty list** → `""` → decodes back to `[]`.
- **Empty strings** — `""` encodes as `"0#"`, so `[""]` and `["",""]`
  round-trip correctly (a naive `split` would lose them).
- **Delimiter in the payload** — `"#"`, `"##"`, `"a#b"` all work.
- **Digits in the payload** — `"123"` is safe because only the prefix digits are
  interpreted as a length.

## Solution

```python
def encode(strs: List[str]) -> str:
    return "".join(f"{len(s)}#{s}" for s in strs)

def decode(data: str) -> List[str]:
    result, i = [], 0
    while i < len(data):
        j = data.index("#", i)
        length = int(data[i:j])
        result.append(data[j + 1: j + 1 + length])
        i = j + 1 + length
    return result
```

## How to run

```bash
python3 run.py encode_and_decode_strings
python3 run.py encode_and_decode_strings -c '[["hello","wor#ld"]]'
```
