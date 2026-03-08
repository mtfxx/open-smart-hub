# Docker Services

## Services

| Service    | Port | Description |
|-----------|------|-------------|
| Mosquitto | 1883 | MQTT Broker |
| Mosquitto | 9001 | MQTT over WebSocket |
| InfluxDB  | 8086 | Time-series DB (energy data) |
| PostgreSQL| 5432 | Relational DB (devices, automations) |

## Start

```bash
cd docker
docker compose up -d
```

## Stop

```bash
docker compose down
```

## InfluxDB UI
Open http://localhost:8086
- Username: admin
- Password: smarthub2026

## MQTT Test
```bash
# Subscribe to all Zigbee topics
mosquitto_sub -h localhost -t "zigbee2mqtt/#" -v

# Publish test message
mosquitto_pub -h localhost -t "zigbee2mqtt/test" -m "hello"
```
