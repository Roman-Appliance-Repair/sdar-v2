"""
Get DNS TXT verification token for adding the service account as a
DNS-verified owner of samedayappliance.repair.

Two modes:
  python scripts/gsc-dns-verify.py             # get token (default)
  python scripts/gsc-dns-verify.py --verify    # claim ownership after DNS propagates

Requires the Site Verification API enabled in project sdar-analytics:
  https://console.cloud.google.com/apis/library/siteverification.googleapis.com?project=sdar-analytics
"""

import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SA_JSON = r"C:\Users\Roman\WebstormProjects\sdar-v2\secrets\sdar-analytics-65ba2e820adb.json"
DOMAIN = "samedayappliance.repair"
SCOPES = ["https://www.googleapis.com/auth/siteverification"]


def get_service():
    creds = service_account.Credentials.from_service_account_file(SA_JSON, scopes=SCOPES)
    return build("siteVerification", "v1", credentials=creds, cache_discovery=False)


def get_token(svc):
    body = {
        "site": {"type": "INET_DOMAIN", "identifier": DOMAIN},
        "verificationMethod": "DNS_TXT",
    }
    resp = svc.webResource().getToken(body=body).execute()
    return resp["token"]


def verify(svc):
    body = {
        "site": {"type": "INET_DOMAIN", "identifier": DOMAIN},
    }
    resp = svc.webResource().insert(verificationMethod="DNS_TXT", body=body).execute()
    return resp


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
        if e.resp.status == 403 and "siteverification" in str(e).lower():
            print("ERROR: Site Verification API not enabled for project sdar-analytics.")
            print("Enable here, then retry:")
            print("  https://console.cloud.google.com/apis/library/siteverification.googleapis.com?project=sdar-analytics")
            sys.exit(1)
        raise

    print(f"Domain:     {DOMAIN}")
    print(f"DNS record:")
    print(f"  name:  @  (or  {DOMAIN}.)")
    print(f"  type:  TXT")
    print(f"  value: {token}")
    print(f"  TTL:   Auto (or 300)")


if __name__ == "__main__":
    main()
