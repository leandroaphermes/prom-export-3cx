# Prometheus Exporter for 3CX

This project is an Exporter for Prometheus that collects metrics from the 3CX system, enabling monitoring and analysis through tools like Grafana.  
It is designed to work with version 20 or higher of 3CX and uses the 3CX API to collect data and expose it in a format that Prometheus can consume.

## Features
- Collects various metrics from the 3CX system.
- Exposes metrics in a Prometheus-compatible format.
- Easy deployment using Docker.
- Support for 3CX version 20 or higher.
- Detailed metrics on active calls, registered extensions, disk usage, and more.
- Simple integration with monitoring tools like Grafana.

## Requirements
- **Docker** installed on the system.
- **3CX Server** version 20 or higher.
- 3CX administrator credentials (extension and password).

## Getting Started

### 1. Run the container
Run the following command to start the Exporter:

```bash
docker run -p 3000:3000 \
  -e "PABX_URL=https://my3cx.my3cx.com/" \
  -e "PABX_RAMALID=0050" \
  -e "PABX_RAMALPASS=change-me" \
  hamarobr/prom-export-3cxv20
```

- Replace `my3cx.my3cx.com` with your 3CX server URL.
- Replace `0050` with the role system administrator extension ID.
- Replace `change-me` with the extension password.

### 2. Check the logs
Use the following command to monitor the container logs:

```bash
docker logs -f <container_id>
```

### 3. Access the metrics
Open your browser and go to `http://localhost:3000/metrics` to view the exposed metrics.

### 4. Check the health status
To check the Exporter's health status, go to `http://localhost:3000/health`.  
If everything is working correctly, you will see the message `OK`.

## Collected Metrics

The following metrics are collected and exposed by the Exporter:

- **active_calls_total**: Total number of active calls.
- **trunk_calls_total**: Total number of calls per trunk.
- **registered_extensions_total**: Number of registered extensions.
- **total_extensions**: Total number of configured extensions.
- **registered_trunks_total**: Number of registered trunks.
- **total_trunks**: Total number of configured trunks.
- **max_simultaneous_total**: Maximum number of simultaneous calls allowed by the license.
- **disk_usage_percentage_total**: Disk usage percentage.
- **disk_usage_recording_percentage_total**: Disk usage percentage for recordings.
- **disk_usage_chat_total**: Disk usage percentage for chats.
- **disk_usage_log_total**: Disk usage percentage for logs.
- **system_info**: System information (version, operating system, IP, FQDN).

## Example Integration with Grafana

1. Configure Prometheus to collect metrics from the Exporter by adding the following to your `prometheus.yml` file:

   ```yaml
   scrape_configs:
     - job_name: "promexport3cx"
       static_configs:
         - targets: ["localhost:3000"]
   ```

2. In Grafana, add Prometheus as a data source and create custom dashboards to visualize 3CX metrics.

## Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

If you have questions or suggestions, contact us through the official repository or open an issue.

## Additional Notes
- Ensure that the 3CX server is accessible from the environment where the Exporter is running.
- For production environments, consider using secure environment variables to store credentials.