"""Characterize emoji / symbol / unicode host linkify divergence."""
from diff import run

cases = []
# Various emoji and pictographic hosts
for sym in ["🎉", "😀", "👍", "❤", "★", "☺", "✓", "♥", "→", "€", "©",
            "™", "µ", "π", "Ω", "①", "𝕏", "🅰", "💩", "🔥", "⚡", "☎",
            "✉", "🌍", "café", "naïve", "Ω1", "x😀y", "a★b"]:
    cases.append(f"{sym}.com")
    cases.append(f"{sym}.com/path")
    cases.append(f"www.{sym}.com")
    cases.append(f"http://{sym}.com")
    cases.append(f"user@{sym}.com")
    cases.append(f"{sym}{sym}.org")

# emoji / symbols elsewhere in URL
for sym in ["🎉", "★", "😀", "€"]:
    cases.append(f"http://ex.com/{sym}")
    cases.append(f"http://ex.com/path?q={sym}")
    cases.append(f"http://ex.com/#{sym}")
    cases.append(f"http://ex.com/{sym}/more")
    cases.append(f"a@ex.com{sym}")

# ZWJ emoji sequences and flags as host
for sym in ["👨‍👩‍👧", "🇺🇸", "👍🏽", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"]:
    cases.append(f"{sym}.com")
    cases.append(f"http://{sym}.com")

if __name__ == "__main__":
    d = run(cases, "emoji-unicode-host", limit=200)
    print(f"EMOJI/UNICODE-HOST DIFFS: {len(d)}")
