# Multiply Strings

**Topic:** Math & Geometry · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/multiply-strings/) · [NeetCode](https://neetcode.io/problems/multiply-strings)

## Problem

Given two non-negative integers `num1` and `num2` represented as strings, return
the product of `num1` and `num2` as a string.

You must **not** use any built-in big-integer library, and you must not convert
the inputs directly to integers. (The solution here does neither — it works
purely on digits.)

## Examples

| `num1` | `num2` | Output |
| --- | --- | --- |
| `"2"` | `"3"` | `"6"` |
| `"123"` | `"456"` | `"56088"` |
| `"0"` | `"0"` | `"0"` |

## Intuition

This is long multiplication done digit by digit. If `num1` is `m` digits and
`num2` is `n` digits, the product needs at most `m + n` digits. Multiplying the
single digits `num1[i] · num2[j]` contributes to position `i + j + 1` (its units
digit) and `i + j` (its carry) in that result buffer.

By walking `i` and `j` from right to left and folding each product into the
buffer, carries are absorbed naturally and no intermediate string parsing is
needed.

## Approach

1. If either input is `"0"`, return `"0"`.
2. Create `result = [0] * (len(num1) + len(num2))`.
3. For each `i` from the end of `num1`, for each `j` from the end of `num2`:
   - `total = (num1[i] - '0') * (num2[j] - '0') + result[i + j + 1]`;
   - `result[i + j + 1] = total % 10`;
   - `result[i + j] += total // 10`.
4. Strip leading zeros and join the digits.

Digits are obtained with `ord(ch) - ord('0')`, never `int()` on the whole
string.

## Walkthrough

`num1 = "123", num2 = "456"` — combine pairwise products into a 6-slot buffer:

| pair | contribution positions |
| --- | --- |
| 3·6 = 18 | `[i+j+1] = 8`, carry `1` to `[i+j]` |
| 3·5 = 15, 2·6 = 12 | folded into positions 3–4 |
| 3·4, 2·5, 1·6 | folded into positions 2–4 |
| 2·4, 1·5 | folded into positions 1–3 |
| 1·4 | folded into positions 0–1 |

Final buffer `[0,5,6,0,8,8]` → strip leading zero → `"56088"`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Grade-school (optimal) | `O(m·n)` | `O(m + n)` |
| Fast Fourier / Karatsuba | faster asymptotically | more complex |

- **Time `O(m·n)`** — one multiply-and-add per pair of digits.
- **Space `O(m + n)`** — the accumulator buffer.

## Edge cases

- **Either input `"0"`** — short-circuits to `"0"` (avoids `"00"`).
- **Single digits** — the buffer is size 2 and one product is written.
- **All nines** (`"99" · "99" = "9801"`) — carry chains across positions.
- **Very large inputs** — the digit buffer keeps everything exact, avoiding
  integer overflow in languages without big ints.

## Solution (`solution.py`)

```python
def multiply(num1: str, num2: str) -> str:
    if num1 == "0" or num2 == "0":
        return "0"
    m, n = len(num1), len(num2)
    result = [0] * (m + n)
    for i in range(m - 1, -1, -1):
        d1 = ord(num1[i]) - ord("0")
        for j in range(n - 1, -1, -1):
            d2 = ord(num2[j]) - ord("0")
            total = d1 * d2 + result[i + j + 1]
            result[i + j + 1] = total % 10
            result[i + j] += total // 10
    start = 0
    while start < len(result) - 1 and result[start] == 0:
        start += 1
    return "".join(str(d) for d in result[start:])
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py multiply_strings

# same tests through pytest
pytest topics/17_math_and_geometry/multiply_strings -v

# your own case, one-shot
python3 run.py multiply_strings -c '["123", "456"]'
```
