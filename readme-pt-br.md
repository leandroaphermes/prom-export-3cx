# Prometheus Exporter for 3CX

Este projeto é um Exporter para Prometheus que coleta métricas do sistema 3CX, permitindo monitoramento e análise através de ferramentas como Grafana.  
Ele foi projetado para funcionar com a versão 20 ou superior do 3CX e utiliza a API do 3CX para coletar dados e expô-los em um formato que o Prometheus possa consumir.

## Recursos
- Coleta diversas métricas do sistema 3CX.
- Expõe métricas em um formato compatível com Prometheus.
- Fácil implantação usando Docker.
- Suporte para 3CX versão 20 ou superior.
- Métricas detalhadas sobre chamadas ativas, extensões registradas, uso de disco e muito mais.
- Integração simples com ferramentas de monitoramento como Grafana.

## Pré-requisitos
- **Docker** instalado no sistema.
- **Servidor 3CX** na versão 20 ou superior.
- Credenciais de administrador do 3CX (extensão e senha).

## Como Iniciar

### 1. Executar o container
Execute o seguinte comando para iniciar o Exporter:

```bash
docker run -p 3000:3000 \
  -e "PABX_URL=https://my3cx.my3cx.com/" \
  -e "PABX_RAMALID=0050" \
  -e "PABX_RAMALPASS=change-me" \
  hamarobr/prom-export-3cxv20
```

- Substitua `my3cx.my3cx.com` pela URL do seu servidor 3CX.
- Substitua `0050` pelo ID da extensão do administrador do sistema.
- Substitua `change-me` pela senha da extensão.

### 2. Verificar os logs
Use o comando abaixo para acompanhar os logs do container:

```bash
docker logs -f <container_id>
```

### 3. Acessar as métricas
Abra o navegador e acesse `http://localhost:3000/metrics` para visualizar as métricas expostas.

### 4. Verificar o healthcheck
Para verificar o status de saúde do Exporter, acesse `http://localhost:3000/health`.  
Se tudo estiver funcionando corretamente, você verá a mensagem `OK`.

## Métricas Capturadas

As seguintes métricas são coletadas e expostas pelo Exporter:

- **active_calls_total**: Total de chamadas ativas.
- **trunk_calls_total**: Total de chamadas por tronco.
- **registered_extensions_total**: Número de extensões registradas.
- **total_extensions**: Número total de extensões configuradas.
- **registered_trunks_total**: Número de troncos registrados.
- **total_trunks**: Número total de troncos configurados.
- **max_simultaneous_total**: Número máximo de chamadas simultâneas permitido pela licença.
- **disk_usage_percentage_total**: Porcentagem de uso do disco.
- **disk_usage_recording_percentage_total**: Porcentagem de uso do disco para gravações.
- **disk_usage_chat_total**: Porcentagem de uso do disco para chats.
- **disk_usage_log_total**: Porcentagem de uso do disco para logs.
- **system_info**: Informações do sistema (versão, sistema operacional, IP, FQDN).

## Exemplo de Integração com Grafana

1. Configure o Prometheus para coletar as métricas do Exporter adicionando o seguinte ao seu arquivo `prometheus.yml`:

   ```yaml
   scrape_configs:
     - job_name: "promexport3cx"
       static_configs:
         - targets: ["localhost:3000"]
   ```

2. No Grafana, adicione o Prometheus como fonte de dados e crie dashboards personalizados para visualizar as métricas do 3CX.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

## Contato

Se você tiver dúvidas ou sugestões, entre em contato através do repositório oficial ou abra uma issue.

## Notas Adicionais
- Certifique-se de que o servidor 3CX esteja acessível a partir do ambiente onde o Exporter está sendo executado.
- Para ambientes de produção, considere usar variáveis de ambiente seguras para armazenar credenciais.
