#!/usr/bin/env -S uv --quiet run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "click>=8.0",
#   "rich>=13.0",
# ]
# ///
"""
reduce.py  •  Reduce a ChatGPT `conversations.json` file.

USAGE EXAMPLES
--------------
# Keep 1/10th of the conversations, picking the most‑recent ones
./shrink_chatgpt_export.py conversations.json --fraction 0.1 --latest

# Keep exactly 250 conversations chosen at random
./shrink_chatgpt_export.py conversations.json --count 250 --random --output small.json
"""

from __future__ import annotations

import json
import math
import random
import sys
from pathlib import Path
from typing import Any, List, Optional

import click
from rich.console import Console

console = Console(stderr=True)


def load_json(path: Path) -> List[Any]:
    """Load the entire export file into memory."""
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]✖ Failed to read {path}: {exc}[/red]")
        raise click.exceptions.Exit(1)


def save_json(path: Path, data: List[Any]) -> None:
    """Write JSON with pretty indentation + trailing newline."""
    try:
        with path.open("w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
    except Exception as exc:  # noqa: BLE001
        console.print(f"[red]✖ Failed to write {path}: {exc}[/red]")
        raise click.exceptions.Exit(1)


def choose_latest(conversations: List[Any], n: int) -> List[Any]:
    """Return the n most‑recent conversations (by 'update_time' then 'create_time')."""
    def sort_key(conv: Any) -> float:
        upd = conv.get("update_time") or 0
        crt = conv.get("create_time") or 0
        return (upd, crt)

    return sorted(conversations, key=sort_key, reverse=True)[:n]


def choose_random(conversations: List[Any], n: int) -> List[Any]:
    """Return n random conversations (deterministic if --seed given)."""
    return random.sample(conversations, n)


@click.command(
    context_settings={"help_option_names": ["-h", "--help"]},
    help="Shrink a ChatGPT conversations JSON export.",
)
@click.argument(
    "input_path",
    type=click.Path(exists=True, dir_okay=False, readable=True, path_type=Path),
    metavar="INPUT_JSON",
)
@click.option(
    "-o",
    "--output",
    "output_path",
    type=click.Path(writable=True, path_type=Path),
    help="Output path (default: INPUT_JSON.small.json).",
)
@click.option(
    "--fraction",
    type=click.FloatRange(0, 1, min_open=True),
    help="Fraction of conversations to keep (e.g., 0.1 for 10%).",
)
@click.option(
    "--count",
    type=click.IntRange(min=1),
    help="Exact number of conversations to keep.",
)
@click.option(
    "--latest",
    "selection_mode",
    flag_value="latest",
    help="Keep the most recent conversations.",
)
@click.option(
    "--random",
    "selection_mode",
    flag_value="random",
    help="Choose conversations randomly.",
)
@click.option(
    "--seed",
    type=int,
    help="Random seed for reproducible --random runs.",
)
def main(  # noqa: PLR0913
    input_path: Path,
    output_path: Optional[Path],
    fraction: Optional[float],
    count: Optional[int],
    selection_mode: Optional[str],
    seed: Optional[int],
) -> None:
    """Shrink a ChatGPT conversations JSON export."""
    if not (fraction or count):
        console.print("[red]✖ Either --fraction or --count must be specified.[/red]")
        raise click.exceptions.Exit(1)
    if fraction and count:
        console.print("[red]✖ --fraction and --count are mutually exclusive.[/red]")
        raise click.exceptions.Exit(1)
    if not selection_mode:
        console.print("[red]✖ Either --latest or --random must be specified.[/red]")
        raise click.exceptions.Exit(1)

    if selection_mode == "random" and seed is not None:
        random.seed(seed)

    conversations = load_json(input_path)
    total = len(conversations)
    if total == 0:
        console.print("[red]✖ The input file is empty![/red]")
        raise click.exceptions.Exit(1)

    # Determine how many to keep
    if count is not None:
        n_keep = count
    elif fraction is not None: # fraction is not None ensured by earlier check
        n_keep = max(1, math.ceil(total * fraction))
    else:
        # This case should not be reached due to earlier checks
        console.print("[red]✖ Internal error: count/fraction logic failed.[/red]")
        raise click.exceptions.Exit(1)


    if n_keep > total:
        console.print(
            f"[red]✖ Requested {n_keep} items, but file only has {total}.[/red]"
        )
        raise click.exceptions.Exit(1)

    if selection_mode == "random":
        selected = choose_random(conversations, n_keep)
    else:  # selection_mode == "latest"
        selected = choose_latest(conversations, n_keep)

    resolved_output_path = (
        output_path
        if output_path
        else input_path.with_name(f"{input_path.stem}.small.json")
    )
    save_json(resolved_output_path, selected)

    console.print(
        f"[green]✔ Wrote {n_keep} conversations ({n_keep/total:.1%}) → {resolved_output_path}[/green]"
    )


if __name__ == "__main__":
    main()  # pylint: disable=no-value-for-parameter
