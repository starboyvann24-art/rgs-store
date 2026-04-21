$files = Get-ChildItem 'c:\Users\admin\evan\public\*.html'
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f.FullName)
    $c = $c -replace '<body class="bg-black', '<body class="bg-white'
    $c = $c -replace 'bg-black text-gray-100', 'bg-white text-gray-900'
    [System.IO.File]::WriteAllText($f.FullName, $c)
    Write-Host "Patched: $($f.Name)"
}
Write-Host "DONE"
