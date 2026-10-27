#!/usr/bin/env python3
"""Render original teaser audio with Python's standard library.

Run: python3 video/scripts/audio.py
Check rendered files: python3 video/scripts/audio.py --check
Fetch the pinned moo first: node video/scripts/fetch-moo.mjs
All times are seconds. Score duration and cue times come from timeline.json.
"""

import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import random
import struct
import subprocess
import wave

ROOT = Path(__file__).resolve().parents[1]
TIMELINE = json.loads((ROOT / "timeline.json").read_text())
RATE = 44100
DURATION = float(TIMELINE["duration"])
OUTRO_START = DURATION - 1.0
OUTPUT = ROOT / "public" / "audio"
TAU = math.tau
BPM = 150
BEAT = 60 / BPM
TABLE_SIZE = 4096
CUES = {name: TIMELINE["sounds"][name] for name in ("danger", "whistle", "pop", "moo")}
CUES["click"] = tuple(TIMELINE["sounds"]["clicks"])
DURATIONS = {"music": DURATION, "danger": 0.7, "whistle": 0.8,
             "pop": 0.22, "click": 0.085}
PEAKS = {"music": 0.30, "danger": 0.25, "whistle": 0.25,
         "pop": 0.28, "click": 0.16}
MOO_SHA256 = "fb1bc32dcba9ba7996d150bef795cbfdde15eb75aab914332ef2d36ab3bdb032"
DUCK_GAIN = 0.22


def moo_duration():
    path = OUTPUT / "cowswap-moo.mp3"
    if not path.exists():
        raise RuntimeError("Run node video/scripts/fetch-moo.mjs first")
    if hashlib.sha256(path.read_bytes()).hexdigest() != MOO_SHA256:
        raise RuntimeError("Pinned CoW Swap moo SHA-256 mismatch")
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True)
    duration = float(result.stdout.strip())
    if not math.isfinite(duration) or duration <= 0:
        raise RuntimeError("Invalid moo duration")
    return duration


def music_duck(time, duration):
    start = CUES["moo"]
    end = start + duration
    entering = smooth((time - start + 0.10) / 0.10)
    leaving = smooth((time - end) / 0.22)
    return 1 - (1 - DUCK_GAIN) * entering * (1 - leaving)


def smooth(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def envelope(time, duration, attack=0.012, release=0.08):
    return smooth(time / attack) * smooth((duration - time) / release)


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def make_table(kind):
    values = []
    for index in range(TABLE_SIZE):
        phase = TAU * index / TABLE_SIZE
        if kind == "pulse":
            # A short harmonic series keeps the pulse soft and band-limited.
            value = sum(math.sin(phase * h) * math.sin(math.pi * h * 0.38)
                        / h * math.exp(-0.28 * (h - 1)) for h in range(1, 9))
        elif kind == "triangle":
            value = sum((-1) ** ((h - 1) // 2) * math.sin(phase * h) / h ** 2
                        for h in range(1, 14, 2))
        else:
            value = math.sin(phase) + 0.12 * math.sin(2 * phase)
        values.append(value)
    peak = max(abs(value) for value in values)
    return [value / peak for value in values]


TABLES = {kind: make_table(kind) for kind in ("pulse", "triangle", "sine")}


def stereo(duration):
    return (array("d", [0.0]) * round(duration * RATE),
            array("d", [0.0]) * round(duration * RATE))


def add_note(track, start, duration, midi, level, kind="pulse", pan=0.0,
             attack=0.015, release=0.09, decay=1.0, echo=False):
    left, right = track
    table = TABLES[kind]
    step = frequency(midi) * TABLE_SIZE / RATE
    phase = 0.0
    left_gain = math.sqrt((1 - pan) / 2) * level
    right_gain = math.sqrt((1 + pan) / 2) * level
    first = round(start * RATE)
    length = min(round(duration * RATE), len(left) - first)
    delay = round(BEAT * 0.75 * RATE)
    for index in range(max(0, length)):
        time = index / RATE
        table_index = int(phase)
        fraction = phase - table_index
        sample = table[table_index] * (1 - fraction) + table[(table_index + 1) % TABLE_SIZE] * fraction
        sample *= envelope(time, duration, attack, release) * math.exp(-decay * time)
        target = first + index
        left[target] += sample * left_gain
        right[target] += sample * right_gain
        if echo and target + delay < len(left):
            left[target + delay] += sample * right_gain * 0.12
            right[target + delay] += sample * left_gain * 0.12
        phase = (phase + step) % TABLE_SIZE


def add_drum(track, start, kind, level, pan=0.0):
    durations = {"kick": 0.20, "clap": 0.12, "hat": 0.055, "open_hat": 0.14}
    duration = durations[kind]
    first = round(start * RATE)
    rng = random.Random(first + sum(map(ord, kind)))
    phase = 0.0
    low = 0.0
    for index in range(min(round(duration * RATE), len(track[0]) - first)):
        time = index / RATE
        noise = rng.uniform(-1, 1)
        low += 0.18 * (noise - low)
        high = noise - low
        if kind == "kick":
            phase += TAU * (49 + 115 * math.exp(-time * 45)) / RATE
            sample = math.sin(phase) * math.exp(-time * 22)
        elif kind == "clap":
            bursts = sum(math.exp(-max(0, time - offset) * 95)
                         for offset in (0, 0.012, 0.024) if time >= offset)
            sample = high * bursts * math.exp(-time * 16)
        else:
            sample = high * math.exp(-time * (65 if kind == "hat" else 25))
        sample *= level * envelope(time, duration, 0.001, 0.018)
        track[0][first + index] += sample * math.sqrt((1 - pan) / 2)
        track[1][first + index] += sample * math.sqrt((1 + pan) / 2)


def music():
    track = stereo(DURATION)
    duration = moo_duration()
    # Resolve the D-major hook on the tonic in the final second.
    chords = [([62, 66, 69, 73], 38), ([59, 62, 66, 69], 35),
              ([55, 59, 62, 66], 31), ([57, 61, 64, 71], 33),
              ([62, 66, 69, 73], 38), ([55, 59, 62, 69], 31),
              ([59, 62, 66, 69], 35), ([57, 61, 64, 69], 33),
              ([55, 59, 62, 66], 31), ([62, 66, 69, 73], 38),
              ([59, 62, 66, 69], 35), ([55, 59, 62, 69], 31),
              ([64, 67, 71, 74], 40), ([57, 61, 64, 67], 33)]
    hooks = [
        [(0, 78), (0.75, 81), (1.5, 78), (2, 76), (2.75, 74), (3.5, 76)],
        [(0, 78), (1, 74), (1.75, 73), (2.5, 74), (3.25, 78)],
        [(0, 79), (0.75, 78), (1.5, 74), (2.5, 71), (3.25, 74)],
        [(0, 76), (1, 73), (2, 71), (2.75, 73), (3.5, 76)],
    ]
    for bar, (chord, root) in enumerate(chords):
        start = bar * 4 * BEAT
        for voice, note in enumerate(chord):
            for beat in (0.5, 1.5, 2.5, 3.5):
                add_note(track, start + beat * BEAT, 0.15, note, 0.032,
                         "triangle", pan=(voice - 1.5) * 0.3, decay=5)
        for beat, interval in ((0, 0), (0.75, 0), (1.5, 7), (2.5, 0), (3.25, 12)):
            add_note(track, start + beat * BEAT, 0.20, root + interval,
                     0.13, "triangle", attack=0.006, release=0.045, decay=3)
        for beat, note in hooks[bar % 4]:
            if start + beat * BEAT >= OUTRO_START - 0.2:
                continue
            add_note(track, start + beat * BEAT, 0.20 if beat % 1 else 0.26,
                     note + (12 if bar in (8, 9) else 0), 0.085, pan=-0.12,
                     attack=0.006, release=0.06, decay=3.4, echo=True)
        for beat in (0, 1.5, 2, 3.5):
            add_drum(track, start + beat * BEAT, "kick", 0.24)
        for beat in (1, 3):
            add_drum(track, start + beat * BEAT, "clap", 0.12, -0.1)
        for step in range(8):
            add_drum(track, start + step * BEAT / 2,
                     "open_hat" if step == 7 else "hat",
                     0.046 if step % 2 else 0.028, 0.35)
    # Stop the groove before the one-second D-major ending.
    stop = round((OUTRO_START - 0.2) * RATE)
    for channel in track:
        for index in range(round((OUTRO_START - 0.35) * RATE), len(channel)):
            channel[index] *= smooth((stop - index) / (0.15 * RATE))
    for note, level, pan in ((38, 0.16, 0), (62, 0.07, -0.5), (66, 0.065, 0.4),
                             (69, 0.065, -0.2), (74, 0.085, 0.2)):
        add_note(track, OUTRO_START, 1.0, note, level, "triangle",
                 pan=pan, attack=0.008, release=0.23, decay=2.0)
    add_drum(track, OUTRO_START, "kick", 0.22)
    for index in range(len(track[0])):
        time = index / RATE
        gain = smooth(time / 0.015) * music_duck(time, duration)
        gain *= smooth((DURATION - time - 1 / RATE) / 0.12)
        track[0][index] *= gain
        track[1][index] *= gain
    return track


def danger():
    duration = DURATIONS["danger"]
    track = stereo(duration)
    phase = 0.0
    for index in range(len(track[0])):
        time = index / RATE
        pitch = 880 if int(time / 0.10) % 2 == 0 else 622.25
        phase += TAU * pitch / RATE
        gate = envelope(time % 0.10, 0.10, 0.004, 0.018)
        sample = (math.sin(phase) + 0.24 * math.sin(phase * 3)) * gate
        sample *= envelope(time, duration, 0.008, 0.06)
        track[0][index] = track[1][index] = sample
    return track


def whistle():
    track = stereo(DURATIONS["whistle"])
    phase = 0.0
    for index in range(len(track[0])):
        time = index / RATE
        progress = time / DURATIONS["whistle"]
        pitch = 1480 * (410 / 1480) ** smooth(progress)
        phase += TAU * pitch / RATE
        sample = (math.sin(phase) + 0.035 * math.sin(2 * phase))
        sample *= envelope(time, DURATIONS["whistle"], 0.05, 0.15)
        pan = 0.25 - 0.5 * progress
        track[0][index] = sample * math.sqrt((1 - pan) / 2)
        track[1][index] = sample * math.sqrt((1 + pan) / 2)
    return track


def pop():
    track = stereo(DURATIONS["pop"])
    rng = random.Random(2405)
    phase = 0.0
    filtered = 0.0
    for index in range(len(track[0])):
        time = index / RATE
        phase += TAU * (130 + 330 * math.exp(-time * 32)) / RATE
        filtered += 0.14 * (rng.uniform(-1, 1) - filtered)
        sample = (math.sin(phase) * math.exp(-time * 25)
                  + 0.34 * filtered * math.exp(-time * 38))
        sample *= envelope(time, DURATIONS["pop"], 0.004, 0.07)
        track[0][index] = track[1][index] = sample
    return track


def click():
    track = stereo(DURATIONS["click"])
    phase = 0.0
    for index in range(len(track[0])):
        time = index / RATE
        phase += TAU * (740 + 480 * math.exp(-time * 65)) / RATE
        sample = (math.sin(phase) + 0.15 * math.sin(phase * 2)) * math.exp(-time * 64)
        sample *= envelope(time, DURATIONS["click"], 0.003, 0.025)
        track[0][index] = track[1][index] = sample
    return track


def write_wav(name, track, peak):
    measured = max(max(abs(value) for value in channel) for channel in track)
    gain = peak / measured
    pcm = bytearray(len(track[0]) * 4)
    for index, (left, right) in enumerate(zip(*track)):
        struct.pack_into("<hh", pcm, index * 4, round(left * gain * 32767), round(right * gain * 32767))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm)


def check():
    for name, duration in DURATIONS.items():
        path = OUTPUT / f"{name}.wav"
        with wave.open(str(path), "rb") as source:
            assert source.getnchannels() == 2, path
            assert source.getsampwidth() == 2, path
            assert source.getframerate() == RATE, path
            assert source.getnframes() == round(duration * RATE), path
            pcm = source.readframes(source.getnframes())
        samples = array("h")
        samples.frombytes(pcm)
        if struct.pack("=h", 1) != struct.pack("<h", 1):
            samples.byteswap()
        peak = max(abs(value) for value in samples) / 32768
        assert 0.05 < peak <= PEAKS[name] + 0.0001, (path, peak)
        assert max(abs(value) for value in samples[:2] + samples[-2:]) <= 1, path
        assert abs(sum(samples) / len(samples)) < 50, (path, "DC offset")
        print(f"{path}: {duration:.3f}s, stereo {RATE}Hz, peak {20 * math.log10(peak):.2f}dBFS, "
              f"sha256 {hashlib.sha256(pcm).hexdigest()}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check existing WAV files without rendering")
    args = parser.parse_args()
    if not args.check:
        for name, render in (("music", music), ("danger", danger),
                             ("whistle", whistle), ("pop", pop), ("click", click)):
            write_wav(name, render(), PEAKS[name])
        (OUTPUT / "moo.wav").unlink(missing_ok=True)
    check()
    duration = moo_duration()
    print(f"Pinned moo: {duration:.6f}s; music duck: "
          f"{CUES['moo']:.3f}-{CUES['moo'] + duration:.6f}s, gain {DUCK_GAIN}")


if __name__ == "__main__":
    main()
