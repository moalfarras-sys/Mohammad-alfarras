#!/usr/bin/env python3
"""Offline font assets; optional build tooling only: python -m pip install fonttools==4.68.0."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / 'apps/moplayer-pro-android/app/src/main/res/font'
for family in ('manrope', 'cairo'):
    for label, weight in (('medium', 500), ('semibold', 600), ('bold', 700)):
        font = TTFont(FONTS / f'{family}.ttf', recalcTimestamp=False)
        # Pin every axis; Cairo also includes slant, which must stay upright.
        axes = {axis.axisTag: weight if axis.axisTag == 'wght' else axis.defaultValue
                for axis in font['fvar'].axes}
        result = instantiateVariableFont(font, axes, inplace=True)
        result.save(FONTS / f'{family}_{label}.ttf')
