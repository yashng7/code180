"""Output comparison strategies used by both the CLI runner and pytest.

Problems declare their strategy in ``problem.json`` via the ``compare`` key:

    exact            -- deep equality (default)
    unordered        -- top level is a list whose order does not matter
                        (e.g. Two Sum indices)
    unordered_inner  -- order does not matter at every nesting level
                        (e.g. Group Anagrams)
    float            -- numeric comparison with a tolerance
    any_of           -- ``expected`` is a list of acceptable outputs

Extra keys: ``tolerance`` (for ``float``) and ``inner_compare`` (for ``any_of``).
"""
from __future__ import annotations

from typing import Any, Callable, Dict


def _canonical(value: Any) -> Any:
    """Recursively sort lists so that nesting order does not matter."""
    if isinstance(value, list):
        return sorted((_canonical(item) for item in value), key=repr)
    if isinstance(value, tuple):
        return tuple(_canonical(list(value)))
    return value


def _cmp_exact(actual: Any, expected: Any, **_: Any) -> bool:
    return actual == expected


def _cmp_unordered(actual: Any, expected: Any, **_: Any) -> bool:
    try:
        return sorted(actual, key=repr) == sorted(expected, key=repr)
    except TypeError:
        return actual == expected


def _cmp_unordered_inner(actual: Any, expected: Any, **_: Any) -> bool:
    return _canonical(actual) == _canonical(expected)


def _close(a: Any, b: Any, tolerance: float) -> bool:
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_close(x, y, tolerance) for x, y in zip(a, b))
    numeric = isinstance(a, (int, float)) and isinstance(b, (int, float))
    if numeric and not isinstance(a, bool) and not isinstance(b, bool):
        return abs(a - b) <= tolerance
    return a == b


def _cmp_float(actual: Any, expected: Any, tolerance: float = 1e-6, **_: Any) -> bool:
    return _close(actual, expected, tolerance)


def _cmp_any_of(actual: Any, expected: Any, **kwargs: Any) -> bool:
    inner = _STRATEGIES.get(kwargs.get("inner", "exact"), _cmp_exact)
    return any(inner(actual, candidate) for candidate in expected)


_STRATEGIES: Dict[str, Callable[..., bool]] = {
    "exact": _cmp_exact,
    "unordered": _cmp_unordered,
    "unordered_inner": _cmp_unordered_inner,
    "float": _cmp_float,
    "any_of": _cmp_any_of,
}


def compare(
    actual: Any,
    expected: Any,
    meta: Dict[str, Any] | None = None,
    case: Dict[str, Any] | None = None,
) -> bool:
    """Return True when ``actual`` is an acceptable answer for ``expected``."""
    meta = meta or {}
    strategy = meta.get("compare", "exact")

    if strategy == "custom":
        from . import checkers

        checker = checkers.CHECKERS.get(meta.get("checker", ""))
        if checker is None:
            raise ValueError(f"Unknown checker: {meta.get('checker')!r}")
        return checker(actual, expected, case or {}, meta)

    comparator = _STRATEGIES.get(strategy)
    if comparator is None:
        raise ValueError(f"Unknown compare strategy: {strategy!r}")
    return comparator(
        actual,
        expected,
        tolerance=meta.get("tolerance", 1e-6),
        inner=meta.get("inner_compare", "exact"),
    )
