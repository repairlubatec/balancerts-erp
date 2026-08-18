#!/usr/bin/env python3
"""Validate a SAF-T AO XML file against the supplied official XSD.

This is a structural validation helper only. It does not submit data or certify
software with AGT.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from lxml import etree


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("xml", type=Path)
    parser.add_argument("xsd", type=Path)
    args = parser.parse_args()

    schema = etree.XMLSchema(etree.parse(str(args.xsd)))
    document = etree.parse(str(args.xml))
    if schema.validate(document):
        print("VALID")
        return 0
    print("INVALID")
    for error in schema.error_log:
        print(f"line={error.line} column={error.column} message={error.message}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
