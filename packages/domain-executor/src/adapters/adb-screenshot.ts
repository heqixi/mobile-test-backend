import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function adbBin(): string {
  return (
    process.env.ADB_PATH?.trim() ||
    process.env.MIDSCENE_ADB_PATH?.trim() ||
    'adb'
  );
}

export async function listAdbDevices(): Promise<string[]> {
  const { stdout } = await execFileAsync(adbBin(), ['devices']);
  return stdout
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.endsWith('\tdevice'))
    .map((line) => line.split('\t')[0]!);
}

export async function resolveAdbDeviceId(preferred?: string): Promise<string> {
  const devices = await listAdbDevices();
  if (devices.length === 0) {
    throw new Error('No Android device connected. Run `adb devices`.');
  }
  const wanted = preferred?.trim();
  if (wanted && devices.includes(wanted)) {
    return wanted;
  }
  return devices[0]!;
}

/** Fast path: adb exec-out screencap -p → base64 (no push/pull). */
export async function captureAdbScreenshotBase64(
  preferredDeviceId?: string,
): Promise<{ base64: string; deviceId: string }> {
  const deviceId = await resolveAdbDeviceId(preferredDeviceId);
  const { stdout } = await execFileAsync(
    adbBin(),
    ['-s', deviceId, 'exec-out', 'screencap', '-p'],
    { encoding: 'buffer', maxBuffer: 25 * 1024 * 1024 },
  );
  if (!stdout.length) {
    throw new Error(`Empty screenshot from device ${deviceId}`);
  }
  return { base64: stdout.toString('base64'), deviceId };
}

export function createScreenshotThrottle(minIntervalMs = 2000) {
  let lastAt = 0;
  let inFlight: Promise<{ base64: string; deviceId: string }> | null = null;
  let cached: { base64: string; deviceId: string; at: number } | null = null;

  return async (preferredDeviceId?: string) => {
    const now = Date.now();
    if (cached && now - cached.at < minIntervalMs) {
      return { base64: cached.base64, deviceId: cached.deviceId, capturedAt: new Date(cached.at).toISOString() };
    }
    if (inFlight) {
      const result = await inFlight;
      return { ...result, capturedAt: new Date().toISOString() };
    }
    const wait = Math.max(0, minIntervalMs - (now - lastAt));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    inFlight = captureAdbScreenshotBase64(preferredDeviceId)
      .then((result) => {
        cached = { ...result, at: Date.now() };
        lastAt = cached.at;
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
    const result = await inFlight;
    return { ...result, capturedAt: new Date().toISOString() };
  };
}
