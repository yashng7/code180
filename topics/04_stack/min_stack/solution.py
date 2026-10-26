"""Min Stack — Stack.

Design a stack supporting ``push``, ``pop``, ``top`` and ``getMin`` in O(1)
time for every operation.

Idea: keep a second "minimums" stack where ``_mins[i]`` is the smallest value
stored at or below index ``i`` of the main stack. Then ``getMin`` is just the
top of that second stack.

Time  O(1)  per operation.
Space O(n)  for the main stack and the parallel minimums stack.
"""


class MinStack:
    """A stack that also reports its minimum element in O(1)."""

    def __init__(self) -> None:
        self._stack: list[int] = []
        self._mins: list[int] = []          # _mins[i] == min(_stack[: i + 1])

    def push(self, val: int) -> None:
        self._stack.append(val)
        if self._mins:
            self._mins.append(min(val, self._mins[-1]))
        else:
            self._mins.append(val)

    def pop(self) -> None:
        self._stack.pop()
        self._mins.pop()

    def top(self) -> int:
        return self._stack[-1]

    def getMin(self) -> int:
        return self._mins[-1]


if __name__ == "__main__":
    stack = MinStack()
    stack.push(-2)
    stack.push(0)
    stack.push(-3)
    print(stack.getMin())   # -3
    stack.pop()
    print(stack.top())      # 0
    print(stack.getMin())   # -2
