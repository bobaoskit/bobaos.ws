# bobaos.ws

Hello, friend.

Bobaos.ws is a service adding WebSocket support to bobaos datapoint sdk.

## Installation

Installation is performed via npm:

```text
sudo npm install -g bobaos.ws
```

Running:

```text
$ bobaos-ws
Starting bobaos.ws
To view real-time logs use following command:
$ myps-logviewer -c bobaos_ws
```

Create service file `/etc/systemd/system/bobaos_ws.service:

```text
[Unit]
Description=WebSocket server for bobaos.pub

[Service]
User=pi
ExecStart=/usr/bin/env bobaos-ws
Restart=on-failure
RestartSec=10
# now working dir.
WorkingDirectory=/run/myps

[Install]
WantedBy=multi-user.target
```

Reload systemd, start and enable daemon:

```text
sudo systemctl daemon-reload
sudo systemctl start bobaos_ws.service
sudo systemctl enable bobaos_ws.service
```

After that, `bobaos.ws` will use port, defined in `/usr/lib/node_modules/bobaos.ws/config.json`, by default it is 49190.

## Protocol

### Overview


Published messages to websocket are serialized JSON objects, containing required fields `request_id, method, payload`.
For broadcasted messages `request_id` field is not used.

For outgoing requests:

* `request_id` is used to receive response exactly to this request. If it is not defined then you will not receive response from server.
* `method` is an API method.
* `payload` depends on method. It may be datapoint id, array of ids, value, or null.

Request:

```json
{
  "request_id": 420,
  "method": "get parameter byte",
  "payload": [1,2,3,4]
}
```

Response:

```json
{
  "response_id":420,
  "method":"success",
  "payload":[1,3,5,7]
}
```

### API methods

| method          | payload       | description                                          |
|-----------------|---------------|------------------------------------------------------|
| ping            | null          | Check running state of bobaos.pub service            |
| get sdk state   | null          | Check if connected to BAOS                           |
| reset           | null          | Restart SDK. Reload datapoints/server items          |
| get description | null/id/array | Get description for datapoints. Use null to get all. |
| get value       | id/array      | Get value for single/multiple datapoints             |
|                 |               |                                                      |
|                 |               |                                                      |
|                 |               |                                                      |