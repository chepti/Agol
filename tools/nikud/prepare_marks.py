# -*- coding: utf-8 -*-
"""
מזריק גליפי ניקוד מ-Rubik לגופן העבודה של Ktiva/Agol.
יוצר tools/nikud/work/agol-work.ttf עם cmap נכון לניקוד ו-advance=0.
"""
from __future__ import annotations

from pathlib import Path
from copy import deepcopy

from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
AGOL_TTF = REPO / "app" / "public" / "fonts" / "agol.ttf"
# עדיף מקור Ktiva + המרה מחדש? משתמשים ב-agol הנוכחי (כבר יוניקוד)
RUBIK = REPO / "app" / "public" / "fonts" / "rubik-he.woff2"
WORK = ROOT / "work"
OUT = WORK / "agol-work.ttf"

# ניקוד שנעתיק מ-Rubik
NIKUD_CPS = [
    0x05B0, 0x05B1, 0x05B2, 0x05B3, 0x05B4, 0x05B5, 0x05B6, 0x05B7,
    0x05B8, 0x05B9, 0x05BA, 0x05BB, 0x05BC, 0x05C1, 0x05C2, 0x05C7,
]

# מחלקות עוגן בעורך: 0=מתחת, 1=דגש, 2=מעל
MARK_CLASS = {
    0x05B0: 0, 0x05B1: 0, 0x05B2: 0, 0x05B3: 0, 0x05B4: 0, 0x05B5: 0,
    0x05B6: 0, 0x05B7: 0, 0x05B8: 0, 0x05BB: 0, 0x05C7: 0,
    0x05BC: 1,
    0x05B9: 2, 0x05BA: 2, 0x05C1: 2, 0x05C2: 2,
}


def copy_glyph(src: TTFont, dst: TTFont, name: str, new_name: str | None = None) -> str:
    gname = new_name or name
    if gname not in dst.getGlyphOrder():
        dst.setGlyphOrder(dst.getGlyphOrder() + [gname])
    # glyf
    if "glyf" in src and name in src["glyf"]:
        # deep copy via pen to avoid shared state
        pen = TTGlyphPen(src["glyf"])
        src["glyf"][name].draw(pen, src["glyf"])
        dst["glyf"][gname] = pen.glyph()
    # hmtx
    adv, lsb = src["hmtx"].metrics[name]
    dst["hmtx"].metrics[gname] = (0, lsb)  # combining mark
    return gname


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    base = TTFont(str(AGOL_TTF))
    rubik = TTFont(str(RUBIK))
    rcmap = rubik.getBestCmap()
    bcmap = base.getBestCmap()

    # הסרת מיפויי ניקוד שגויים (לגליפים לטיניים) מה-cmap הקיים
    # נבנה cmap חדש: כל מה שקודם חוץ מטווח הניקוד, ואז נוסיף ניקוד מ-Rubik
    keep = {cp: name for cp, name in bcmap.items() if not (0x05B0 <= cp <= 0x05C7)}

    # עוגני marks מ-Rubik (GPOS MarkToBase) — נשארים תקפים כי מעתיקים את אותו מתאר
    rubik_mark_anchors: dict[str, tuple[int, int]] = {}
    try:
        gpos = rubik["GPOS"].table
        for lu in gpos.LookupList.Lookup:
            if lu.LookupType != 4:
                continue
            st = lu.SubTable[0]
            if hasattr(st, "ExtSubTable"):
                st = st.ExtSubTable
            for i, g in enumerate(st.MarkCoverage.glyphs):
                a = st.MarkArray.MarkRecord[i].MarkAnchor
                rubik_mark_anchors[g] = (int(a.XCoordinate), int(a.YCoordinate))
    except Exception as e:
        print("אזהרה: לא נקראו עוגני Rubik:", e)

    mark_meta = {}  # glyphName -> {cp, class, anchor}
    for cp in NIKUD_CPS:
        src_name = rcmap.get(cp)
        if not src_name:
            print("חסר ב-Rubik:", hex(cp))
            continue
        dst_name = f"uni{cp:04X}"
        copy_glyph(rubik, base, src_name, dst_name)
        keep[cp] = dst_name
        ax, ay = rubik_mark_anchors.get(src_name, (0, 0))
        mark_meta[dst_name] = {
            "cp": cp,
            "class": MARK_CLASS.get(cp, 0),
            "anchor": [ax, ay],
            "ch": chr(cp),
        }
        print("copied", hex(cp), src_name, "->", dst_name, "anchor", ax, ay)

    # כתיבת cmap format 4 (unicode)
    from fontTools.ttLib.tables._c_m_a_p import CmapSubtable

    tables = []
    for plat, enc in ((0, 3), (3, 1)):
        sub = CmapSubtable.newSubtable(4)
        sub.platformID = plat
        sub.platEncID = enc
        sub.language = 0
        sub.cmap = dict(keep)
        tables.append(sub)
    base["cmap"].tables = tables

    # fsType פתוח להטמעה
    try:
        base["OS/2"].fsType = 0
    except Exception:
        pass

    # הסרת GPOS ישן אם יש
    if "GPOS" in base:
        del base["GPOS"]

    base.save(str(OUT))
    print("נשמר:", OUT)

    # מטא־דאטה לעורך
    letters = {}
    defaults = {}
    glyf = base["glyf"]
    hmtx = base["hmtx"].metrics
    for cp in list(range(0x05D0, 0x05EB)) + [
        0x05DA, 0x05DD, 0x05DF, 0x05E3, 0x05E5,  # ך ם ן ף ץ — כבר בטווח? 05DA=ך כן
    ]:
        if cp not in keep:
            continue
        gname = keep[cp]
        letters[chr(cp)] = gname
        g = glyf[gname]
        adv, _ = hmtx[gname]
        # ברירת מחדל: מתחת למרכז, דגש במרכז הגוף, מעל למרכז העליון
        cx = (g.xMin + g.xMax) // 2 if hasattr(g, "xMin") else adv // 2
        defaults[chr(cp)] = {
            "0": [cx, int(g.yMin) - 20 if hasattr(g, "yMin") else -40],  # below
            "1": [cx, (g.yMin + g.yMax) // 2 if hasattr(g, "yMin") else 200],  # dagesh
            "2": [cx, int(g.yMax) + 30 if hasattr(g, "yMax") else 400],  # above
        }

    import json

    meta = {
        "marks": mark_meta,
        "letters": letters,
        "classes": {"0": "below", "1": "dagesh", "2": "above"},
        "classLabels": {"0": "מתחת (פתח, קמץ, חיריק…)", "1": "דגש", "2": "מעל (חולם, נקודת שין)"},
        "font": "work/agol-work.ttf",
        "unitsPerEm": base["head"].unitsPerEm,
        "defaultAnchors": defaults,
    }
    (ROOT / "font-meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("אותיות:", "".join(letters.keys()))
    print("ניקוד:", len(mark_meta))


if __name__ == "__main__":
    main()
