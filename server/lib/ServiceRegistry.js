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

    const activeCandidates = candidates.filter((service) => service.active);
    let selected = activeCandidates[Math.floor(Math.random() * activeCandidates.length)];

    if (!selected) selected = candidates[Math.floor(Math.random() * candidates.length)];

    return selected;

    /*
      I honestly dont see caching concern (on the main App) as a valid concern for selecting passive 
      services details in the absence of all active one for main App to be able to at least fetch its cache 
      Anyways, priority has been given to the active ones, so no loss and perhaps small gain in resiliency
    */
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
        active: true,
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
      // delete this.services[key];
      // this.log.debug(`Removed service ${name}, version ${version} at ${ip}:${port}`);
      this.services[key].active = false;
      this.log.debug(`Service ${name}, version ${version} at ${ip}:${port} went down`);
    }
    return key;
  }

  async cleanup() {
    const now = Math.floor(new Date() / 1000);

    Object.keys(this.services).map((key) => {
      if (this.services[key].active && this.services[key].timestamp + this.timeout < now) {
        // delete this.services[key];
        // this.log.debug(`Removed service ${key}`);
        this.services[key].active = false;
        this.log.debug(`Service ${key} went down`);
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

/*
 Dont remove service permanently but rather make them inactive 
 Reason: Discoverability; their ip&port still need to be discovered so corresonding cache can be queried on the main App
*/
