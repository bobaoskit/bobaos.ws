# bobaos.ws

Hello, friend.

Bobaos.ws is a service adding WebSocket support to bobaos datapoint sdk.

## Installation

First, make sure that [bobaos.pub](https://github.com/bobaoskit/bobaos.pub) is installed.

Then, installation is performed via npm:

```text
sudo npm install -g bobaos.ws
```

You can run it:

```text
pi@pi:~$ bobaos-ws
Starting bobaos.ws
bobaos sdk: ready
```

Try to send from any websocket client following request on port 49190

```json
{"request_id": 42, "method": "ping", "payload": null}
```

If everything is ok, create service file `/etc/systemd/system/bobaos_ws.service:

```text
[Unit]
Description=WebSocket server for bobaos.pub
After=bobaos_pub.service

[Service]
User=pi
ExecStart=/usr/bin/env bobaos-ws
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Reload systemd, start and enable daemon:

```text
sudo systemctl daemon-reload
sudo systemctl start bobaos_ws.service
sudo systemctl enable bobaos_ws.service
```

After that, to configure `bobaos.ws` edit `/usr/lib/node_modules/bobaos.ws/config.json` file.

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

* Method: `ping`. Payload: `null`. 

    Returns `true/false` depending on running state of bobaos.pub service.
    
* Method: `get sdk state`. Payload: `null`.
    
    Check if connected to BAOS.

* Method: `reset`. 

    Restart SDK. Reload datapoints/server items.

* Method: `get description`. Payload: `null/id/[id1, .. idN]`.

    Get description for datapoints with given ids. If payload is null then description for all datapoints will be returned.
   
* Method: `get value`. Payload: `id/[id1, .. idN]`.

    Get value for datapoints with given ids.
    
* Method: `get stored value`. Payload: `id/[id1, .. idN]`.

    Get value stored in bobaos.pub service. Do not send any data via UART.
    
* Method: `set value`. Payload: `{id: i, value: v}/[{id: i1, value: v1}, .. {id: iN, value: vN}]`

    Set datapoints value and send to bus. Keep in mind that after successful request, new datapoint value will be broadcasted to all websocket clients, including sender.
    
* Method: `read value`. Payload: `id/[id1, .. idN]`.

    Send read requests to KNX bus. Keep in mind that datapoint object should have active Update flag.
    If reading was successful then datapoint value will be broadcasted.
    
* Method: `get server item`. Payload: `null/id/[id1, .. idN]`.

    Get server items with given id/name/names. To get all server items use `null` as a payload.
    
* Method: `set programming mode`. Payload: `1/0/true/false`.

    Send to BAOS request to go into programming mode.
    
* Method: `get programming mode`. Payload: `null`.

    Return current value of ProgrammingMode sever item.
    
* Method: `get parameter byte`. Payload: `id/[id1, .. idN]`.

    Get parameter byte values for given ids.
    
### Communication example

```text
{"request_id": 42, "method": "ping", "payload": null}
{"response_id":42,"method":"success","payload":true}
{"request_id": 42, "method": "get sdk state", "payload": null}
{"response_id":42,"method":"success","payload":"ready"}
{"request_id": 42, "method": "reset", "payload": null}
{"method":"sdk state","payload":"stop"}
{"method":"sdk state","payload":"ready"}
{"response_id":42,"method":"success","payload":null}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"request_id": 42, "method": "get description", "payload": 1}
{"response_id":42,"method":"success","payload":{"id":1,"length":2,"flags":{"priority":"low","communication":true,"read":false,"write":true,"readOnInit":false,"transmit":true,"update":true},"dpt":"dpt9"}}
{"method":"datapoint value","payload":{"id":1,"value":26,"raw":[13,20]}}
{"request_id": 42, "method": "get value", "payload": 1}
{"response_id":42,"method":"success","payload":{"id":1,"value":26,"raw":[13,20]}}
{"request_id": 42, "method": "get value", "payload": [1, 107]}
{"response_id":42,"method":"success","payload":[{"id":1,"value":26,"raw":[13,20]},{"id":107,"value":true,"raw":[1]}]}
{"request_id": 42, "method": "get stored value", "payload": [1, 107]}
{"response_id":42,"method":"success","payload":[{"id":1,"value":26,"raw":[13,20]},{"id":107,"value":true,"raw":[1]}]}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"request_id": 42, "method": "set value", "payload": {"id": 101, "value": true}}
{"response_id":42,"method":"success","payload":{"id":101,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":101,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":43,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"request_id": 42, "method": "set value", "payload": [{"id": 101, "value": false}, {"id": 102, "value": 1}]}
{"method":"datapoint value","payload":{"id":43,"value":false,"raw":[0]}}
{"method":"datapoint value","payload":{"id":105,"value":false,"raw":[0]}}
{"method":"datapoint value","payload":{"id":106,"value":true,"raw":[1]}}
{"response_id":42,"method":"success","payload":[{"id":101,"value":false,"raw":[0]},{"id":102,"value":true,"raw":[1]}]}
{"method":"datapoint value","payload":[{"id":101,"value":false,"raw":[0]},{"id":102,"value":true,"raw":[1]}]}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"request_id": 42, "method": "set value", "payload": [{"id": 101, "value": 1}, {"id": 102, "value": 0}]}
{"method":"datapoint value","payload":{"id":43,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":105,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":106,"value":false,"raw":[0]}}
{"response_id":42,"method":"success","payload":[{"id":101,"value":true,"raw":[1]},{"id":102,"value":false,"raw":[0]}]}
{"method":"datapoint value","payload":[{"id":101,"value":true,"raw":[1]},{"id":102,"value":false,"raw":[0]}]}
{"method":"datapoint value","payload":{"id":1,"value":26.2,"raw":[13,30]}}
{"request_id": 42, "method": "read value", "payload": [1, 101, 107]}
{"response_id":42,"method":"success","payload":null}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"method":"datapoint value","payload":{"id":43,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":101,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":107,"value":true,"raw":[1]}}
{"request_id": 42, "method": "read value", "payload": [1, 102, 107]}
{"response_id":42,"method":"success","payload":null}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"method":"datapoint value","payload":{"id":102,"value":false,"raw":[0]}}
{"method":"datapoint value","payload":{"id":107,"value":true,"raw":[1]}}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"method":"datapoint value","payload":{"id":1,"value":26.1,"raw":[13,25]}}
{"request_id": 42, "method": "get server item", "payload": "SerialNumber"}
{"response_id":42,"method":"success","payload":{"id":8,"name":"SerialNumber","value":[0,197,1,1,142,183]}}
{"method":"datapoint value","payload":{"id":1,"value":26,"raw":[13,20]}}
{"request_id": 42, "method": "set programming mode", "payload": 1}
{"response_id":42,"method":"success","payload":{"id":15,"name":"ProgrammingMode","value":true}}
{"request_id": 42, "method": "get programming mode", "payload": null}
{"response_id":42,"method":"success","payload":true}
{"request_id": 42, "method": "set programming mode", "payload": false}
{"response_id":42,"method":"success","payload":{"id":15,"name":"ProgrammingMode","value":false}}
{"method":"datapoint value","payload":{"id":1,"value":25.9,"raw":[13,15]}}
{"request_id": 42, "method": "get programming mode", "payload": null}
{"response_id":42,"method":"success","payload":false}
{"request_id": 42, "method": "get parameter byte", "payload": [1, 2, 3, 4, 5]}
{"response_id":42,"method":"success","payload":[1,3,5,7,9]}
{"method":"datapoint value","payload":{"id":1,"value":25.9,"raw":[13,15]}}
``` 

