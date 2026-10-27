#!/usr/bin/env python3
"""Prepare video assets from the product's checked-in artwork and fonts."""

from copy import deepcopy
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET

VIDEO = Path(__file__).resolve().parents[1]
ROOT = VIDEO.parent
DEST = VIDEO / "public" / "brand"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)


def tag(name):
    return f"{{{NS}}}{name}"


def svg_file(name, view_box, children):
    svg = ET.Element(tag("svg"), {
        "viewBox": view_box,
        "fill": "none",
        "shape-rendering": "crispEdges",
    })
    for child in children:
        svg.append(deepcopy(child))
    ET.ElementTree(svg).write(DEST / name, encoding="unicode")


def prepare():
    DEST.mkdir(parents=True, exist_ok=True)
    source = ROOT / "public" / "assets" / "air-rescue"
    for theme in ("light", "dark"):
        for kind in ("sky-mobile", "ground-mobile", "passenger", "face"):
            name = f"{kind}-{theme}.svg"
            svg = ET.parse(source / name)
            for style in svg.findall(f".//{tag('style')}"):
                svg.getroot().remove(style)
            if kind == "sky-mobile" and theme == "dark":
                group = svg.getroot().find(tag("g"))
                moon = group.find(f"{tag('g')}[@transform='translate(126 5)']")
                group.remove(moon)
                moon.attrib.pop("transform")
                svg_file("moon.svg", "0 0 25 25", [moon])
            svg.write(DEST / name, encoding="unicode")
        passenger = ET.parse(source / f"passenger-{theme}.svg").getroot()
        pieces = list(passenger.find(tag("g")))
        cow = deepcopy(pieces[-1])
        cow.attrib.pop("transform")
        svg_file(f"cow-{theme}.svg", "0 0 44 28", [cow])
        svg_file(f"parachute-{theme}.svg", "0 0 60 50", pieces[:-1])
        sky = ET.parse(source / f"sky-mobile-{theme}.svg").getroot()
        cloud = sky.find(f".//{tag('defs')}/{tag('g')}")
        svg_file(f"cloud-{theme}.svg", "0 0 76 26", [cloud])
    for name in ("ChakraPetch-Medium.ttf", "ChakraPetch-SemiBold.ttf", "ChakraPetch-LICENSE.txt"):
        shutil.copyfile(ROOT / "src" / "fonts" / name, DEST / name)
    print(f"Prepared product artwork and fonts in {DEST.relative_to(ROOT)}")


if __name__ == "__main__":
    prepare()
