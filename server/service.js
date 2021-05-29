const express = require("express");
import ServiceRegistry from "./lib/ServiceRegistry";

const service = express();

module.exports = (config) => {
  const log = config.log();
  const serviceRegistry = new ServiceRegistry(log);

  // Add a request logging middleware in development mode
  if (service.get("env") === "development") {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`);
      return next();
    });
  }

  // Put service
  service.put("/register/:servicename/:serviceversion/:serviceport", (req, res) => {
    const { servicename, serviceversion, serviceport } = req.params;
    const addr = req.socket.remoteAddress;
    const serviceip = addr.includes("::") ? `[${addr}]` : addr;

    const serviceKey = serviceRegistry.register({
      name: servicename,
      version: serviceversion,
      ip: serviceip,
      port: serviceport,
    });
    return res.json({ result: serviceKey });
  });

  // Unregister service
  service.delete("/delete/:servicename/:serviceversion/:serviceport", (req, res) => {
    const { servicename, serviceversion, serviceport } = req.params;
    const addr = req.socket.remoteAddress;
    const serviceip = addr.includes("::") ? `[${addr}]` : addr;

    const serviceKey = serviceRegistry.unregister({
      name: servicename,
      version: serviceversion,
      ip: serviceip,
      port: serviceport,
    });
    return res.json({ result: serviceKey });
  });

  // Find service
  service.get("/find/:servicename/:serviceversion", (req, res, next) => {
    const { servicename, serviceversion } = req.params;

    const service = serviceRegistry.get({ name: servicename, version: serviceversion });
    if (!service) return res.status(404).json({ result: `${servicename} not found` });

    return res.json(service);
  });

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500);
    // Log out the error to the console
    log.error(error);
    return res.json({
      error: {
        message: error.message || error,
      },
    });
  });
  return service;
};
