const BobaosSub = require("bobaos.sub");
const Logger = require("myps.logger");
const WS = require("./lib/ws");

const config = require("./config.json");

let App = _ => {
  let _loggerConfig = {
    channel: config.logs.channel,
    source: "index.js"
  };

  if (config.logs.socketFile) {
    _loggerConfig.socketFile = config.logs.socketFile;
  }
  let logger = Logger(_loggerConfig);

  logger.on("error", e => {
    console.log(`Error with logger: ${e.message}`);
    setTimeout(logger.reconnect, config.logs.reconTimeout);
  });

  console.log("Starting bobaos.ws");

  setTimeout(_ => {
    console.log("To view real-time logs use following command:");
    console.log(`$ myps-logviewer -c ${config.logs.channel}`);
  }, 1000);

  let bobaos = BobaosSub(config.bobaos);

  let wss = WS(config.ws);

  bobaos.on("connect", _ => {
    logger.info("bobaos sdk: connected");
  });

  bobaos.on("error", e => {
    console.log(e);
  });

  bobaos.on("ready", _ => {
    logger.info("bobaos sdk: ready");
  });

  bobaos.on("datapoint value", payload => {
    logger.info("broadcasting datapoint value: ");
    logger.info(payload);
    let dataToSend = {};
    dataToSend.method = "datapoint value";
    dataToSend.payload = payload;
    wss.broadcast(JSON.stringify(dataToSend));
  });

  bobaos.on("server item", payload => {
    logger.info("broadcasted server item: ", payload);
    let dataToSend = {};
    dataToSend.method = "server item";
    dataToSend.payload = payload;
    wss.broadcast(JSON.stringify(dataToSend));
  });

  bobaos.on("sdk state", payload => {
    logger.info("broadcasted sdk state: ", payload);
    let dataToSend = {};
    dataToSend.method = "sdk state";
    dataToSend.payload = payload;
    wss.broadcast(JSON.stringify(dataToSend));
  });

  wss.on("request", async (req, res) => {
    logger.debug(req);
    if (req.method === "ping") {
      try {
        res.method = "success";
        res.payload = await bobaos.ping();
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get sdk state") {
      try {
        res.method = "success";
        res.payload = await bobaos.getSdkState();
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "reset") {
      try {
        res.method = "success";
        res.payload = await bobaos.reset();
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get description") {
      try {
        res.method = "success";
        res.payload = await bobaos.getDescription(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get value") {
      try {
        res.method = "success";
        res.payload = await bobaos.getValue(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get stored value") {
      try {
        res.method = "success";
        res.payload = await bobaos.getStoredValue(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "set value") {
      try {
        res.method = "success";
        res.payload = await bobaos.setValue(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "read value") {
      try {
        res.method = "success";
        res.payload = await bobaos.readValue(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get server item") {
      try {
        res.method = "success";
        res.payload = await bobaos.getServerItem(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "set programming mode") {
      try {
        res.method = "success";
        res.payload = await bobaos.setProgrammingMode(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get programming mode") {
      try {
        res.method = "success";
        res.payload = await bobaos.getProgrammingMode(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
    if (req.method === "get parameter byte") {
      try {
        res.method = "success";
        res.payload = await bobaos.getParameterByte(req.payload);
        res.send();
      } catch (e) {
        res.method = "error";
        res.payload = e.message;
        res.send();
      }
    }
  });
};

module.exports = App;
