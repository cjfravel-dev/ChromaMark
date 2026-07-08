"""Meter-width differential: brute-force many percent/fraction values."""
from diff import run

cases = []

# Integer percents, including out-of-range and boundaries
for n in range(0, 205):
    cases.append(f"[=info {n}%]")
cases += ["[=info 100%]", "[=info 0%]", "[=info 150%]", "[=info 1000%]"]

# One-decimal percents
for n in range(0, 1010):
    cases.append(f"[=info {n/10}%]")

# Three-decimal "half tie" percents: X.XX5% — classic toFixed vs HALF_UP gotcha
for i in range(5, 100000, 10):   # 0.005, 0.015, ... 99.995
    cases.append(f"[=info {i/1000}%]")

# Two-decimal exact percents (should always match)
for i in range(0, 10001, 7):
    cases.append(f"[=info {i/100}%]")

# Fractions a/b
for b in [2, 3, 6, 7, 8, 9, 11, 12, 13, 16, 32, 64, 160, 365]:
    for a in range(0, b + 3):
        cases.append(f"[=info {a}/{b}]")

# Decimal fractions
for s in ["2.5/10", "1/2.5", "1/3", "2/3", "0.1/0.3", "1.5/4.5",
          "7.5/9", "0.005/1", "5/6", "22/7", "355/113", "1/0", "0/5",
          "3/2", "10/10", "99/100", "1/8", "3/8", "5/8", "7/8", "1/16",
          "1/32", "1/160", "1/7", "6/7"]:
    cases.append(f"[=info {s}]")

# Non-numeric / signs / malformed (both should decline -> literal, must match)
for s in ["-5%", "abc", ".5%", "1.%", "1/-2", "-1/2", "%", "/", "1 / 2",
          "50 %", " 50% ", "1e2%", "0x10%", "NaN%", "Infinity%", "1,5%",
          "100.00%", "0.00%", "12.50%", "  3/7  ", "3 /7", "3/ 7"]:
    cases.append(f"[=info {s}]")

if __name__ == "__main__":
    d = run(cases, "meters", limit=60)
    print(f"METER DIFFS: {len(d)}")
