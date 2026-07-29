# -*- coding: utf-8 -*-
"""
בונה טבלת GPOS MarkToBase מ-anchors.json וכותב את הגופן הסופי ל-app/public/fonts.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables import otTables
from fontTools.otlLib.builder import MarkBasePosBuilder, buildAnchor

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
WORK_TTF = ROOT / "work" / "agol-work.ttf"
ANCHORS = ROOT / "anchors.json"
META = ROOT / "font-meta.json"
OUT_TTF = ROOT / "work" / "agol-nikud.ttf"
OUT_WOFF2 = ROOT / "work" / "agol-nikud.woff2"
PUBLIC_TTF = REPO / "app" / "public" / "fonts" / "agol.ttf"
PUBLIC_WOFF2 = REPO / "app" / "public" / "fonts" / "agol.woff2"


def build_gpos(font: TTFont, anchors: dict, meta: dict) -> None:
    builder = MarkBasePosBuilder(font, "nikud-editor")

    # marks: glyph -> (classId, Anchor)
    for gname, info in meta["marks"].items():
        cls = int(info["class"])
        ax, ay = info.get("anchor", [0, 0])
        builder.marks[gname] = (cls, buildAnchor(int(ax), int(ay)))

    # bases: glyph -> {classId: Anchor}
    letters = meta["letters"]  # char -> glyphName
    for ch, gname in letters.items():
        rec = anchors.get(ch) or meta.get("defaultAnchors", {}).get(ch)
        if not rec:
            continue
        base_map = {}
        for cls_s, xy in rec.items():
            cls = int(cls_s)
            base_map[cls] = buildAnchor(int(xy[0]), int(xy[1]))
        if base_map:
            builder.bases[gname] = base_map

    lookup = builder.build()
    if lookup is None:
        raise SystemExit("אין מספיק נתונים לבניית GPOS")

    # Script/LangSys/Feature
    gpos = newTable("GPOS")
    gpos.table = otTables.GPOS()
    gpos.table.Version = 0x00010000

    script_list = otTables.ScriptList()
    script_record = otTables.ScriptRecord()
    script_record.ScriptTag = "hebr"
    script = otTables.Script()
    default_a = otTables.DefaultLangSys()
    default_a.ReqFeatureIndex = 0xFFFF
    default_a.FeatureCount = 1
    default_a.FeatureIndex = [0]
    script.DefaultLangSys = default_a
    script.LangSysCount = 0
    script.LangSysRecord = []
    script_record.Script = script
    # also DFLT
    script_record2 = otTables.ScriptRecord()
    script_record2.ScriptTag = "DFLT"
    script2 = otTables.Script()
    default_b = otTables.DefaultLangSys()
    default_b.ReqFeatureIndex = 0xFFFF
    default_b.FeatureCount = 1
    default_b.FeatureIndex = [0]
    script2.DefaultLangSys = default_b
    script2.LangSysCount = 0
    script2.LangSysRecord = []
    script_record2.Script = script2
    script_list.ScriptCount = 2
    script_list.ScriptRecord = [script_record2, script_record]
    gpos.table.ScriptList = script_list

    feature_list = otTables.FeatureList()
    fr = otTables.FeatureRecord()
    fr.FeatureTag = "mark"
    feat = otTables.Feature()
    feat.FeatureParams = None
    feat.LookupCount = 1
    feat.LookupListIndex = [0]
    fr.Feature = feat
    feature_list.FeatureCount = 1
    feature_list.FeatureRecord = [fr]
    gpos.table.FeatureList = feature_list

    lookup_list = otTables.LookupList()
    lookup_list.Lookup = [lookup]
    lookup_list.LookupCount = 1
    gpos.table.LookupList = lookup_list

    font["GPOS"] = gpos


def main() -> None:
    if not WORK_TTF.exists():
        print("חסר work/agol-work.ttf — הרץ קודם: py prepare_marks.py")
        sys.exit(1)
    if not META.exists():
        print("חסר font-meta.json — הרץ prepare_marks.py")
        sys.exit(1)

    meta = json.loads(META.read_text(encoding="utf-8"))
    if ANCHORS.exists():
        anchors = json.loads(ANCHORS.read_text(encoding="utf-8"))
    else:
        print("אין anchors.json — משתמש בברירות מחדל מ-font-meta")
        anchors = meta.get("defaultAnchors", {})

    font = TTFont(str(WORK_TTF))
    build_gpos(font, anchors, meta)

    try:
        font["OS/2"].fsType = 0
    except Exception:
        pass

    OUT_TTF.parent.mkdir(parents=True, exist_ok=True)
    font.save(str(OUT_TTF))
    print("TTF:", OUT_TTF)

    try:
        from fontTools.ttLib.woff2 import compress

        compress(str(OUT_TTF), str(OUT_WOFF2))
    except Exception:
        f2 = TTFont(str(OUT_TTF))
        f2.flavor = "woff2"
        f2.save(str(OUT_WOFF2))
    print("WOFF2:", OUT_WOFF2)

    install = "--install" in sys.argv
    if install:
        import shutil

        shutil.copy2(OUT_TTF, PUBLIC_TTF)
        shutil.copy2(OUT_WOFF2, PUBLIC_WOFF2)
        print("הותקן ל־app/public/fonts/")
        print("עדכנו ?v= ב־styles.css / index.html ואז build+deploy.")
    else:
        print("לבדיקה מקומית הגופן ב־work/. להתקנה באפליקציה: py build_gpos.py --install")


if __name__ == "__main__":
    main()
