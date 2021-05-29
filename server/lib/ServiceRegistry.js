import { satisfies } from "semver";

export default class ServiceRegistry {
  constructor(log) {
    this.log = log;
    this.services = {};
    this.timeout = 30;
  }

  get({ name, version }) {
    const candidates = Object.values(this.services).filter(
      (c) => c.name === name && satisfies(c.version, version)
    );

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  register({ name, version, ip, port }) {
    const key = name + version + ip + port;

    if (!this.services[key]) {
      this.services[key] = {
        name,
        version,
        ip,
        port,
        timestamp: Math.floor(new Date() / 1000),
      };
      this.log.debug(`Added service ${name}, version ${version} at ${ip}:${port}`);
      return key;
    }

    this.services[key].timestamp = Math.floor(new Date() / 1000);
    this.log.debug(`Updated service ${name}, version ${version} at ${ip}:${port}`);
    return key;
  }

  unregister({ name, version, ip, port }) {
    const key = name + version + ip + port;
    if (this.services[key]) delete this.services[key];
    return key;
  }
}
