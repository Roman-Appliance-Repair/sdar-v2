"""
FILE-method verification for adding the GA4 service account as owner of
https://samedayappliance.repair/ (URL-prefix property).

Two modes:
  python scripts/gsc-file-verify.py            # fetch token + write public/<token>.html
  python scripts/gsc-file-verify.py --verify   # claim ownership after file is live

Note: FILE method grants URL-prefix property ownership, not domain
property. Google auto-populates 16 months of historical data for the
URL-prefix on creation, so MCP queries against the URL-prefix property
will see the same historical search data.
"""

import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SA_JSON = r"C:\Users\Roman\WebstormProjects\sdar-v2\secrets\sdar-analytics-65ba2e820adb.json"
SITE_URL = "https://samedayappliance.repair/"
PUBLIC_DIR = r"C:\Users\Roman\WebstormProjects\sdar-v2\public"
SCOPES = ["https://www.googleapis.com/auth/siteverification"]


def get_service():
    creds = service_account.Credentials.from_service_account_file(SA_JSON, scopes=SCOPES)
    return build("siteVerification", "v1", credentials=creds, cache_discovery=False)


def get_token(svc):
    body = {
        "site": {"type": "SITE", "identifier": SITE_URL},
        "verificationMethod": "FILE",
    }
    resp = svc.webResource().getToken(body=body).execute()
    return resp["token"]


def verify(svc):
    body = {"site": {"type": "SITE", "identifier": SITE_URL}}
    return svc.webResource().insert(verificationMethod="FILE", body=body).execute()


def main():
    svc = get_service()

    if "--verify" in sys.argv:
        try:
            resp = verify(svc)
            print("VERIFIED. Owner record:")
            print(resp)
        except HttpError as e:
            print(f"VERIFY FAILED: {e}")
            sys.exit(1)
        return

    try:
        token = get_token(svc)
    except HttpError as e:
        if e.resp.status == 403:
            print("ERROR: Site Verification API not enabled or insufficient SA perms.")
            print("Enable: https://console.cloud.google.com/apis/library/siteverification.googleapis.com?project=sdar-analytics")
            sys.exit(1)
        raise

    filename = token
    content = f"google-site-verification: {token}\n"
    path = os.path.join(PUBLIC_DIR, filename)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

    print(f"Site:     {SITE_URL}")
    print(f"Filename: {filename}")
    print(f"Wrote:    {path}")
    print(f"Content:  {content!r}")
    print()
    print("Next:")
    print(f"  1. git add public/{filename}")
    print(f'  2. git commit -m "chore(verify): add GSC site-verification file"')
    print(f"  3. git push origin main")
    print(f"  4. Wait ~90s for Cloudflare Pages deploy")
    print(f"  5. Confirm live: curl -s {SITE_URL}{filename}")
    print(f"  6. python scripts/gsc-file-verify.py --verify")


if __name__ == "__main__":
    main()
