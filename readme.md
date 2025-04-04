# Prometheus Exporter for 3CX

This project is an Exporter for Prometheus that collects metrics from the 3CX system, enabling monitoring and analysis through tools like Grafana.
It is designed to work with 3CX version 20 or later. 
The exporter uses the 3CX API to gather data and expose it in a format that Prometheus can scrape.

## Features
- Collects various metrics from the 3CX system.
- Exposes metrics in a format compatible with Prometheus.
- Easy to deploy using Docker.
- Supports 3CX version 20 and later.
- Provides detailed metrics on active calls, registered extensions, disk usage, and more.
- Allows for easy integration with monitoring tools like Grafana.

## How to Start

1. **Run the container**:
  ```bash
  docker run -p 3000:3000 \
    -e "PABX_URL=https://my3cx.my3cx.com/" \
    -e "PABX_RAMALID=0050" \
    -e "PABX_RAMALPASS=change-me" \
    hamarobr/prom-export-3cxv20
  ```

  Replace `my3cx.my3cx.com` with your 3CX server URL, `0050` with your extension ID, and `change-me` with your extension password.

2. **Check the logs**:
  ```bash
  docker logs -f <container_id>
  ```
  This will show you the logs of the running container.

3. **Check the metrics**:
  Access `http://localhost:3000/metrics` to view the exposed metrics.

## Captured Metrics

- **active_calls_total**: Total active calls.
- **trunk_calls_total**: Total calls per trunk.
- **registered_extensions_total**: Number of registered extensions.
- **total_extensions**: Total number of configured extensions.
- **registered_trunks_total**: Number of registered trunks.
- **total_trunks**: Total number of configured trunks.
- **max_simultaneous_total**: Maximum number of simultaneous calls allowed by license.
- **disk_usage_percentage_total**: Disk usage percentage.
- **disk_usage_recording_percentage_total**: Disk usage percentage for recordings.
- **disk_usage_chat_total**: Disk usage percentage for chats.
- **disk_usage_log_total**: Disk usage percentage for logs.
- **system_info**: System information (version, OS, IP, FQDN).

## Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.

## Requirements
- Docker
- 3CX server version 20 or later


## License

This project is licensed under the [MIT License](LICENSE).
