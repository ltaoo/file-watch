#!/usr/bin/env python3
"""Package a prebuilt native executable, without starting the GUI."""

import argparse
import plistlib
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import zipfile
from pathlib import Path

SUPPORTED_TARGETS = (
    "aarch64-apple-darwin",
    "x86_64-apple-darwin",
    "x86_64-pc-windows-msvc",
    "x86_64-unknown-linux-gnu",
)
ROOT = Path(__file__).resolve().parent.parent


def package(args):
    if not re.fullmatch(r"\d+\.\d+\.\d+", args.version):
        raise ValueError("version must use major.minor.patch")
    if not re.fullmatch(rf"v{re.escape(args.version)}-build\.\d+", args.release_tag):
        raise ValueError("release-tag must use v<version>-build.<number>")
    is_macos = args.target.endswith("apple-darwin")
    is_windows = args.target.endswith("windows-msvc")
    executable = "file-watch.exe" if is_windows else "file-watch"
    binary = args.binary or ROOT / "target" / args.target / "release" / executable
    if not binary.is_file():
        raise FileNotFoundError(f"Missing native executable: {binary}")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    name = f"file-watch-{args.release_tag}-{args.target}"

    with tempfile.TemporaryDirectory(prefix="file-watch-package-") as temporary:
        staging = Path(temporary) / name
        staging.mkdir()
        shutil.copy2(ROOT / "README.md", staging / "README.md")
        if is_macos:
            app = staging / "FileWatch.app"
            contents = app / "Contents"
            resources = contents / "Resources"
            macos = contents / "MacOS"
            resources.mkdir(parents=True)
            macos.mkdir()
            destination = macos / "file-watch"
            shutil.copy2(binary, destination)
            destination.chmod(0o755)
            shutil.copy2(ROOT / "assets" / "icon.icns", resources / "icon.icns")
            with (contents / "Info.plist").open("wb") as output_file:
                plistlib.dump(
                    {
                        "CFBundleName": "FileWatch",
                        "CFBundleDisplayName": "FileWatch",
                        "CFBundleIdentifier": "com.file-watch.app",
                        "CFBundleExecutable": "file-watch",
                        "CFBundleIconFile": "icon.icns",
                        "CFBundlePackageType": "APPL",
                        "CFBundleShortVersionString": args.version,
                        "CFBundleVersion": args.release_tag.rsplit(".", 1)[1],
                        "LSMinimumSystemVersion": "11.0",
                        "NSHighResolutionCapable": True,
                    },
                    output_file,
                )
            if sys.platform != "darwin":
                raise RuntimeError("macOS apps must be packaged on macOS for code signing")
            subprocess.run(["codesign", "--force", "--sign", "-", str(app)], check=True)
            subprocess.run(["codesign", "--verify", "--strict", str(app)], check=True)
        else:
            destination = staging / executable
            shutil.copy2(binary, destination)
            if not is_windows:
                destination.chmod(0o755)

        if is_windows:
            archive_path = output / f"{name}.zip"
            with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
                for path in sorted(staging.rglob("*")):
                    if path.is_file():
                        archive.write(path, path.relative_to(staging.parent))
        else:
            archive_path = output / f"{name}.tar.gz"
            with tarfile.open(archive_path, "w:gz") as archive:
                archive.add(staging, arcname=name)
    print(archive_path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", choices=SUPPORTED_TARGETS, required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--release-tag", required=True)
    parser.add_argument("--binary", type=Path, help="Override the prebuilt executable path")
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    package(parser.parse_args())


if __name__ == "__main__":
    main()
