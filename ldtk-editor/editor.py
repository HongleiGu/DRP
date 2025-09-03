#!/usr/bin/env python3
"""
LDtk Editor — move IntGrid tiles and Entities within an LDtk project.

Supports:
- Moving a rectangular region of IntGrid cells (cut/copy/swap).
- Moving Entities whose positions lie on grid cells within that region.
- Optional moving of manual Tile layer tiles (gridTiles) as well.

Usage (CLI):
  python ldtk_editor.py path/to/project.ldtk --level "Level Name" \
      --orig 2,3 --tgt 10,8 --size 5,4 --mode cut --include intgrid,entities \
      --layer "Ground" --save

Programmatic:
  from ldtk_editor import LDTKEditor, MoveOptions
  ed = LDTKEditor("project.ldtk")
  ed.move(2,3,10,8, width=5, height=4,
          options=MoveOptions(level_name="Level 1", include={"intgrid","entities"},
                              layer_name="Ground", mode="cut"))
  ed.save()  # writes back to the same file (with .bak backup)

Notes:
- Coordinates are grid coordinates (not pixels).
- For Entities, only those whose (px/gridSize) land inside the source rectangle move.
- We skip AutoLayers' auto-generated tiles; optionally move manual Tiles via --include tiles.
- Creates a .bak alongside the project on first save.
Tested with LDtk 1.4+ JSON structure.
"""

from __future__ import annotations
import argparse
import copy
import json
import os
import shutil
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

# ---- Data structures

@dataclass
class MoveOptions:
    level_uid: Optional[int] = None
    level_name: Optional[str] = None
    layer_name: Optional[str] = None
    include: Set[str] = field(default_factory=lambda: {"intgrid", "entities"})
    mode: str = "cut"  # "cut", "copy", or "swap"
    clamp_to_bounds: bool = True

# ---- Core editor

class LDTKEditor:
    def __init__(self, path: str):
        self.path = path
        with open(path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        self._dirty = False

    # Public API as requested
    def move(self,
             originalX: int, originalY: int,
             targetX: int, targetY: int,
             width: int = 1, height: int = 1,
             options: Optional[MoveOptions] = None) -> None:
        """
        Move a rectangular region from (originalX,originalY) with size (width,height)
        so its top-left ends up at (targetX,targetY). Operates on specified level/layer(s).

        - Grid coords (cx,cy).
        - Modes:
            cut  : paste to target, clear source
            copy : paste to target, keep source
            swap : swap source and target regions (same size)
        """
        if options is None:
            options = MoveOptions()

        level = _find_level(self.data, options)
        if not level:
            raise ValueError("Level not found. Provide level_name or level_uid.")

        layer_instances = level.get("layerInstances") or []
        # Identify grid dimensions per-layer (can differ!)
        for li in layer_instances:
            _ensure_layer_cached(li)

        # Compute per-layer-safe move (respect per-layer grid size / cW,cH)
        for li in layer_instances:
            ltype = li.get("__type") or li.get("__type", "")
            is_entities = ltype.startswith("Entities")
            is_intgrid = ltype.startswith("IntGrid")
            is_tiles   = ltype.startswith("Tiles")

            if options.layer_name and li.get("__identifier") != options.layer_name:
                continue

            # Skip types not requested
            if is_intgrid and "intgrid" not in options.include:
                continue
            if is_entities and "entities" not in options.include:
                continue
            if is_tiles and "tiles" not in options.include:
                continue

            cW, cH = li["__cWid"], li["__cHei"]
            grid_size = li["__gridSize"]

            # Bounds clamp / validation
            src_rect = _rect(originalX, originalY, width, height)
            dst_rect = _rect(targetX, targetY, width, height)

            if options.mode == "swap":
                # swap requires dst fully in-bounds for same-layer dims
                if not _rect_in_bounds(src_rect, cW, cH) or not _rect_in_bounds(dst_rect, cW, cH):
                    if options.clamp_to_bounds:
                        src_rect = _clamp_rect(src_rect, cW, cH)
                        dst_rect = _clamp_rect(dst_rect, cW, cH)
                    else:
                        continue
            else:
                if not _rect_in_bounds(src_rect, cW, cH):
                    if options.clamp_to_bounds:
                        src_rect = _clamp_rect(src_rect, cW, cH)
                    else:
                        continue
                if not _rect_in_bounds(dst_rect, cW, cH):
                    if options.clamp_to_bounds:
                        dst_rect = _clamp_rect(dst_rect, cW, cH)
                    else:
                        continue

            if is_intgrid:
                self._move_intgrid(li, src_rect, dst_rect, options.mode)
            elif is_tiles:
                self._move_tiles(li, src_rect, dst_rect, options.mode, grid_size)
            elif is_entities:
                self._move_entities(li, src_rect, dst_rect, options.mode, grid_size)

        self._dirty = True

    def save(self, out_path: Optional[str] = None) -> None:
        path = out_path or self.path
        if out_path is None and not os.path.exists(self.path + ".bak"):
            shutil.copy2(self.path, self.path + ".bak")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    # ---- Layer-specific movers

    def _move_intgrid(self, li: dict, src: Tuple[int,int,int,int], dst: Tuple[int,int,int,int], mode: str):
        cW, cH = li["__cWid"], li["__cHei"]
        csv: List[int] = li.get("intGridCsv") or []
        if not csv:
            return
        sx, sy, w, h = src
        dx, dy, _, _ = dst

        def idx(cx, cy): return cx + cy * cW

        # Extract source and destination blocks
        block_src = [[csv[idx(sx+cx, sy+cy)] for cx in range(w)] for cy in range(h)]
        block_dst = [[csv[idx(dx+cx, dy+cy)] for cx in range(w)] for cy in range(h)]

        if mode == "swap":
            # write src<-dst, dst<-src
            for cy in range(h):
                for cx in range(w):
                    csv[idx(sx+cx, sy+cy)] = block_dst[cy][cx]
                    csv[idx(dx+cx, dy+cy)] = block_src[cy][cx]
        else:
            # overwrite dst with src
            for cy in range(h):
                for cx in range(w):
                    csv[idx(dx+cx, dy+cy)] = block_src[cy][cx]
            if mode == "cut":
                # clear src (set to 0)
                for cy in range(h):
                    for cx in range(w):
                        csv[idx(sx+cx, sy+cy)] = 0

    def _move_tiles(self, li: dict, src: Tuple[int,int,int,int], dst: Tuple[int,int,int,int], mode: str, grid: int):
        # Only move manual tiles (gridTiles). Auto-layer tiles are generated and should not be altered.
        tiles: List[dict] = li.get("gridTiles") or []
        if not tiles:
            return
        sx, sy, w, h = src
        dx, dy, _, _ = dst

        def in_src(tcx, tcy): return sx <= tcx < sx+w and sy <= tcy < sy+h

        # Partition tiles
        src_tiles = []
        other_tiles = []
        for t in tiles:
            # tile coords in grid; LDtk stores either "px":[x,y] and "src":[sx,sy] and "t":[cx,cy]? Use "px".
            px = t.get("px") or [0,0]
            tcx, tcy = px[0] // grid, px[1] // grid
            if in_src(tcx, tcy):
                src_tiles.append(t)
            else:
                other_tiles.append(t)

        # Build moved copies
        moved = []
        for t in src_tiles:
            newt = copy.deepcopy(t)
            px = newt.get("px") or [0,0]
            tcx, tcy = px[0] // grid, px[1] // grid
            offset_cx = tcx - sx
            offset_cy = tcy - sy
            new_px = [(dx + offset_cx) * grid, (dy + offset_cy) * grid]
            newt["px"] = new_px
            moved.append(newt)

        if mode == "swap":
            # Destination tiles in the same footprint should swap places with src tiles.
            dst_tiles, non_swap_dst = [], []
            def in_dst(tcx, tcy): return dx <= tcx < dx+w and dy <= tcy < dy+h
            for t in other_tiles:
                px = t.get("px") or [0,0]
                tcx, tcy = px[0] // grid, px[1] // grid
                if in_dst(tcx, tcy):
                    dst_tiles.append(t)
                else:
                    non_swap_dst.append(t)
            # produce tiles swapped: src->dst (moved) and dst->src (mirrored back)
            back = []
            for t in dst_tiles:
                newt = copy.deepcopy(t)
                px = newt.get("px") or [0,0]
                tcx, tcy = px[0] // grid, px[1] // grid
                offset_cx = tcx - dx
                offset_cy = tcy - dy
                new_px = [(sx + offset_cx) * grid, (sy + offset_cy) * grid]
                newt["px"] = new_px
                back.append(newt)

            li["gridTiles"] = non_swap_dst + back + moved
        else:
            # overwrite behavior: remove any tiles that would occupy dest footprint, then add moved
            def in_dst(tcx, tcy): return dx <= tcx < dx+w and dy <= tcy < dy+h
            kept = []
            for t in other_tiles:
                px = t.get("px") or [0,0]
                tcx, tcy = px[0] // grid, px[1] // grid
                if not in_dst(tcx, tcy):
                    kept.append(t)
            if mode == "copy":
                li["gridTiles"] = kept + moved + src_tiles  # keep originals too
            else:  # cut
                li["gridTiles"] = kept + moved  # drop originals

    def _move_entities(self, li: dict, src: Tuple[int,int,int,int], dst: Tuple[int,int,int,int], mode: str, grid: int):
        ents: List[dict] = li.get("entityInstances") or []
        if not ents:
            return
        sx, sy, w, h = src
        dx, dy, _, _ = dst

        def in_src(cgx, cgy): return sx <= cgx < sx+w and sy <= cgy < sy+h
        def in_dst(cgx, cgy): return dx <= cgx < dx+w and dy <= cgy < dy+h

        src_sel = []
        rest = []
        for e in ents:
            px = e.get("px") or [e.get("x", 0), e.get("y", 0)]
            cgx, cgy = px[0] // grid, px[1] // grid
            if in_src(cgx, cgy):
                src_sel.append(e)
            else:
                rest.append(e)

        moved = []
        for e in src_sel:
            ne = copy.deepcopy(e)
            px = ne.get("px") or [ne.get("x", 0), ne.get("y", 0)]
            cgx, cgy = px[0] // grid, px[1] // grid
            offx, offy = cgx - sx, cgy - sy
            new_px = [(dx + offx) * grid, (dy + offy) * grid]
            ne["px"] = new_px
            # Some exporters also mirror integer x/y fields; keep px authoritative.
            if "x" in ne: ne["x"] = new_px[0]
            if "y" in ne: ne["y"] = new_px[1]
            moved.append(ne)

        if mode == "swap":
            # Entities in destination region move back to source footprint
            back = []
            kept = []
            for e in rest:
                px = e.get("px") or [e.get("x", 0), e.get("y", 0)]
                cgx, cgy = px[0] // grid, px[1] // grid
                if in_dst(cgx, cgy):
                    ne = copy.deepcopy(e)
                    offx, offy = cgx - dx, cgy - dy
                    new_px = [(sx + offx) * grid, (sy + offy) * grid]
                    ne["px"] = new_px
                    if "x" in ne: ne["x"] = new_px[0]
                    if "y" in ne: ne["y"] = new_px[1]
                    back.append(ne)
                else:
                    kept.append(e)
            li["entityInstances"] = kept + back + moved
        elif mode == "copy":
            li["entityInstances"] = rest + src_sel + moved
        else:  # cut
            li["entityInstances"] = rest + moved

# ---- Helpers

def _ensure_layer_cached(li: dict):
    # No-op placeholder; hook for future caching or validation.
    required = ["__cWid", "__cHei", "__gridSize", "__identifier"]
    for k in required:
        if k not in li:
            raise ValueError(f"LayerInstance missing {k}: {li.get('__identifier')}")

def _find_level(data: dict, opts: MoveOptions) -> Optional[dict]:
    levels = data.get("levels") or []
    if opts.level_uid is not None:
        for L in levels:
            if L.get("uid") == opts.level_uid:
                return L
    if opts.level_name:
        for L in levels:
            if (L.get("identifier") or L.get("iid")) == opts.level_name or L.get("identifier") == opts.level_name:
                return L
            if L.get("identifier") == opts.level_name:
                return L
    # fallback: single-level projects
    if len(levels) == 1:
        return levels[0]
    return None

def _rect(x: int, y: int, w: int, h: int) -> Tuple[int,int,int,int]:
    return (max(0,x), max(0,y), max(1,w), max(1,h))

def _rect_in_bounds(r: Tuple[int,int,int,int], cW: int, cH: int) -> bool:
    x,y,w,h = r
    return x >= 0 and y >= 0 and x+w <= cW and y+h <= cH

def _clamp_rect(r: Tuple[int,int,int,int], cW: int, cH: int) -> Tuple[int,int,int,int]:
    x,y,w,h = r
    x = max(0, min(x, cW-1))
    y = max(0, min(y, cH-1))
    w = max(1, min(w, cW - x))
    h = max(1, min(h, cH - y))
    return (x,y,w,h)

# ---- CLI

def _parse_pair(s: str, name: str) -> Tuple[int,int]:
    try:
        a,b = s.split(",")
        return int(a.strip()), int(b.strip())
    except Exception:
        raise argparse.ArgumentTypeError(f"{name} must be like A,B")

def main():
    ap = argparse.ArgumentParser(description="Move IntGrid/Entities/Tiles inside an LDtk project.")
    ap.add_argument("project", help=".ldtk file path")
    ap.add_argument("--level", dest="level_name", help="Level identifier (name)")
    ap.add_argument("--level-uid", dest="level_uid", type=int, help="Level UID")
    ap.add_argument("--layer", dest="layer_name", help="Limit to a specific layer identifier")
    ap.add_argument("--orig", type=lambda s: _parse_pair(s, "orig"), required=True, help="source top-left cx,cy")
    ap.add_argument("--tgt",  type=lambda s: _parse_pair(s, "tgt"), required=True, help="target top-left cx,cy")
    ap.add_argument("--size", type=lambda s: _parse_pair(s, "size"), default=(1,1), help="width,height in cells")
    ap.add_argument("--mode", choices=["cut","copy","swap"], default="cut", help="move mode")
    ap.add_argument("--include", default="intgrid,entities",
                    help="comma list among: intgrid,entities,tiles")
    ap.add_argument("--no-clamp", action="store_true", help="disallow clamping; skip if out-of-bounds")
    ap.add_argument("--save", action="store_true", help="write changes to the file")
    ap.add_argument("--out", help="write to a new file instead of in-place")
    args = ap.parse_args()

    include = set(x.strip() for x in args.include.split(",") if x.strip())
    opts = MoveOptions(
        level_uid=args.level_uid,
        level_name=args.level_name,
        layer_name=args.layer_name,
        include=include,
        mode=args.mode,
        clamp_to_bounds=not args.no_clamp
    )

    editor = LDTKEditor(args.project)
    editor.move(args.orig[0], args.orig[1], args.tgt[0], args.tgt[1],
                width=args.size[0], height=args.size[1], options=opts)
    if args.save or args.out:
        editor.save(args.out)
    else:
        # Dry-run preview to stdout
        print(json.dumps(editor.data, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
