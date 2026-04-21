# Remove dark decorative blur blobs from login, register, reset-password
$targets = @(
    'c:\Users\admin\evan\public\login.html',
    'c:\Users\admin\evan\public\register.html',
    'c:\Users\admin\evan\public\reset-password.html'
)
foreach ($p in $targets) {
    $c = [System.IO.File]::ReadAllText($p)
    # Remove blob divs
    $c = $c -replace '(?s)\s*<div class="absolute -top-20[^"]*"[^>]*></div>', ''
    $c = $c -replace '(?s)\s*<div class="absolute -bottom-20[^"]*"[^>]*></div>', ''
    # Fix footer Dev by text if missing
    [System.IO.File]::WriteAllText($p, $c)
    Write-Host "Cleaned blobs: $p"
}

# Now fix footers across dashboard, login, register, checkout, cart etc.
$footerFiles = @(
    'c:\Users\admin\evan\public\login.html',
    'c:\Users\admin\evan\public\register.html',
    'c:\Users\admin\evan\public\checkout.html',
    'c:\Users\admin\evan\public\dashboard.html',
    'c:\Users\admin\evan\public\cart.html',
    'c:\Users\admin\evan\public\product.html'
)
$brandingPattern = 'Designed for the Future by <span class="text-primary-500">VAN</span>'
$brandingReplace = 'Dev by <span class="text-primary-500">E_vann</span> | RGS STORE © 2026'
$brandingPattern2 = 'Designed for the Future by <span[^>]*>VAN</span>[^<]*'
foreach ($p in $footerFiles) {
    if (Test-Path $p) {
        $c = [System.IO.File]::ReadAllText($p)
        $c = $c -replace 'Designed for the Future by <span class="text-primary-500">VAN</span>[^<]*', 'Dev by <span class="text-primary-500">E_vann</span> | RGS STORE © 2026'
        [System.IO.File]::WriteAllText($p, $c)
        Write-Host "Footer fixed: $p"
    }
}
Write-Host "ALL DONE"
