import { satisfies } from "semver";

export default class ServiceRegistry {
  constructor(log) {
    this.log = log;
    this.services = {};
    this.timeout = 30;
  }

  get({ name, version }) {
    Promise.resolve(this.cleanup());
    const candidates = Object.values(this.services).filter(
      (service) => service.name === name && satisfies(service.version, version)
    );

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  register({ name, version, ip, port }) {
    Promise.resolve(this.cleanup());
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
    if (this.services[key]) {
      delete this.services[key];
      this.log.debug(`Removed service ${name}, version ${version} at ${ip}:${port}`);
    }
    return key;
  }

  async cleanup() {
    const now = Math.floor(new Date() / 1000);

    Object.keys(this.services).map((key) => {
      if (this.services[key].timestamp + this.timeout < now) {
        delete this.services[key];
        this.log.debug(`Removed service ${key}`);
      }
    });
  }
}

/**
 * So, the assumption is every service re-registers itself at a specified interval
 * in order to monitor service availability.
 *
 * So, there should be a cleanup function that frequently check for any service not noticed
 * after expected heartbeat interval i.e likely shut down services and deregister them.
 */
