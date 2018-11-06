const EE = require("events");
const WebSocket = require("ws");

const config = require("../config.json");

let WS = params => {
  let self = new EE();
  //  WEBSOCKET PART
  const wss = new WebSocket.Server(params);

  // part where we keep connections  alive
  wss.on("connection", (ws, req) => {
    console.log("connected", req.connection.remoteAddress);
    ws.isAlive = true;
    ws.on("pong", _ => {
      ws.isAlive = true;
    });
    ws.on("message", message => {
      try {
        let parsed = JSON.parse(message);
        let hasRequestId = Object.prototype.hasOwnProperty.call(parsed, "request_id");
        let hasMethodField = Object.prototype.hasOwnProperty.call(parsed, "method");
        let hasPayloadField = Object.prototype.hasOwnProperty.call(parsed, "payload");
        if (!hasMethodField) {
          let dataToSend = {};
          dataToSend["response_id"] = parsed["request_id"];
          dataToSend["method"] = "error";
          dataToSend["payload"] = "Request should have method field";

          return ws.send(JSON.stringify(dataToSend));
        }
        if (!hasPayloadField) {
          let dataToSend = {};
          dataToSend["response_id"] = parsed["request_id"];
          dataToSend["method"] = "error";
          dataToSend["payload"] = "Request should have payload field";

          return ws.send(JSON.stringify(dataToSend));
        }
        // request should have request_id, response_channel, method and payload fields
        // otherwise there will be no response
        if (hasRequestId && hasMethodField && hasPayloadField) {
          // request id, request obj, request proxy to expose
          let request_id = parsed.request_id;
          let request = {
            method: parsed.method,
            payload: parsed.payload,
          };
          let requestProxy = new Proxy(request, {
            ownKeys: target => {
              return ["method", "payload",];
            },
            get: (obj, prop, receiver) => {
              if (prop === "method" || prop === "payload" || prop === "response_channel") {
                return obj[prop];
              }

              return null;
            }
          });

          let response = {};
          response.response_id = request_id;

          let sendResponse = _ => {

            let dataToSend = {};
            dataToSend["response_id"] = response["response_id"];
            dataToSend["method"] = response["method"];
            dataToSend["payload"] = response["payload"];

            return ws.send(JSON.stringify(dataToSend));
          };

          let responseProxy = new Proxy(response, {
            ownKeys: target => {
              return ["method", "payload"];
            },
            get: (obj, prop, receiver) => {
              // res.send(data);
              if (prop === "send") {
                return sendResponse;
              }
              if (prop === "method" || prop === "payload") {
                return obj[prop];
              }

              // we don't want to return other props and methods yet
              return null;
            },
            set: (obj, prop, value, receiver) => {
              if (prop === "method" || prop === "payload") {
                obj[prop] = value;
              }
            }
          });
          self.emit("request", requestProxy, responseProxy);
        }
      } catch (e) {
        console.log(`Request error: ${e.message}`);
        let dataToSend = {};
        dataToSend.method = "error";
        dataToSend.payload = e.message;
        ws.send(JSON.stringify(dataToSend));
      }
    });

  });

  const interval = setInterval(_ => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;

      return ws.ping();
    });
  }, 30000);

  self.broadcast = message => {
    wss.clients.forEach(ws => {
      ws.send(message);
    });
  };

  return self;
};

module.exports = WS;
