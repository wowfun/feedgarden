import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, posix, resolve, win32 } from 'node:path';
import { FdgError } from '../contracts/errors.js';

export interface InstancePaths {
  configDir: string;
  configFile: string;
  dataDir: string;
  stateDir: string;
  cacheDir: string;
  workspace?: string;
}
export interface Selection {
  workspace?: string;
  config?: string;
  dataDir?: string;
}
export function userPaths(
  options: {
    platform?: string;
    env?: NodeJS.ProcessEnv;
    home?: string;
    knownFolder?: (name: string) => string;
  } = {},
): InstancePaths {
  const platform = options.platform ?? process.platform,
    env = options.env ?? process.env,
    home = options.home ?? homedir();
  if (platform === 'win32') {
    const known =
      options.knownFolder ??
      ((name: string) =>
        execFileSync(
          'powershell.exe',
          [
            '-NoLogo',
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            '[Environment]::GetFolderPath("' + name + '")',
          ],
          { encoding: 'utf8', windowsHide: true, timeout: 10000 },
        ).trim());
    const absolute = (value: string | undefined): value is string =>
      !!value && /^(?:[a-z]:[\\/]|[\\/]{2}[^\\/]+[\\/][^\\/]+)/i.test(value);
    const folder = (key: string, name: string) => {
      let value = env[key];
      if (!absolute(value)) {
        try {
          value = known(name);
        } catch {
          value = '';
        }
      }
      if (!absolute(value))
        throw new FdgError('DIRECTORY_UNAVAILABLE', 'Cannot resolve Windows known folder: ' + name);
      return value;
    };
    const configDir = win32.join(folder('APPDATA', 'ApplicationData'), 'Feedgarden'),
      local = win32.join(folder('LOCALAPPDATA', 'LocalApplicationData'), 'Feedgarden');
    return {
      configDir,
      configFile: win32.join(configDir, 'feedgarden.jsonc'),
      dataDir: win32.join(local, 'Data'),
      stateDir: win32.join(local, 'State'),
      cacheDir: win32.join(local, 'Cache'),
    };
  }
  const xdg = (key: string, fallback: string) =>
    posix.join(
      env[key] && posix.isAbsolute(env[key]!) ? env[key]! : posix.join(home, fallback),
      'feedgarden',
    );
  const configDir = xdg('XDG_CONFIG_HOME', '.config');
  return {
    configDir,
    configFile: posix.join(configDir, 'feedgarden.jsonc'),
    dataDir: xdg('XDG_DATA_HOME', '.local/share'),
    stateDir: xdg('XDG_STATE_HOME', '.local/state'),
    cacheDir: xdg('XDG_CACHE_HOME', '.cache'),
  };
}
export function instancePaths(selection: Selection = {}, storage?: { dataDir?: string }): InstancePaths {
  if (selection.workspace && selection.config)
    throw new FdgError('BAD_INPUT', '--workspace and --config are mutually exclusive');
  let paths: InstancePaths;
  if (selection.workspace || selection.config) {
    const configFile = selection.config
      ? resolve(selection.config)
      : join(resolve(selection.workspace!), 'feedgarden.jsonc');
    let standard: InstancePaths | undefined;
    if (selection.config) {
      try {
        standard = userPaths();
      } catch (error) {
        if (!(error instanceof FdgError && error.code === 'DIRECTORY_UNAVAILABLE')) throw error;
      }
    }
    if (standard && resolve(standard.configFile) === configFile) paths = standard;
    else {
      const configDir = dirname(configFile),
        root = join(configDir, '.local', 'feedgarden');
      paths = {
        configDir,
        configFile,
        workspace: configDir,
        dataDir: join(root, 'data'),
        stateDir: join(root, 'state'),
        cacheDir: join(root, 'cache'),
      };
    }
  } else paths = userPaths();
  const override = selection.dataDir ?? storage?.dataDir;
  if (override) paths.dataDir = isAbsolute(override) ? resolve(override) : resolve(paths.configDir, override);
  return paths;
}
