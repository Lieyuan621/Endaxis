param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $LaunchArguments = @()
)

$ErrorActionPreference = 'Stop'

# Start-Process joins ArgumentList with spaces. Quote each argument for the
# Windows native command line so paths, quotes and trailing slashes survive.
function ConvertTo-EndaxisNativeArgument {
  param([AllowEmptyString()][string] $Argument)

  $result = New-Object System.Text.StringBuilder
  [void] $result.Append('"')
  $slashes = 0
  foreach ($character in $Argument.ToCharArray()) {
    if ($character -eq '\') {
      $slashes++
      continue
    }
    if ($character -eq '"') {
      [void] $result.Append(('\' * ($slashes * 2 + 1)))
    } else {
      [void] $result.Append(('\' * $slashes))
    }
    [void] $result.Append($character)
    $slashes = 0
  }
  [void] $result.Append(('\' * ($slashes * 2)))
  [void] $result.Append('"')
  return $result.ToString()
}

function Get-EndaxisNodePath {
  param([string] $Root)

  $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($command) { return [string] $command.Source }
  $bundled = Join-Path $Root 'local\tooling\node.exe'
  if (Test-Path -LiteralPath $bundled -PathType Leaf) { return $bundled }
  throw 'Node.js was not found. Install Node.js 22.12 or newer, then try again.'
}

function Show-EndaxisLaunchFailure {
  param([string] $Message)

  Add-Type -AssemblyName System.Windows.Forms
  [void] [System.Windows.Forms.MessageBox]::Show(
    $Message,
    'Endaxis desktop startup failed',
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  )
}

function Invoke-EndaxisDesktopLauncher {
  param(
    [string] $Root,
    [string[]] $Arguments = @(),
    [string] $LogRoot = (Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'EndaxisOverlay\launcher')
  )

  $logDirectory = $null
  $summaryLog = $null
  try {
    $Root = [System.IO.Path]::GetFullPath($Root)
    $hashProvider = [System.Security.Cryptography.SHA256]::Create()
    try {
      $hashBytes = $hashProvider.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Root.ToLowerInvariant()))
      $identity = ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').Substring(0, 12).ToLowerInvariant()
    } finally {
      $hashProvider.Dispose()
    }
    $logDirectory = Join-Path $LogRoot $identity
    [void] [System.IO.Directory]::CreateDirectory($logDirectory)
    $stamp = (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + $PID
    $summaryLog = Join-Path $logDirectory "$stamp-launcher.log"
    $stdoutLog = Join-Path $logDirectory "$stamp-stdout.log"
    $stderrLog = Join-Path $logDirectory "$stamp-stderr.log"
    [System.IO.File]::WriteAllText($summaryLog, "Workspace: $Root`r`nStarted: $(Get-Date -Format o)`r`n")

    $node = Get-EndaxisNodePath -Root $Root
    $versionProcess = Start-Process -FilePath $node -ArgumentList '--version' -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    $versionText = ([System.IO.File]::ReadAllText($stdoutLog)).Trim()
    if ($versionProcess.ExitCode -ne 0 -or $versionText -notmatch '^v(\d+\.\d+\.\d+)$') {
      throw 'Node.js could not run. See the stdout and stderr logs for details.'
    }
    if ([version] $Matches[1] -lt [version] '22.12.0') {
      throw "Node.js $versionText is too old. Install Node.js 22.12 or newer."
    }
    [System.IO.File]::AppendAllText($summaryLog, "Node: $node ($versionText)`r`n")

    $nativeArguments = @((Join-Path $Root 'desktop\launch.cjs')) + @($Arguments)
    $commandLine = ($nativeArguments | ForEach-Object { ConvertTo-EndaxisNativeArgument $_ }) -join ' '
    $child = Start-Process -FilePath $node -ArgumentList $commandLine -WorkingDirectory $Root -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    [System.IO.File]::AppendAllText($summaryLog, "Finished: $(Get-Date -Format o)`r`nExit code: $($child.ExitCode)`r`n")
    if ($child.ExitCode -ne 0) {
      throw "The desktop process exited with code $($child.ExitCode). Run npm ci and npm ci --prefix desktop in the workspace if dependencies are missing."
    }
    return 0
  } catch {
    $failure = $_.Exception.Message
    if ($summaryLog) {
      try { [System.IO.File]::AppendAllText($summaryLog, "Failure: $failure`r`n") } catch {}
    }
    $details = "Endaxis could not start.`r`n`r`n$failure"
    if ($logDirectory) { $details += "`r`n`r`nLogs: $logDirectory" }
    Show-EndaxisLaunchFailure -Message $details
    return 1
  }
}

# Dot-sourcing exposes the helpers to tests without launching an application.
if ($MyInvocation.InvocationName -ne '.') {
  exit (Invoke-EndaxisDesktopLauncher -Root (Join-Path $PSScriptRoot '..') -Arguments $LaunchArguments)
}
