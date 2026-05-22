$expected = 'google-site-verification=Qc2eK_wl5faOWvMRNyC5VAoBkgaUBpKuEyX9zInocy4'
$got = (Resolve-DnsName -Server ali.ns.cloudflare.com -Type TXT samedayappliance.repair `
        -DnsOnly -NoHostsFile -ErrorAction Stop |
        Where-Object { $_.Strings -like 'google-site-verification=Qc2eK*' }).Strings

Write-Host "Expected: $expected"
Write-Host "Got:      $got"
if ($got -eq $expected) {
    Write-Host "MATCH — ready to verify" -ForegroundColor Green
    exit 0
} else {
    Write-Host "MISMATCH — Cloudflare still has wrong value" -ForegroundColor Red
    exit 1
}
