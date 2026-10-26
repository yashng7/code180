"""Locate, load and invoke practice problems."""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List

ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = ROOT / "topics"


def _camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(part.capitalize() for part in rest)


def _snake(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def _get_method(instance: Any, name: str) -> Callable[..., Any]:
    """Resolve a design method, accepting either camelCase or snake_case."""
    for candidate in (name, _snake(name), _camel(name)):
        if hasattr(instance, candidate):
            return getattr(instance, candidate)
    raise AttributeError(
        f"{type(instance).__name__} has no method '{name}' "
        f"(tried {name!r}, {_snake(name)!r}, {_camel(name)!r})"
    )


def _import_module(path: Path, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot import solution file: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def _resolve_function(module, name: str) -> Callable[..., Any]:
    """Find the entry point: a top-level function, or ``Solution.<camelCase>``."""
    if hasattr(module, name):
        return getattr(module, name)
    solution_cls = getattr(module, "Solution", None)
    if solution_cls is not None:
        instance = solution_cls()
        for candidate in (name, _camel(name)):
            if hasattr(instance, candidate):
                return getattr(instance, candidate)
    raise AttributeError(
        f"Could not find function '{name}' (or Solution.{_camel(name)}) in "
        f"{module.__file__}"
    )


@dataclass
class Problem:
    """A single practice problem loaded from disk."""

    directory: Path
    meta: Dict[str, Any]
    cases: List[Dict[str, Any]]
    _module: Any = field(default=None, repr=False, compare=False)
    _fn: Callable[..., Any] | None = field(default=None, repr=False, compare=False)
    _viz: Any = field(default=None, repr=False, compare=False)

    @property
    def id(self) -> str:
        return self.meta.get("id") or self.directory.name

    @property
    def title(self) -> str:
        return self.meta.get("title") or self.id.replace("_", " ").title()

    @property
    def topic(self) -> str:
        return self.meta.get("topic") or self.directory.parent.name

    @property
    def is_design(self) -> bool:
        return self.meta.get("type") == "design"

    def module(self):
        if self._module is None:
            self._module = _import_module(
                self.directory / "solution.py", f"solution_{self.id}"
            )
        return self._module

    def function(self) -> Callable[..., Any]:
        if self._fn is None:
            self._fn = _resolve_function(self.module(), self.meta.get("function", self.id))
        return self._fn

    def run(self, *args: Any) -> Any:
        return self.function()(*args)

    @property
    def has_visualizer(self) -> bool:
        """Whether the problem ships an optional ``visualize.py``."""
        return (self.directory / "visualize.py").exists()

    def visualizer(self):
        """The problem's optional ``visualize.py`` module, or ``None``."""
        if self._viz is None and self.has_visualizer:
            self._viz = _import_module(
                self.directory / "visualize.py", f"visualize_{self.id}"
            )
        return self._viz

    # -- case dispatch -----------------------------------------------------
    def run_case(self, case: Dict[str, Any]) -> Any:
        """Execute one test case (handles both function and design problems)."""
        if self.is_design:
            return self._run_design(case)
        return self.run(*case.get("args", []))

    def _run_design(self, case: Dict[str, Any]) -> List[Any]:
        spec = case.get("args", case)
        ops: List[str] = spec["ops"]
        vals: List[List[Any]] = spec["vals"]
        class_name = self.meta.get("class") or ops[0]
        cls = getattr(self.module(), class_name)

        outputs: List[Any] = []
        instance = None
        for index, op in enumerate(ops):
            if index == 0:                       # constructor
                instance = cls(*vals[0])
                outputs.append(None)
            else:
                outputs.append(_get_method(instance, op)(*vals[index]))
        return outputs


def load_problem(directory: Path | str) -> Problem:
    directory = Path(directory)
    meta = json.loads((directory / "problem.json").read_text(encoding="utf-8"))
    raw = json.loads((directory / "test_cases.json").read_text(encoding="utf-8"))
    cases = raw["cases"] if isinstance(raw, dict) else raw
    return Problem(directory=directory, meta=meta, cases=cases)


def discover(topics_dir: Path | str = TOPICS_DIR) -> List[Problem]:
    """Return every problem found under ``topics/<topic>/<problem>/``."""
    topics_dir = Path(topics_dir)
    problems: List[Problem] = []
    if not topics_dir.exists():
        return problems
    for problem_dir in sorted(topics_dir.glob("*/*")):
        if (problem_dir / "problem.json").exists():
            problems.append(load_problem(problem_dir))
    return problems
