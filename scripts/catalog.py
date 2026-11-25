"""Prepare, check, and maintain the pinned token catalog."""
import argparse
from pathlib import Path

from token_catalog import ROOT, assets, expansion, live, metadata, snapshot


def prepare_catalog(args):
    restore = args.command == "prepare"
    identities, report = metadata.load_metadata(ROOT, args.cache_dir, restore=restore)
    count = assets.prepare_assets(identities, args.public_dir, download_missing=restore)
    print(f"Verified {count} unique token images")
    print("Metadata:", report["summary"])
    if not restore or args.check:
        snapshot.sync_snapshot(identities, report, check=args.command != "generate", reports=getattr(args, "reports", None))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prepare = commands.add_parser("prepare", help="restore and verify pinned metadata and images")
    prepare.add_argument("--check", action="store_true", help="also compare the runtime snapshot without writing it")
    generate = commands.add_parser("generate", help="regenerate the runtime snapshot offline")
    generate.add_argument("--reports", type=Path, help="also write audit and metadata reports to this directory")
    check = commands.add_parser("check", help="verify pinned inputs and compare the runtime snapshot offline")
    for command in (prepare, generate, check):
        command.add_argument("--cache-dir", type=Path, help="use this cache for pinned metadata")
        command.add_argument("--public-dir", type=Path, default=ROOT / "public", help="use this directory for pinned images")
    scan = commands.add_parser("scan", help="capture and screen Chainlink directories")
    scan.add_argument("--chain", type=int, choices=[metadata.ROBINHOOD_CHAIN], help="capture Robinhood only instead of the nine default mainnets")
    stage = commands.add_parser("stage", help="verify exact routes and stage passing catalog changes")
    stage.add_argument("--evidence", type=Path, action="append", required=True)
    observe = commands.add_parser("observe", help="check live state of approved feeds")
    instruments = commands.add_parser("instruments", help="collect issuer evidence and stock feed hints")
    instruments.add_argument("--robinhood-registry", type=Path, help="read a captured issuer response for discovery only")
    for command in (scan, stage, observe, instruments):
        command.add_argument("--output", type=Path, required=True)
    for command in (stage, instruments):
        command.add_argument("--inventory", type=Path, required=True)
    args = parser.parse_args(argv)

    try:
        if args.command == "scan":
            expansion.scan(args.output, robinhood=args.chain is not None)
        elif args.command == "stage":
            expansion.stage(args.inventory, args.evidence, args.output)
        elif args.command == "observe":
            return 0 if live.observe_approved(args.output) else 1
        elif args.command == "instruments":
            expansion.discover_instruments(args.inventory, args.output, robinhood_registry=args.robinhood_registry)
        else:
            prepare_catalog(args)
    except (ValueError, OSError) as error:
        parser.exit(1, f"Catalog {args.command}: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
