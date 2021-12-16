# beautify a tsc-generated javascript file 
# the type script compiler does not respect tabs and inserts instead 4 spaces
# beautifyjsfile will revert this
# it will also update import module directive for the case where js and ts files do not have the same directory structure
# ./../../ will be replaced with ./../
function beautifyjsfile {
    param (
        $filename
    )
    Write-Host $filename
    $s=(Get-Content $filename) -Match '(?m)^    '
    if ($s.Length -eq 0) {
        Write-Host "  no spaces to replace by tabs"
    }
    else {
        (Get-Content $filename) -Replace '(?m)    ', "`t" | Set-Content $filename
        Write-Host "  updated for tabs"
    }
    $s=(Get-Content $filename) -Match '(?m)\./\.\./\.\.'
    if ($s.Length -eq 0) {
        Write-Host "  no import to replace"
    }
    else {
        (Get-Content $filename) -Replace '(?m)\./\.\.', "." | Set-Content $filename
        Write-Host "  updated for import directive"
    }
}

$dir=$args[0]
if ($dir.Length -eq 0) {
    Write-Host "missing argument - work directory needed"
}
else {
    $conftsc="$($dir)\ts\tsconfig.json"
    # get in $json the list of ts files for compilation
    $json=Get-Content $conftsc | ConvertFrom-Json
    write-host "$($json.files.length) files to beautify"
    # for each file foumd, find the corresponding generated javascript and beautify it
    foreach ($file in $json.files) {
        $jsfile=$file.replace('.ts', '.js')
        $jsfile="$($dir)\$($jsfile)"
        beautifyjsfile $jsfile
    }
}