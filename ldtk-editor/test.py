#!/usr/bin/env python3
"""
Test script for ldtk_editor.py

Make sure you have ldtk_editor.py in the same directory or installed in PYTHONPATH.
Update PROJECT_PATH to point to your .ldtk file.
"""

from editor import LDTKEditor, MoveOptions
import json
import os

# Path to your test project
PROJECT_PATH = "example.ldtk"  # <-- change this to your sample .ldtk
OUTPUT_PATH  = "example_moved.ldtk"

def preview_entities(level, layer_name):
    """Print entity positions for quick inspection"""
    for li in level.get("layerInstances", []):
        if li["__identifier"] == layer_name:
            ents = li.get("entityInstances", [])
            return [(e["__identifier"], e["px"]) for e in ents]
    return []

def preview_intgrid(level, layer_name, w=10, h=10):
    """Print a small slice of IntGrid for inspection"""
    for li in level.get("layerInstances", []):
        if li["__identifier"] == layer_name:
            csv = li.get("intGridCsv", [])
            cW, cH = li["__cWid"], li["__cHei"]
            out = []
            for y in range(min(h, cH)):
                row = []
                for x in range(min(w, cW)):
                    row.append(csv[x + y*cW])
                out.append(row)
            return out
    return []

def main():
    ed = LDTKEditor(PROJECT_PATH)

    # Choose a level by name (adjust to match your project)
    opts = MoveOptions(level_name="Level_0", include={"intgrid", "entities"}, mode="cut")

    level_before = ed.data["levels"][0]  # first level
    print("Entities BEFORE:", preview_entities(level_before, "Entities"))
    print("IntGrid BEFORE:")
    print(json.dumps(preview_intgrid(level_before, "Ground", 8, 5), indent=2))

    # Move a 3x2 block of cells from (2,2) → (6,2)
    ed.move(2, 2, 6, 2, width=3, height=2, options=opts)

    # Move any entities sitting in 5x5 block from (0,0) → (10,0)
    ed.move(0, 0, 10, 0, width=5, height=5,
            options=MoveOptions(level_name="Level_0", include={"entities"}, mode="copy"))

    level_after = ed.data["levels"][0]
    print("\nEntities AFTER:", preview_entities(level_after, "Entities"))
    print("IntGrid AFTER:")
    print(json.dumps(preview_intgrid(level_after, "Ground", 8, 5), indent=2))

    # Save results to new file
    ed.save(OUTPUT_PATH)
    print(f"\nSaved modified project to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
