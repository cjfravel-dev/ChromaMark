"""Aggressive linkify battery: TLD lists, fuzzy matching, normalization."""
from diff import run

# Many TLDs — old gTLDs, ccTLDs, and NEW gTLDs added over time. Fuzzy bare-domain
# linking depends on the built-in TLD list, which differs across linkify-it versions.
TLDS = [
    "com", "org", "net", "edu", "gov", "mil", "int", "info", "biz", "name",
    "uk", "de", "jp", "fr", "cn", "ru", "br", "in", "au", "ca", "us", "eu",
    "io", "co", "me", "tv", "cc", "ly", "gl", "fm", "am", "to", "ws",
    "dev", "app", "xyz", "ai", "sh", "gg", "so", "id", "tech", "online",
    "store", "blog", "shop", "site", "website", "space", "live", "life",
    "zip", "mov", "new", "page", "foo", "bar", "gle", "prof", "cpa",
    "email", "cloud", "digital", "software", "codes", "wtf", "lol", "ninja",
    "pizza", "guru", "click", "link", "download", "review", "science",
    "crypto", "eth", "nft", "wallet", "bitcoin", "onion", "local", "test",
    "example", "invalid", "localhost", "internal", "corp", "home", "lan",
    "kaufen", "みんな", "セール", "닷컴", "москва", "рф", "中国", "công",
]

cases = []
for tld in TLDS:
    cases.append(f"visit foo.{tld} now")
    cases.append(f"visit foo.{tld}/path now")
    cases.append(f"email a@foo.{tld} now")
    cases.append(f"www.foo.{tld}")

# Fuzzy-link adjacency and punctuation
FUZZY = [
    "sub.domain.example.com", "a.b.c.d.e.f.g.com", "UPPER.COM", "Mixed.Org",
    "foo.com.", "foo.com,", "foo.com;", "foo.com!", "foo.com?", "foo.com:",
    "foo.com)", "(foo.com)", "[foo.com]", "{foo.com}", "<foo.com>",
    "foo.com/a/b/c", "foo.com:8080", "foo.com:8080/x", "foo.com?q=1",
    "foo.com#frag", "user@foo.com", "1.2.3.4", "1.2.3.4/x", "999.999.999.999",
    "192.168.0.1:80", "v1.2.3", "file.txt", "a.b", "x.y.z", "...", "a...b",
    "e.g.this", "i.e.that", "node.js", "index.html", "photo.jpg",
    "http://foo", "http://foo/bar", "http://foo.com../x", "http://.com",
    "http://-.com", "http://foo_bar.com", "http://foo..com",
    "mailto:", "mailto:a", "mailto:a@b", "http://", "https://", "//foo.com",
    "ftp://a", "ftp://a.b", "HTTP://FOO.COM/BAR", "hTTps://Foo.Com",
    "foo@bar", "foo@bar.baz", "@handle", "#hashtag", "$cashtag",
    "test.museum", "test.travel", "test.aero", "test.jobs", "test.cat",
    "a.b@c.d.e", "plus+tag@gmail.com", "under_score@ex.com", "dot.dot@ex.com",
    "quoted\"name\"@ex.com", "trailing.dot.@ex.com", ".leading@ex.com",
    "unicode.café.com", "münchen.de", "xn--mnchen-3ya.de", "пример.рф",
    "例え.jp", "test.co.uk", "a.pl", "国.cn", "🎉.com", "foo.c",
    "http://a.com/%20%41", "http://a.com/ space", "http://a.com/\u00e9",
    "http://a.com/?q=a b", "http://a.com/#a b", "http://[::1]/x",
    "http://[2001:db8::1]:8080/p", "http://user@host", "http://:pass@host",
    "www.", "www.a", "www.a.b", "wwww.a.com", "awww.a.com",
    "See http://a.com,http://b.com done", "a.com/b.com/c.com",
    "trailing paren http://a.com/foo) x", "wrap (see http://a.com/x) done",
    "smart “http://a.com” quote", "em—http://a.com—dash",
]
cases += FUZZY

# Emails with fuzzy variations
for local in ["a", "a.b", "a+b", "a_b", "a-b", "A.B.C", "user123", "1"]:
    for host in ["ex.com", "ex.co.uk", "sub.ex.io", "ex.dev", "localhost"]:
        cases.append(f"contact {local}@{host} today")

if __name__ == "__main__":
    d = run(cases, "linkify-aggressive", limit=300)
    print(f"LINKIFY-AGGRESSIVE DIFFS: {len(d)}")
