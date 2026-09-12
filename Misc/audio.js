const { execFile } = require("child_process");

const powershellScript = `
$source = @'
using System;
using System.Runtime.InteropServices;

[ComImport]
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumerator { }

[ComImport]
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
}

[ComImport]
[Guid("D666063F-1587-4E43-81F1-B948E807363F")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid id, int context, IntPtr parameters, out IAudioEndpointVolume volume);
}

[ComImport]
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int RegisterControlChangeNotify(IntPtr notify);
  int UnregisterControlChangeNotify(IntPtr notify);
  int GetChannelCount(out uint count);
  int SetMasterVolumeLevel(float level, Guid context);
  int SetMasterVolumeLevelScalar(float level, Guid context);
  int GetMasterVolumeLevel(out float level);
  int GetMasterVolumeLevelScalar(out float level);
}
'@
Add-Type -TypeDefinition $source

$enumerator = New-Object MMDeviceEnumerator
$enumerator = [IMMDeviceEnumerator]$enumerator
$device = $null
$enumerator.GetDefaultAudioEndpoint(0, 1, [ref]$device) | Out-Null
$interfaceId = [Guid]::Parse("5CDF2C82-841E-4546-9722-0CF74078229A")
$volume = $null
$device.Activate([ref]$interfaceId, 23, [IntPtr]::Zero, [ref]$volume) | Out-Null

if ($env:DESKPLAY_AUDIO_OPERATION -eq "set") {
  $value = [Math]::Max(0, [Math]::Min(100, [int]$env:DESKPLAY_AUDIO_VALUE))
  $volume.SetMasterVolumeLevelScalar($value / 100.0, [Guid]::Empty) | Out-Null
}

$current = 0.0
$volume.GetMasterVolumeLevelScalar([ref]$current) | Out-Null
Write-Output (@{ value = [Math]::Round($current * 100) } | ConvertTo-Json -Compress)
`;

function runAudioCommand(operation, value) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", powershellScript],
      {
        windowsHide: true,
        env: {
          ...process.env,
          DESKPLAY_AUDIO_OPERATION: operation,
          DESKPLAY_AUDIO_VALUE: value === undefined ? "" : String(value),
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }

        try {
          const jsonLine = stdout
            .trim()
            .split(/\r?\n/)
            .reverse()
            .find((line) => line.trim().startsWith("{"));
          resolve(JSON.parse(jsonLine).value);
        } catch (parseError) {
          reject(parseError);
        }
      },
    );
  });
}

module.exports = {
  getVolume: () => runAudioCommand("get"),
  setVolume: (value) => runAudioCommand("set", value),
};
