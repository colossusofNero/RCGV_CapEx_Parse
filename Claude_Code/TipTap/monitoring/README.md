# TipTap Production Monitoring Setup

This directory contains the complete monitoring configuration for TipTap's production environment, including dashboards, alerts, and metrics collection.

## 🏗️ Architecture Overview

The monitoring stack includes:

- **Prometheus**: Metrics collection and time-series database
- **Grafana**: Dashboard visualization and analytics
- **AlertManager**: Alert routing and notification management
- **PushGateway**: Mobile app metrics collection endpoint
- **Custom Services**: Monitoring service integration and mobile app hooks

## 📊 Dashboards

### 1. Payment Success Rates Dashboard
- Overall payment success rate monitoring
- Success rates by payment method (NFC/QR/Card/ACH)
- Payment method breakdown and trends
- Real-time payment failure detection

### 2. Transaction Performance Dashboard
- Average transaction processing times
- Transaction time percentiles (50th, 95th, 99th)
- Transaction time distribution heatmaps
- Performance bottleneck identification

### 3. User Activity & Tip Volume Dashboard
- Daily active users tracking
- Hourly tip volume and trends
- Tips distribution by amount ranges
- Geographic activity patterns

### 4. Error Monitoring Dashboard
- Application error rates by feature
- API response time monitoring
- Top error messages and frequency
- System health indicators

### 5. Geographic Distribution Dashboard
- User activity by location
- Transaction volume by region
- Peak hours analysis by geography
- Regional performance comparisons

## 🚨 Alert Configuration

### Critical Alerts (PagerDuty + Immediate Notification)
- **Payment Failure Rate > 5%**: Triggers within 2 minutes
- **API Response Time > 2 seconds**: 95th percentile monitoring
- **Server Error Rate > 1%**: Immediate escalation
- **Fraud Score Spike**: Real-time fraud detection
- **Low Balance < $1000**: Critical financial threshold

### Warning Alerts (Slack Notifications)
- **NFC Payment Latency > 3 seconds**
- **High CPU/Memory Usage**
- **Suspicious Transaction Patterns**
- **Business Metric Deviations**

### Business Alerts
- **Daily Active Users Below Threshold**
- **Significant Tip Volume Drops**
- **Regional Performance Issues**

## 🛠️ Setup Instructions

### 1. Prerequisites
```bash
# Required tools
- Docker & Docker Compose
- curl, jq (for testing)
- yamllint (optional, for config validation)
```

### 2. Environment Configuration
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your specific values:
# - Slack webhook URLs
# - PagerDuty service keys
# - SMTP settings
# - Database credentials
```

### 3. Start Monitoring Stack
```bash
# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 4. Configure Dashboards
```bash
# Import dashboard configurations to Grafana
# Access Grafana at http://localhost:3000
# Default credentials: admin/admin (change immediately)

# Dashboards are auto-provisioned from ./dashboards/
```

### 5. Verify Setup
```bash
# Run comprehensive monitoring tests
chmod +x ./scripts/test-monitoring.sh
./scripts/test-monitoring.sh

# Simulate test alerts (optional)
./scripts/test-monitoring.sh --simulate-alerts
```

## 📱 Mobile App Integration

### 1. Initialize Monitoring Service
```typescript
import { monitoringService } from './src/services/MonitoringService';

// Initialize with your metrics endpoint
await monitoringService.initialize({
  apiEndpoint: 'https://monitoring-api.tiptap.com',
  batchSize: 50,
  flushInterval: 30000
});
```

### 2. Use Monitoring Hooks
```typescript
import { useMonitoring } from './src/hooks/useMonitoring';

function PaymentScreen() {
  const { trackPayment, trackError, trackTiming } = useMonitoring({
    screenName: 'PaymentScreen'
  });

  const handlePayment = async (method: string, amount: number) => {
    trackPayment('attempt', method, amount);

    try {
      const result = await trackTiming('payment_process', async () => {
        return await processPayment(method, amount);
      });

      trackPayment('success', method, amount, {
        transactionId: result.id
      });
    } catch (error) {
      trackPayment('failure', method, amount, {
        reason: error.message
      });
      trackError(error, 'payment_processing');
    }
  };
}
```

### 3. Automatic Metrics Collection
The monitoring service automatically collects:
- Screen view analytics
- User interaction events
- Performance timing metrics
- Error tracking and stack traces
- Network request monitoring
- Device and app information

## 🔧 Configuration Files

### Dashboard Configuration (`dashboards/dashboard-config.yaml`)
Defines all Grafana dashboards with:
- Panel configurations
- Query definitions
- Visualization settings
- Alert thresholds

### Alert Rules (`alerts/alert-rules.yaml`)
Contains all alert definitions with:
- Alert conditions and thresholds
- Notification routing rules
- Escalation policies
- Recovery conditions

### Prometheus Config (`prometheus/prometheus.yml`)
Configures metrics collection:
- Scrape targets and intervals
- Recording rules for performance
- Remote storage configuration
- Service discovery settings

### AlertManager Config (`alertmanager/alertmanager.yml`)
Manages alert notifications:
- Notification channels (Slack, PagerDuty, Email, SMS)
- Routing rules and grouping
- Inhibition rules
- Template configurations

## 📈 Key Metrics

### Payment Metrics
- `payment_attempts_total`: Total payment attempts by method
- `payment_success_total`: Successful payments by method
- `payment_failures_total`: Failed payments with reasons
- `transaction_duration_seconds`: Payment processing time

### User Activity Metrics
- `user_activity_total`: User interactions by type
- `tip_amount_total`: Total tip amounts by region
- `transaction_count_total`: Transaction counts by status

### System Metrics
- `http_requests_total`: API request counts by endpoint
- `http_request_duration_seconds`: API response times
- `error_logs_total`: Application errors by feature
- `fraud_score_current`: Real-time fraud scores

### Business Metrics
- Daily active users
- Geographic distribution
- Peak usage patterns
- Revenue metrics

## 🚀 Accessing Services

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| AlertManager | http://localhost:9093 | - |
| PushGateway | http://localhost:9091 | - |

## 🔍 Troubleshooting

### Common Issues

1. **Metrics Not Appearing**
   ```bash
   # Check if mobile app is sending metrics
   curl http://localhost:9091/metrics | grep tiptap

   # Verify Prometheus is scraping
   curl http://localhost:9090/api/v1/targets
   ```

2. **Alerts Not Firing**
   ```bash
   # Check alert rule syntax
   curl http://localhost:9090/api/v1/rules

   # Verify AlertManager configuration
   curl http://localhost:9093/api/v1/status
   ```

3. **Dashboard Loading Issues**
   ```bash
   # Check Grafana logs
   docker logs tiptap-grafana

   # Verify Prometheus datasource
   curl -u admin:admin http://localhost:3000/api/datasources
   ```

### Testing Commands

```bash
# Send test metrics
echo 'test_metric 42' | curl --data-binary @- \
  http://localhost:9091/metrics/job/test/instance/local

# Query metrics directly
curl 'http://localhost:9090/api/v1/query?query=up'

# Check active alerts
curl http://localhost:9093/api/v1/alerts
```

## 📞 Support

For monitoring issues or questions:
- Slack: #infrastructure-alerts
- Email: devops@tiptap.com
- Documentation: https://docs.tiptap.com/monitoring

## 🔄 Updates and Maintenance

### Regular Tasks
- Review alert thresholds monthly
- Update dashboard queries based on new features
- Monitor metric cardinality and storage usage
- Test alert notification channels weekly

### Version Updates
- Monitor Prometheus/Grafana releases
- Test configuration changes in staging
- Update documentation for new features
- Backup configurations before upgrades

This monitoring setup provides comprehensive visibility into TipTap's production performance, user behavior, and system health, enabling proactive issue detection and rapid response to critical situations.