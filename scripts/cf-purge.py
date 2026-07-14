#!/usr/bin/env python3
"""
scripts/cf-purge.py — Cloudflare "Purge Everything" for the samedayappliance.repair zone.

Used after an image-bearing deploy so the custom domain stops serving stale/text-html
fallbacks for new or overwritten image paths (see docs/methodology.md §5.1). No manual
dashboard button.

USAGE
    python scripts/cf-purge.py            # purge everything, resolve zone id automatically
    python scripts/cf-purge.py --dry-run  # show what it would do, no API call

SETUP (one-time, Roman)
    1. Cloudflare dashboard -> My Profile -> API Tokens -> Create Token
    2. Use the "Purge cache" template  (grants Zone.Cache Purge)
    3. Scope it to Zone Resources = Include -> Specific zone -> samedayappliance.repair
    4. Create, copy the token, and save it (no trailing newline) to:
           secrets/cf-purge-token.txt          (secrets/ is git-ignored)
    Optional: if the token has NO Zone.Read (the Purge template usually doesn't),
    also drop the zone id into  secrets/cf-zone-id.txt  — find it on the zone's
    Overview page ("Zone ID", bottom-right). The script caches a resolved id there.

EXIT CODES
    0  purge succeeded
    1  failure (missing token, zone unresolved, API error) — message on stderr
"""
import json
import os
import sys
import urllib.request
import urllib.error

API = "https://api.cloudflare.com/client/v4"
ZONE_NAME = "samedayappliance.repair"
TOKEN_FILE = "secrets/cf-purge-token.txt"
ZONE_ID_FILE = "secrets/cf-zone-id.txt"
DRY = "--dry-run" in sys.argv


def die(msg, code=1):
    sys.stderr.write("cf-purge: " + msg + "\n")
    sys.exit(code)


def read_trim(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def api(method, path, token, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode())
        except Exception:
            die("HTTP %s calling %s %s" % (e.code, method, path))
    except urllib.error.URLError as e:
        die("network error calling %s %s: %s" % (method, path, e.reason))


def resolve_zone_id(token):
    # 1) cached / manually-provided
    zid = read_trim(ZONE_ID_FILE)
    if zid:
        return zid
    # 2) look up by name (needs Zone.Read; the Purge template usually lacks it)
    res = api("GET", "/zones?name=" + ZONE_NAME, token)
    if res.get("success") and res.get("result"):
        zid = res["result"][0]["id"]
        try:
            with open(ZONE_ID_FILE, "w", encoding="utf-8") as f:
                f.write(zid)  # cache for next run
        except OSError:
            pass
        return zid
    errs = res.get("errors") if isinstance(res, dict) else None
    die("could not resolve zone id for %s (token likely lacks Zone.Read). "
        "Put the Zone ID from the CF dashboard into %s. API said: %s"
        % (ZONE_NAME, ZONE_ID_FILE, errs))


def main():
    token = read_trim(TOKEN_FILE)
    if not token:
        die("missing %s — create a 'Purge cache' API token (see this file's header) "
            "and save it there." % TOKEN_FILE)
    zid = resolve_zone_id(token)
    if DRY:
        print("cf-purge DRY-RUN: would POST /zones/%s/purge_cache {purge_everything:true}" % zid)
        return
    res = api("POST", "/zones/%s/purge_cache" % zid, token, {"purge_everything": True})
    if res.get("success"):
        print("cf-purge: Purge Everything OK (zone %s / %s)" % (ZONE_NAME, zid))
        return
    die("purge failed: %s" % res.get("errors"))


if __name__ == "__main__":
    main()
