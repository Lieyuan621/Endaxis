const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const windows = { skip: process.platform !== 'win32' };
const helper = path.join(__dirname, '../start-desktop.ps1');
const psString = value => `'${value.replaceAll("'", "''")}'`;

function powershell(source) {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
      Buffer.from(
        `$ErrorActionPreference = 'Stop'\n. ${psString(helper)}\n${source}`,
        'utf16le',
      ).toString('base64'),
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 30000 },
  );
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'endaxis launcher '));
  try {
    fs.mkdirSync(path.join(root, 'desktop', 'app'), { recursive: true });
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test(
  'native quoting preserves spaced paths, empty values, quotes and trailing slashes',
  windows,
  () => {
    fixture(root => {
      const probe = path.join(root, 'argv probe.cjs');
      const output = path.join(root, 'argv.json');
      fs.writeFileSync(probe, 'process.stdout.write(JSON.stringify(process.argv.slice(2)))');
      const args = [
        '',
        'one two',
        'value"quoted',
        'C:\\folder with space\\',
        'x\\\\"y',
        '--label=中文 试验',
        '--url=https://example.test/?a=1&b=2',
      ];
      powershell(`
$arguments = @(${[probe, ...args].map(psString).join(', ')})
$commandLine = ($arguments | ForEach-Object { ConvertTo-EndaxisNativeArgument $_ }) -join ' '
$child = Start-Process -FilePath ${psString(process.execPath)} -ArgumentList $commandLine -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput ${psString(output)}
if ($child.ExitCode -ne 0) { throw 'The argument probe failed.' }
`);
      assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), args);
    });
  },
);

test(
  'CMD releases its console and forwards spaced and Unicode arguments to the hidden helper',
  windows,
  async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'endaxis cmd launcher '));
    try {
      const desktop = path.join(root, 'desktop');
      fs.mkdirSync(desktop);
      const cmd = path.join(desktop, 'start-desktop.cmd');
      const output = path.join(root, 'arguments.json');
      fs.copyFileSync(path.join(__dirname, '../start-desktop.cmd'), cmd);
      const parameterBlock = fs
        .readFileSync(helper, 'utf8')
        .split("$ErrorActionPreference = 'Stop'")[0];
      fs.writeFileSync(
        path.join(desktop, 'start-desktop.ps1'),
        parameterBlock +
          `\n[System.IO.File]::WriteAllText(${psString(output)}, (ConvertTo-Json -InputObject @($LaunchArguments) -Compress))\nStart-Sleep -Seconds 3\n`,
      );
      const expected = [
        '--no-editor',
        '--label=中文 试验',
        '--user-data-dir=C:\\中文 profile with space\\',
        '--url=https://example.test/?a=1&b=2',
      ];
      const quote = value => `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"`;
      const invocation = `""${cmd}" ${expected.map(quote).join(' ')}"`;
      const started = Date.now();
      const result = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', invocation], {
        encoding: 'utf8',
        windowsHide: false,
        windowsVerbatimArguments: true,
        timeout: 5000,
        stdio: 'ignore',
      });
      assert.equal(result.status, 0, result.error?.message);
      assert.ok(
        Date.now() - started < 2500,
        'CMD must return while the hidden helper is still running',
      );
      const deadline = Date.now() + 5000;
      while (!fs.existsSync(output) && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), expected);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  },
);

test(
  'hidden launcher preserves arguments and keeps stdout and stderr logs after normal exit',
  windows,
  () => {
    fixture(root => {
      const expected = [
        '--no-editor',
        '--user-data-dir=C:\\中文 profile with space\\',
        '--label=value"quoted',
        '--url=https://example.test/?a=1&b=2',
      ];
      fs.writeFileSync(
        path.join(root, 'desktop', 'app', 'launch.cjs'),
        'process.stdout.write(JSON.stringify(process.argv.slice(2))); process.stderr.write("中文 diagnostic");',
      );
      const result = JSON.parse(
        powershell(`
function Show-EndaxisLaunchFailure { param($Message); throw "Unexpected failure: $Message" }
$code = Invoke-EndaxisDesktopLauncher -Root ${psString(root)} -Arguments @(${expected.map(psString).join(', ')}) -LogRoot ${psString(path.join(root, 'logs'))}
$directory = Get-ChildItem -LiteralPath ${psString(path.join(root, 'logs'))} -Directory | Select-Object -First 1
@{ code = $code; directory = $directory.FullName } | ConvertTo-Json -Compress
`),
      );
      assert.equal(result.code, 0);
      const files = fs.readdirSync(result.directory);
      const read = suffix =>
        fs.readFileSync(
          path.join(
            result.directory,
            files.find(file => file.endsWith(suffix)),
          ),
          'utf8',
        );
      assert.deepEqual(JSON.parse(read('-stdout.log')), expected);
      assert.equal(read('-stderr.log'), '中文 diagnostic');
      assert.match(read('-launcher.log'), /Exit code: 0/);
    });
  },
);

test('unsupported Node version is rejected before starting Electron', windows, () => {
  fixture(root => {
    const result = JSON.parse(
      powershell(`
$script:alert = $null
$script:calls = 0
function Get-EndaxisNodePath { param($Root); return 'node.exe' }
function Start-Process {
  param($FilePath, $ArgumentList, $WindowStyle, [switch]$Wait, [switch]$PassThru, $RedirectStandardOutput, $RedirectStandardError)
  $script:calls++
  if ($WindowStyle -ne 'Hidden') { throw 'The version probe must be hidden.' }
  [System.IO.File]::WriteAllText($RedirectStandardOutput, 'v20.19.0')
  return @{ ExitCode = 0 }
}
function Show-EndaxisLaunchFailure { param($Message); $script:alert = $Message }
$code = Invoke-EndaxisDesktopLauncher -Root ${psString(root)} -LogRoot ${psString(path.join(root, 'logs'))}
@{ code = $code; alert = $script:alert; calls = $script:calls } | ConvertTo-Json -Compress
`),
    );
    assert.equal(result.code, 1);
    assert.equal(result.calls, 1);
    assert.match(result.alert, /too old/);
    assert.match(result.alert, /22.12/);
  });
});

test(
  'asynchronous child failure produces a readable alert and a persistent diagnostic path',
  windows,
  () => {
    fixture(root => {
      fs.writeFileSync(
        path.join(root, 'desktop', 'app', 'launch.cjs'),
        'process.stderr.write("missing dependency fixture"); process.exit(9);',
      );
      const result = JSON.parse(
        powershell(`
$script:alert = $null
function Show-EndaxisLaunchFailure { param($Message); $script:alert = $Message }
$code = Invoke-EndaxisDesktopLauncher -Root ${psString(root)} -LogRoot ${psString(path.join(root, 'logs'))}
@{ code = $code; alert = $script:alert } | ConvertTo-Json -Compress
`),
      );
      assert.equal(result.code, 1);
      assert.match(result.alert, /exited with code 9/);
      assert.match(result.alert, /npm ci --prefix desktop/);
      const directory = result.alert.split('Logs: ')[1];
      const files = fs.readdirSync(directory);
      assert.equal(
        fs.readFileSync(
          path.join(
            directory,
            files.find(file => file.endsWith('-stderr.log')),
          ),
          'utf8',
        ),
        'missing dependency fixture',
      );
      assert.match(
        fs.readFileSync(
          path.join(
            directory,
            files.find(file => file.endsWith('-launcher.log')),
          ),
          'utf8',
        ),
        /Failure:/,
      );
    });
  },
);

test(
  'multiple Node applications resolve to the first PATH entry as one executable path',
  windows,
  () => {
    const result = JSON.parse(
      powershell(`
$script:first = Microsoft.PowerShell.Core\\Get-Command node.exe -CommandType Application | Select-Object -First 1
$script:second = Microsoft.PowerShell.Core\\Get-Command cmd.exe -CommandType Application | Select-Object -First 1
function Get-Command {
  param($Name, $CommandType, $ErrorAction)
  return @($script:first, $script:second)
}
$resolved = Get-EndaxisNodePath -Root ${psString(path.resolve(__dirname, '../..'))}
@{ path = $resolved; first = $script:first.Source; count = @($resolved).Count; isString = $resolved -is [string]; applicationInfos = ($script:first -is [System.Management.Automation.ApplicationInfo]) -and ($script:second -is [System.Management.Automation.ApplicationInfo]) } | ConvertTo-Json -Compress
`),
    );
    assert.equal(result.applicationInfos, true);
    assert.equal(result.path, result.first);
    assert.equal(result.count, 1);
    assert.equal(result.isString, true);
  },
);

test('missing Node is reported before spawning an application', windows, () => {
  fixture(root => {
    const result = JSON.parse(
      powershell(`
$script:alert = $null
function Get-EndaxisNodePath { param($Root); throw 'Node.js was not found.' }
function Start-Process { throw 'No process should start without Node.' }
function Show-EndaxisLaunchFailure { param($Message); $script:alert = $Message }
$code = Invoke-EndaxisDesktopLauncher -Root ${psString(root)} -LogRoot ${psString(path.join(root, 'logs'))}
@{ code = $code; alert = $script:alert } | ConvertTo-Json -Compress
`),
    );
    assert.equal(result.code, 1);
    assert.match(result.alert, /Node.js was not found/);
    assert.match(result.alert, /Logs: /);
  });
});
