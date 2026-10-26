"""Animated terminal visualization for Encode and Decode Strings.

The runner picks this file up automatically::

    python3 run.py encode_and_decode_strings --animate
    python3 run.py encode_and_decode_strings --animate -c '[["hello","wor#ld"]]'
    python3 run.py encode_and_decode_strings --animate --case 3 --speed 0.4

``frames(strs, palette=...)`` yields one complete frame per algorithm step.
The story has two acts: **encode** builds ``<len>#<data>`` left to right, and
**decode** walks a scanner along the result reading the length digits, the
``#``, then slicing out exactly ``<len>`` characters. The final frame shows the
round trip matching the input. ``framework.animate.play`` repaints the frames in
place.
"""
from __future__ import annotations

from typing import Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
LABEL_W = 9            # width of the row label column
ROWS = 18              # every frame has exactly this many rows


def frames(strs: List[str], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Encode/Decode round trip."""
    p = palette or Palette(enabled=True)
    words = list(strs)
    encoded = "".join(f"{len(word)}#{word}" for word in words)

    # -- empty input ----------------------------------------------------
    if not words:
        yield _render(
            p, words=[], input_roles=[], chars=[], char_roles=[], cursor=None,
            decoded=[], decoded_roles=[],
            action='input is []; encode writes nothing  →  ""',
            result='encoded = ""   ·   decoded = []',
        )
        yield _render(
            p, words=[], input_roles=[], chars=[], char_roles=[], cursor=None,
            decoded=[], decoded_roles=[],
            action='empty list round-trips: []  →  ""  →  []',
            result="decoded == input  ✓",
            result_role="green",
        )
        return

    # -- act 1: encode --------------------------------------------------
    input_roles = ["plain"] * len(words)
    yield _render(
        p, words=words, input_roles=list(input_roles), chars=[], char_roles=[],
        cursor=None, decoded=[], decoded_roles=[],
        action="start: emit <len>#<data> for every word",
        result='encoded = ""',
    )

    built = ""
    char_roles: List[str] = []
    for index, word in enumerate(words):
        input_roles = list(input_roles)
        input_roles[index] = "yellow"

        prefix = f"{len(word)}#"
        built += prefix
        char_roles = char_roles + ["blue"] * len(prefix)
        yield _render(
            p, words=words, input_roles=list(input_roles), chars=list(built),
            char_roles=list(char_roles), cursor=len(built) - len(prefix),
            decoded=[], decoded_roles=[],
            action=f'len("{word}") = {len(word)}  →  write "{prefix}"',
            result=f'encoded = "{built}"',
        )

        payload_start = len(built)
        built += word
        char_roles = char_roles + ["green"] * len(word)
        input_roles[index] = "green"
        yield _render(
            p, words=words, input_roles=list(input_roles), chars=list(built),
            char_roles=list(char_roles), cursor=payload_start,
            decoded=[], decoded_roles=[],
            action=f'append the payload "{word}"',
            result=f'encoded = "{built}"',
        )

    yield _render(
        p, words=words, input_roles=["green"] * len(words), chars=list(built),
        char_roles=["plain"] * len(built), cursor=len(built),
        decoded=[], decoded_roles=[],
        action="encode complete",
        result=f'encoded = "{built}"   ({len(built)} chars)',
    )

    # -- act 2: decode --------------------------------------------------
    croles = ["plain"] * len(encoded)
    decoded: List[str] = []
    decoded_roles: List[str] = []
    yield _render(
        p, words=words, input_roles=["green"] * len(words), chars=list(encoded),
        char_roles=list(croles), cursor=0, decoded=[], decoded_roles=[],
        action="decode: scan for '<digits>#', then slice <digits> chars",
        result=f'encoded = "{encoded}"',
    )

    position = 0
    for word in words:
        length = len(word)
        digits = str(length)
        hash_pos = position + len(digits)
        end = hash_pos + 1 + length

        # 1. read the length digits
        for k in range(position, hash_pos):
            croles[k] = "yellow"
        yield _render(
            p, words=words, input_roles=["green"] * len(words), chars=list(encoded),
            char_roles=list(croles), cursor=position, decoded=list(decoded),
            decoded_roles=list(decoded_roles),
            action=f'read length digits "{digits}"  →  length = {length}',
            result=f'encoded = "{encoded}"',
        )

        # 2. read the separator
        croles[hash_pos] = "blue"
        yield _render(
            p, words=words, input_roles=["green"] * len(words), chars=list(encoded),
            char_roles=list(croles), cursor=hash_pos, decoded=list(decoded),
            decoded_roles=list(decoded_roles),
            action="read separator '#'",
            result=f'encoded = "{encoded}"',
        )

        # 3. slice exactly `length` payload characters
        for k in range(hash_pos + 1, end):
            croles[k] = "green"
        yield _render(
            p, words=words, input_roles=["green"] * len(words), chars=list(encoded),
            char_roles=list(croles), cursor=hash_pos + 1, decoded=list(decoded),
            decoded_roles=list(decoded_roles),
            action=f'slice {length} char{"s" if length != 1 else ""}  →  "{word}"',
            result=f'encoded = "{encoded}"',
        )

        # 4. emit the recovered word, retire the consumed span
        decoded = decoded + [word]
        decoded_roles = decoded_roles + ["cyan"]
        for k in range(position, hash_pos + 1):
            croles[k] = "dim"
        for k in range(hash_pos + 1, end):
            croles[k] = "green"
        position = end
        yield _render(
            p, words=words, input_roles=["green"] * len(words), chars=list(encoded),
            char_roles=list(croles), cursor=position, decoded=list(decoded),
            decoded_roles=list(decoded_roles),
            action=f'emit "{word}"   ·   decoded {decoded}',
            result=f'encoded = "{encoded}"',
        )

    # -- finale ---------------------------------------------------------
    yield _render(
        p, words=words, input_roles=["green"] * len(words), chars=list(encoded),
        char_roles=["dim"] * len(encoded), cursor=len(encoded),
        decoded=list(decoded), decoded_roles=["green"] * len(decoded),
        action=f"round trip complete   ·   decoded = {decoded}",
        result="decoded == input  ✓",
        result_role="green",
    )


# -- frame rendering -------------------------------------------------------

def _render(p, *, words, input_roles, chars, char_roles, cursor,
            decoded, decoded_roles, action, result, result_role="plain") -> str:
    """Render one full frame; every frame has exactly ``ROWS`` rows."""
    in_top, in_mid, in_bot = _chip_boxes(words, input_roles, p)
    dec_top, dec_mid, dec_bot = _chip_boxes(decoded, decoded_roles, p)

    content = " ".join(chars)
    width = len(content)
    tinted = " ".join(_tint(ch, role, p) for ch, role in zip(chars, char_roles))
    enc_top = "┌" + "─" * width + "┐"
    enc_mid = "│" + tinted + "│"
    enc_bot = "└" + "─" * width + "┘"

    if cursor is not None and cursor >= 0 and chars:
        pointer = " " * (1 + 2 * min(cursor, len(chars))) + p.bold(p.cyan("▲"))
    else:
        pointer = ""

    lines = [
        f"{MARGIN}{p.bold('Encode & Decode Strings')}",
        "",
        _label("input", in_top),
        _label("", in_mid),
        _label("", in_bot),
        "",
        _label("encode", enc_top),
        _label("", enc_mid),
        _label("", enc_bot),
        _label("", pointer),
        "",
        _label("action", action),
        "",
        _label("decode", dec_top),
        _label("", dec_mid),
        _label("", dec_bot),
        "",
        _label("result", _tint(result, result_role, p)),
    ]
    while len(lines) < ROWS:
        lines.append("")
    return "\n".join(lines[:ROWS]) + "\n"


def _chip_boxes(items, roles, p):
    """Three aligned rows of ``┌ │ └`` boxes, one box per item."""
    if not items:
        return "", "", ""
    widths = [max(len(item), 1) + 2 for item in items]
    tops, mids, bots = [], [], []
    for item, width, role in zip(items, widths, roles):
        content = f" {item:<{width - 2}} "
        tops.append(_tint("┌" + "─" * width + "┐", role, p))
        mids.append(
            _tint("│", role, p) + _tint(content, role, p) + _tint("│", role, p)
        )
        bots.append(_tint("└" + "─" * width + "┘", role, p))
    return "  ".join(tops), "  ".join(mids), "  ".join(bots)


def _label(label: str, text: str) -> str:
    """Prefix a row with a fixed-width label so all art lines line up."""
    return (MARGIN + label + " " * (LABEL_W - len(label)) + text).rstrip()


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "yellow":
        return p.bold(p.yellow(text))
    if role in ("green", "blue"):          # blue has no palette slot -> cyan
        return p.bold(p.cyan(text) if role == "blue" else p.green(text))
    if role == "red":
        return p.bold(p.red(text))
    if role == "cyan":
        return p.bold(p.cyan(text))
    if role == "dim":
        return p.dim(text)
    return text
