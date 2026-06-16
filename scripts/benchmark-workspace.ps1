$ErrorActionPreference = 'Stop'

function Get-WinSatSnapshot {
    $winsat = Get-CimInstance Win32_WinSAT -ErrorAction SilentlyContinue
    if (-not $winsat) {
        return $null
    }

    [pscustomobject]@{
        CPUScore      = $winsat.CPUScore
        D3DScore      = $winsat.D3DScore
        DiskScore     = $winsat.DiskScore
        GraphicsScore  = $winsat.GraphicsScore
        MemoryScore    = $winsat.MemoryScore
        WinSPRLevel    = $winsat.WinSPRLevel
        AssessedAt     = $winsat.TimeTaken
    }
}

function Measure-ToolStartup {
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        [Parameter(Mandatory)]
        [string]$CommandLine
    )

    $elapsed = Measure-Command {
        Invoke-Expression $CommandLine | Out-Null
    }

    [pscustomobject]@{
        Tool    = $Name
        Ms      = [math]::Round($elapsed.TotalMilliseconds, 2)
    }
}

function Get-BrowserPath {
    $candidates = @(
        "$env:LocalAppData\Thorium\Application\chrome.exe",
        "$env:LocalAppData\Thorium\Application\thorium.exe",
        "$env:LocalAppData\Thorium\Application\138.0.7204.300\thorium_shell.exe",
        "$env:LocalAppData\Thorium\thorium.exe",
        "$env:ProgramFiles\Thorium\Application\chrome.exe",
        "$env:ProgramFiles\Thorium\thorium.exe",
        "$env:ProgramFiles(x86)\Thorium\Application\chrome.exe",
        "$env:ProgramFiles(x86)\Thorium\thorium.exe",
        "$env:ProgramFiles\Waterfox\waterfox.exe",
        "$env:LocalAppData\Programs\Waterfox\waterfox.exe"
    )

    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return $path
        }
    }

    return $null
}

function Get-ExactBrowserPath {
    param(
        [Parameter(Mandatory)]
        [string[]]$Candidates
    )

    foreach ($path in $Candidates) {
        if (Test-Path $path) {
            return $path
        }
    }

    return $null
}

function Measure-BrowserColdStart {
    param(
        [Parameter(Mandatory)]
        [string]$Path,
        [string[]]$Args = @('--new-window', 'about:blank')
    )

    $proc = Start-Process -FilePath $Path -ArgumentList $Args -PassThru
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while (-not $proc.HasExited -and $proc.MainWindowHandle -eq 0 -and $sw.ElapsedMilliseconds -lt 30000) {
            Start-Sleep -Milliseconds 100
            $proc.Refresh()
        }
        $sw.Stop()

        [pscustomobject]@{
            Browser = Split-Path $Path -Leaf
            Path    = $Path
            Version = (Get-Item $Path).VersionInfo.FileVersion
            Ms      = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
            Window  = [bool]($proc.MainWindowHandle -ne 0)
        }
    }
    finally {
        if (-not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force
        }
    }
}

$report = [ordered]@{}
$report.Timestamp = (Get-Date).ToString('o')
$report.Computer = [ordered]@{
    Os      = (Get-CimInstance Win32_OperatingSystem).Caption
    Build   = (Get-CimInstance Win32_OperatingSystem).BuildNumber
    Cpu     = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
    RamGb   = [math]::Round(((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB), 2)
}
$report.WinSat = Get-WinSatSnapshot

$report.Tools = @(
    Measure-ToolStartup -Name 'git' -CommandLine 'git --version'
    Measure-ToolStartup -Name 'gh' -CommandLine 'gh --version'
    Measure-ToolStartup -Name 'node' -CommandLine 'node --version'
    Measure-ToolStartup -Name 'pnpm' -CommandLine 'pnpm --version'
    Measure-ToolStartup -Name 'python' -CommandLine 'python --version'
    Measure-ToolStartup -Name 'zoxide' -CommandLine 'zoxide --version'
    Measure-ToolStartup -Name 'gsudo' -CommandLine 'gsudo --version'
    Measure-ToolStartup -Name 'pwsh' -CommandLine 'pwsh -NoLogo -NoProfile -Command "exit"'
)

$thoriumPath = Get-ExactBrowserPath -Candidates @(
    "$env:LocalAppData\Thorium\Application\thorium.exe",
    "$env:LocalAppData\Thorium\Application\chrome.exe",
    "$env:LocalAppData\Thorium\Application\138.0.7204.300\thorium_shell.exe"
)
$chromiumPath = Get-ExactBrowserPath -Candidates @(
    "$env:LocalAppData\Chromium\Application\chrome.exe"
)

$browserResults = @()
if ($chromiumPath) {
    $browserResults += Measure-BrowserColdStart -Path $chromiumPath
}
if ($thoriumPath) {
    $browserResults += Measure-BrowserColdStart -Path $thoriumPath
}

if ($browserResults.Count -gt 0) {
    $report.Browsers = $browserResults
}

$report | ConvertTo-Json -Depth 6
