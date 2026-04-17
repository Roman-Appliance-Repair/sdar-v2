# ============================================================================
# SDAR v2 -- Content Migration Script  v3 (fixed)
# ============================================================================
# Verified against Notion SSOT on 2026-04-16.
# v3: Fixed PowerShell parsing issues with format strings
# ============================================================================

$ErrorActionPreference = 'Stop'
$ProjectRoot = "C:\Users\Roman\WebstormProjects\sdar-v2"
$IncomingDir = Join-Path $ProjectRoot "_incoming-zips"
$PagesDir    = Join-Path $ProjectRoot "src\pages"
$DataDir     = Join-Path $ProjectRoot "src\data"
$DocsDir     = Join-Path $IncomingDir "_docs"
$StagingDir  = Join-Path $env:TEMP "sdar-v2-staging"
$StatusFile  = Join-Path $ProjectRoot "MIGRATION-STATUS.md"

if (-not (Test-Path $IncomingDir)) {
    Write-Host "ERROR: $IncomingDir not found" -ForegroundColor Red
    exit 1
}

Write-Host "SDAR v2 -- Content Migration (v3)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# STEP 1: Prepare staging
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Step 1: Preparing staging..." -ForegroundColor Yellow
if (Test-Path $StagingDir) { Remove-Item $StagingDir -Recurse -Force }
New-Item -ItemType Directory -Path $StagingDir | Out-Null

$zips = Get-ChildItem -Path $IncomingDir -Filter "*.zip"
foreach ($zip in $zips) {
    $sub = Join-Path $StagingDir ($zip.BaseName -replace '[^a-zA-Z0-9_-]', '_')
    New-Item -ItemType Directory -Path $sub | Out-Null
    Write-Host "  Unpacking $($zip.Name)..."
    Expand-Archive -Path $zip.FullName -DestinationPath $sub -Force
}

$looseDir = Join-Path $StagingDir "_loose"
New-Item -ItemType Directory -Path $looseDir | Out-Null
Get-ChildItem -Path $IncomingDir -File | Where-Object {
    $_.Extension -ne '.zip' -and $_.Name -notlike '_*'
} | ForEach-Object {
    Copy-Item $_.FullName $looseDir
}

# ---------------------------------------------------------------------------
# STEP 2: Collect ALL files, deduplicate by name (larger wins)
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Step 2: Collecting and deduplicating..." -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path $StagingDir -Recurse -File
Write-Host "  Total files in staging: $($allFiles.Count)"

$bestByName = @{}
$conflicts = New-Object System.Collections.ArrayList

foreach ($f in $allFiles) {
    $key = $f.Name.ToLower()
    if ($bestByName.ContainsKey($key)) {
        $prev = $bestByName[$key]
        if ($f.Length -gt $prev.Length) {
            $keptStr = $f.Name + " (" + $f.Length + " bytes, from " + (Split-Path $f.Directory -Leaf) + ")"
            $droppedStr = $prev.Name + " (" + $prev.Length + " bytes, from " + (Split-Path $prev.Directory -Leaf) + ")"
            [void]$conflicts.Add([PSCustomObject]@{
                File    = $f.Name
                Kept    = $keptStr
                Dropped = $droppedStr
            })
            $bestByName[$key] = $f
        }
        elseif ($f.Length -lt $prev.Length) {
            $keptStr = $prev.Name + " (" + $prev.Length + " bytes, from " + (Split-Path $prev.Directory -Leaf) + ")"
            $droppedStr = $f.Name + " (" + $f.Length + " bytes, from " + (Split-Path $f.Directory -Leaf) + ")"
            [void]$conflicts.Add([PSCustomObject]@{
                File    = $f.Name
                Kept    = $keptStr
                Dropped = $droppedStr
            })
        }
    }
    else {
        $bestByName[$key] = $f
    }
}

$uniqueFiles = $bestByName.Values
Write-Host "  Unique files after dedup: $($uniqueFiles.Count)"
Write-Host "  Conflicts (larger won): $($conflicts.Count)"

# ---------------------------------------------------------------------------
# STEP 3: Classify
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Step 3: Classifying by naming pattern..." -ForegroundColor Yellow

$knownCities = @(
    'agoura-hills','alhambra','anaheim','arcadia','atwater-village','bel-air',
    'beverly-hills','brentwood','burbank','calabasas','camarillo','chino-hills',
    'corona','costa-mesa','culver-city','dana-point','eagle-rock','el-segundo',
    'encino','fontana','fullerton','glassell-park','glendale','hemet',
    'highland-park','hollywood','hollywood-hills','huntington-beach','irvine',
    'koreatown','la-canada-flintridge','ladera-heights','laguna-beach',
    'laguna-niguel','lake-elsinore','loma-linda','long-beach','los-angeles',
    'los-feliz','malibu','manhattan-beach','marina-del-rey',
    'menifee','mission-viejo','monrovia','monterey-park','moorpark',
    'moreno-valley','murrieta','newbury-park','newport-beach','north-hollywood',
    'oak-park','ontario','pacific-palisades','pasadena',
    'playa-del-rey','rancho-cucamonga','redlands','redondo-beach','riverside',
    'san-bernardino','san-clemente',
    'san-gabriel','san-marino','santa-monica','sherman-oaks','silver-lake',
    'simi-valley','south-pasadena','studio-city','tarzana','temecula',
    'temple-city','thousand-oaks','torrance','tustin','upland','ventura',
    'villa-park','west-hollywood','westlake-village',
    'westwood','woodland-hills','yorba-linda'
)
$countyHubs = @('los-angeles-county','orange-county','ventura-county','san-bernardino-county','riverside-county')
$forBusiness = @('airbnb-short-term-rentals','bars-nightclubs','hotels','property-management','restaurants','retail-grocery')
$credentials = @(
    'background-checked-appliance-repair','bbb-accredited-appliance-repair',
    'epa-certified-appliance-repair','insured-appliance-repair',
    'licensed-appliance-repair','oem-parts-appliance-repair',
    'osha-certified-appliance-repair','same-day-appliance-repair-service'
)
$commercialDishwasherBrands = @(
    'adler','beko','blakeslee','champion','classeq','cma-dishmachines','comenda',
    'electrolux-professional','fagor','hobart','jackson','jla','meiko',
    'miele-commercial','scotsman','smeg','sterling-pro','washtech','wexiodisk',
    'winterhalter'
)
$specialLegacy = @(
    'mainstreet-equipment-commercial-ovens-repair',
    'lang-commercial-ovens-repair',
    'bki-commercial-ovens-repair',
    'cma-dishmachines-repair',
    'huebsch-commercial-dryer-repair',
    'lincoln-commercial-ovens-repair',
    'marsal-pizza-ovens-repair',
    'turbochef-commercial-ovens-repair'
)
$servicesSlugs = @(
    'refrigerator-repair','washer-repair','dryer-repair','dishwasher-repair',
    'oven-repair','stove-repair','freezer-repair','ice-maker-repair',
    'wine-cooler-repair','wine-cellar-repair','microwave-repair','cooktop-repair',
    'induction-cooktop-repair','range-hood-repair','wall-oven-repair',
    'garbage-disposal-repair','stackable-washer-dryer-repair',
    'built-in-refrigerator-repair','bbq-grill-repair','fireplace-repair',
    'trash-compactor-repair','pizza-oven-repair'
)
$knownShortBrands = @(
    'bosch','lg','ge','samsung','sub-zero','viking','whirlpool','maytag',
    'kenmore','electrolux','frigidaire','haier'
)

function Get-Destination {
    param([string]$FileName)

    $name = $FileName.ToLower()
    $nameNoExt = [System.IO.Path]::GetFileNameWithoutExtension($name)
    $ext = [System.IO.Path]::GetExtension($name)

    if ($name -eq 'index.astro') {
        return @{ Dest = $null; Category = 'skipped-index'; FinalName = $name }
    }
    if ($ext -eq '.ts') {
        return @{ Dest = Join-Path $DataDir $name; Category = 'data-ts'; FinalName = $name }
    }
    if ($ext -eq '.md') {
        return @{ Dest = Join-Path $DocsDir $name; Category = 'docs-md'; FinalName = $name }
    }
    if ($name -eq '_redirects') {
        return @{ Dest = $null; Category = 'skipped-redirects'; FinalName = $name }
    }
    if ($ext -ne '.astro') {
        return @{ Dest = $null; Category = 'skipped-other'; FinalName = $name }
    }

    if ($specialLegacy -contains $nameNoExt) {
        return @{ Dest = Join-Path $PagesDir $name; Category = 'special-legacy'; FinalName = $name }
    }

    if ($nameNoExt -match '^brand-([a-z-]+)-commercial-repair$') {
        $brandSlug = $Matches[1]
        $newName = $brandSlug + "-commercial-repair.astro"
        return @{
            Dest = Join-Path $PagesDir "brands\commercial-refrigeration\$newName"
            Category = 'brand-commercial-refrigeration'
            FinalName = $newName
        }
    }

    if ($nameNoExt -match '^brand-([a-z-]+)-appliance-repair$') {
        $brandSlug = $Matches[1]
        $newName = $brandSlug + "-appliance-repair.astro"
        return @{
            Dest = Join-Path $PagesDir "brands\$newName"
            Category = 'brand-residential'
            FinalName = $newName
        }
    }

    foreach ($b in $commercialDishwasherBrands) {
        if ($nameNoExt -eq "$b-dishwasher-repair") {
            return @{
                Dest = Join-Path $PagesDir "brands\commercial-dishwashers\$name"
                Category = 'brand-comm-dw'
                FinalName = $name
            }
        }
    }

    if ($nameNoExt -eq 'commercial-refrigeration-hub') {
        return @{
            Dest = Join-Path $PagesDir "commercial\refrigeration-hub.astro"
            Category = 'commercial'
            FinalName = 'refrigeration-hub.astro'
        }
    }

    if ($nameNoExt -match '-repair-cost$' -or $nameNoExt -eq 'appliance-reapir-cost') {
        return @{
            Dest = Join-Path $PagesDir "price-list\$name"
            Category = 'price-list'
            FinalName = $name
        }
    }

    if ($nameNoExt -match '^commercial-[a-z-]+-repair$') {
        $shortName = $nameNoExt -replace '^commercial-', ''
        $newName = $shortName + ".astro"
        return @{
            Dest = Join-Path $PagesDir "commercial\$newName"
            Category = 'commercial'
            FinalName = $newName
        }
    }

    if ($credentials -contains $nameNoExt) {
        return @{ Dest = Join-Path $PagesDir "credentials\$name"; Category = 'credentials'; FinalName = $name }
    }

    if ($forBusiness -contains $nameNoExt) {
        return @{ Dest = Join-Path $PagesDir "for-business\$name"; Category = 'for-business'; FinalName = $name }
    }

    if ($servicesSlugs -contains $nameNoExt) {
        return @{ Dest = Join-Path $PagesDir "services\$name"; Category = 'services'; FinalName = $name }
    }

    if ($nameNoExt -match '-repair$') {
        $brandSlug = $nameNoExt -replace '-repair$', ''
        if ($knownShortBrands -contains $brandSlug) {
            $newName = $brandSlug + "-appliance-repair.astro"
            return @{
                Dest = Join-Path $PagesDir "brands\$newName"
                Category = 'brand-residential'
                FinalName = $newName
            }
        }
    }

    if ($knownCities -contains $nameNoExt) {
        return @{ Dest = Join-Path $PagesDir "$name"; Category = 'city'; FinalName = $name }
    }

    if ($countyHubs -contains $nameNoExt) {
        return @{ Dest = Join-Path $PagesDir "$name"; Category = 'county-hub'; FinalName = $name }
    }

    return @{ Dest = Join-Path $IncomingDir "_unsorted\$name"; Category = 'unsorted'; FinalName = $name }
}

# ---------------------------------------------------------------------------
# STEP 4: Copy files
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Step 4: Copying files to destinations..." -ForegroundColor Yellow

$stats = @{
    services = 0; commercial = 0; credentials = 0; 'for-business' = 0
    'price-list' = 0; 'brand-residential' = 0; 'brand-commercial-refrigeration' = 0
    'brand-comm-dw' = 0; city = 0; 'county-hub' = 0; 'special-legacy' = 0
    'data-ts' = 0; 'docs-md' = 0
    unsorted = 0; 'skipped-index' = 0; 'skipped-redirects' = 0; 'skipped-other' = 0
}
$placements = New-Object System.Collections.ArrayList
$renames = New-Object System.Collections.ArrayList

foreach ($f in $uniqueFiles) {
    $result = Get-Destination -FileName $f.Name
    $cat = $result.Category
    $stats[$cat]++

    if ($result.Dest) {
        $destFolder = Split-Path $result.Dest -Parent
        if (-not (Test-Path $destFolder)) {
            New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
        }
        Copy-Item -Path $f.FullName -Destination $result.Dest -Force

        [void]$placements.Add([PSCustomObject]@{
            SourceFile = $f.Name
            FinalName  = $result.FinalName
            Size       = $f.Length
            Category   = $cat
            Dest       = $result.Dest.Replace($ProjectRoot + '\', '')
        })

        if ($f.Name -ne $result.FinalName) {
            [void]$renames.Add([PSCustomObject]@{
                From = $f.Name
                To   = $result.FinalName
                In   = $cat
            })
        }
    }
}

# ---------------------------------------------------------------------------
# STEP 5: Write MIGRATION-STATUS.md
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "Step 5: Writing MIGRATION-STATUS.md..." -ForegroundColor Yellow

$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$lines = New-Object System.Collections.ArrayList
[void]$lines.Add("# SDAR v2 -- Migration Status")
[void]$lines.Add("")
[void]$lines.Add("_Generated by migrate-content.ps1 on $now_")
[void]$lines.Add("")
[void]$lines.Add("## Summary")
[void]$lines.Add("")
[void]$lines.Add("| Category | Files |")
[void]$lines.Add("|---|---|")
[void]$lines.Add("| Services                        | " + $stats['services'] + " |")
[void]$lines.Add("| Commercial                      | " + $stats['commercial'] + " |")
[void]$lines.Add("| Credentials                     | " + $stats['credentials'] + " |")
[void]$lines.Add("| For-business                    | " + $stats['for-business'] + " |")
[void]$lines.Add("| Price-list                      | " + $stats['price-list'] + " |")
[void]$lines.Add("| Brand (residential)             | " + $stats['brand-residential'] + " |")
[void]$lines.Add("| Brand (commercial-refrigeration)| " + $stats['brand-commercial-refrigeration'] + " |")
[void]$lines.Add("| Brand (commercial-dishwashers)  | " + $stats['brand-comm-dw'] + " |")
[void]$lines.Add("| City pages (root)               | " + $stats['city'] + " |")
[void]$lines.Add("| County hubs (root)              | " + $stats['county-hub'] + " |")
[void]$lines.Add("| Special legacy (live traffic)   | " + $stats['special-legacy'] + " |")
[void]$lines.Add("| Data (.ts)                      | " + $stats['data-ts'] + " |")
[void]$lines.Add("| Docs (.md)                      | " + $stats['docs-md'] + " |")
[void]$lines.Add("| **Unsorted (needs review)**     | **" + $stats['unsorted'] + "** |")
[void]$lines.Add("| Skipped: index.astro            | " + $stats['skipped-index'] + " |")
[void]$lines.Add("| Skipped: _redirects             | " + $stats['skipped-redirects'] + " |")
[void]$lines.Add("| Skipped: other non-astro        | " + $stats['skipped-other'] + " |")
[void]$lines.Add("| **Total unique files**          | **" + $uniqueFiles.Count + "** |")
[void]$lines.Add("")

if ($renames.Count -gt 0) {
    [void]$lines.Add("## Renames applied (SEO cleanup)")
    [void]$lines.Add("")
    [void]$lines.Add("| From | To | Category |")
    [void]$lines.Add("|---|---|---|")
    foreach ($r in $renames) {
        [void]$lines.Add("| ``" + $r.From + "`` | ``" + $r.To + "`` | " + $r.In + " |")
    }
    [void]$lines.Add("")
    [void]$lines.Add("**IMPORTANT:** These renamed files need 301 redirects to preserve SEO traffic.")
    [void]$lines.Add("")
}

if ($conflicts.Count -gt 0) {
    [void]$lines.Add("## Conflicts (larger version kept)")
    [void]$lines.Add("")
    [void]$lines.Add("| File | Kept | Dropped |")
    [void]$lines.Add("|---|---|---|")
    foreach ($c in $conflicts) {
        [void]$lines.Add("| " + $c.File + " | " + $c.Kept + " | " + $c.Dropped + " |")
    }
    [void]$lines.Add("")
}

if ($stats['unsorted'] -gt 0) {
    [void]$lines.Add("## Unsorted files (need manual review)")
    [void]$lines.Add("")
    [void]$lines.Add("These files did not match any naming pattern, placed in ``_incoming-zips/_unsorted/``:")
    [void]$lines.Add("")
    $unsortedFiles = $placements | Where-Object { $_.Category -eq 'unsorted' }
    foreach ($u in $unsortedFiles) {
        [void]$lines.Add("- ``" + $u.SourceFile + "`` (" + $u.Size + " bytes)")
    }
    [void]$lines.Add("")
}

[void]$lines.Add("## Placements (by category)")
[void]$lines.Add("")

$categories = @('services','commercial','credentials','for-business','price-list',
                'brand-residential','brand-commercial-refrigeration','brand-comm-dw',
                'city','county-hub','special-legacy','data-ts','docs-md')
foreach ($cat in $categories) {
    $group = $placements | Where-Object { $_.Category -eq $cat } | Sort-Object Dest
    if ($group.Count -eq 0) { continue }
    [void]$lines.Add("### " + $cat + " (" + $group.Count + " files)")
    [void]$lines.Add("")
    foreach ($p in $group) {
        [void]$lines.Add("- ``" + $p.Dest + "`` (" + $p.Size + " bytes)")
    }
    [void]$lines.Add("")
}

[void]$lines.Add("## Next steps")
[void]$lines.Add("")
[void]$lines.Add("1. Review files in ``_incoming-zips/_unsorted/`` and sort manually")
[void]$lines.Add("2. Add 301 redirects for renamed files (see Renames section above)")
[void]$lines.Add("3. Run ``npm run build`` -- expect import errors (old components)")
[void]$lines.Add("4. Fix imports block-by-block (Layout path first, then components)")
[void]$lines.Add("5. Missing files per Notion -- migrate from old project via Claude Code")
[void]$lines.Add("")

$lines -join "`n" | Set-Content -Path $StatusFile -Encoding UTF8

# ---------------------------------------------------------------------------
# STEP 6: Final summary
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Migration complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total unique files processed: $($uniqueFiles.Count)"
Write-Host "Conflicts resolved (larger won): $($conflicts.Count)"
Write-Host "Renames applied (SEO cleanup): $($renames.Count)"
Write-Host ""
Write-Host "By category:"
foreach ($k in $stats.Keys | Sort-Object) {
    if ($stats[$k] -gt 0) {
        $line = "  " + $k.PadRight(36) + " " + $stats[$k]
        Write-Host $line
    }
}
Write-Host ""
Write-Host "Full report: $StatusFile" -ForegroundColor Cyan
Write-Host ""
if ($stats['unsorted'] -gt 0) {
    Write-Host "[!] $($stats['unsorted']) file(s) in _incoming-zips/_unsorted/ need manual review." -ForegroundColor Yellow
}
Write-Host "Staging kept at: $StagingDir"
