#!/bin/bash

# TipTap Monitoring Stack Test Script
# Tests all monitoring components and validates alert functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"
ALERTMANAGER_URL="http://localhost:9093"
PUSHGATEWAY_URL="http://localhost:9091"

echo -e "${BLUE}🚀 Starting TipTap Monitoring Stack Tests${NC}"

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local service_url="$2"
    local expected_status="$3"

    echo -e "\n${YELLOW}Testing ${service_name}...${NC}"

    if curl -s -o /dev/null -w "%{http_code}" "$service_url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ ${service_name} is running${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name} is not responding${NC}"
        return 1
    fi
}

# Function to test Prometheus queries
test_prometheus_queries() {
    echo -e "\n${YELLOW}Testing Prometheus queries...${NC}"

    # Test basic up query
    if curl -s "${PROMETHEUS_URL}/api/v1/query?query=up" | jq -r '.status' | grep -q "success"; then
        echo -e "${GREEN}✅ Basic Prometheus query working${NC}"
    else
        echo -e "${RED}❌ Basic Prometheus query failed${NC}"
        return 1
    fi

    # Test custom TipTap metrics (if they exist)
    queries=(
        "payment_attempts_total"
        "transaction_duration_seconds"
        "user_activity_total"
        "error_logs_total"
    )

    for query in "${queries[@]}"; do
        result=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=${query}" | jq -r '.data.result | length')
        if [ "$result" -gt 0 ]; then
            echo -e "${GREEN}✅ Metric ${query} found${NC}"
        else
            echo -e "${YELLOW}⚠️  Metric ${query} not found (may not have data yet)${NC}"
        fi
    done
}

# Function to test AlertManager
test_alertmanager() {
    echo -e "\n${YELLOW}Testing AlertManager...${NC}"

    # Check AlertManager API
    if curl -s "${ALERTMANAGER_URL}/api/v1/status" | jq -r '.status' | grep -q "success"; then
        echo -e "${GREEN}✅ AlertManager API responding${NC}"
    else
        echo -e "${RED}❌ AlertManager API not responding${NC}"
        return 1
    fi

    # Check active alerts
    active_alerts=$(curl -s "${ALERTMANAGER_URL}/api/v1/alerts" | jq -r '.data | length')
    echo -e "${BLUE}ℹ️  Active alerts: ${active_alerts}${NC}"
}

# Function to test Grafana
test_grafana() {
    echo -e "\n${YELLOW}Testing Grafana...${NC}"

    # Check Grafana health
    if curl -s "${GRAFANA_URL}/api/health" | jq -r '.database' | grep -q "ok"; then
        echo -e "${GREEN}✅ Grafana is healthy${NC}"
    else
        echo -e "${RED}❌ Grafana health check failed${NC}"
        return 1
    fi

    # Check datasources (requires admin credentials)
    echo -e "${BLUE}ℹ️  To fully test Grafana, ensure Prometheus datasource is configured${NC}"
}

# Function to send test metrics to PushGateway
test_pushgateway() {
    echo -e "\n${YELLOW}Testing PushGateway with sample metrics...${NC}"

    # Send test metric
    test_metric="test_monitoring_metric 1"
    if echo "$test_metric" | curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/test-monitoring/instance/test"; then
        echo -e "${GREEN}✅ Successfully sent test metric to PushGateway${NC}"

        # Verify metric was received
        sleep 2
        if curl -s "${PUSHGATEWAY_URL}/metrics" | grep -q "test_monitoring_metric"; then
            echo -e "${GREEN}✅ Test metric found in PushGateway${NC}"
        else
            echo -e "${RED}❌ Test metric not found in PushGateway${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to send test metric to PushGateway${NC}"
        return 1
    fi
}

# Function to test alert rules
test_alert_rules() {
    echo -e "\n${YELLOW}Testing Prometheus alert rules...${NC}"

    # Check if alert rules are loaded
    rules_response=$(curl -s "${PROMETHEUS_URL}/api/v1/rules")
    rules_count=$(echo "$rules_response" | jq -r '.data.groups | length')

    if [ "$rules_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Alert rules loaded (${rules_count} groups)${NC}"

        # List rule groups
        echo "$rules_response" | jq -r '.data.groups[].name' | while read -r group_name; do
            echo -e "${BLUE}  📋 Rule group: ${group_name}${NC}"
        done
    else
        echo -e "${RED}❌ No alert rules loaded${NC}"
        return 1
    fi
}

# Function to simulate alerts for testing
simulate_test_alerts() {
    echo -e "\n${YELLOW}Simulating test alerts...${NC}"

    # Create test metrics that should trigger alerts
    test_metrics=(
        'test_payment_failures{payment_method="test"} 10'
        'test_api_errors{endpoint="/test"} 5'
        'test_fraud_score 95'
    )

    for metric in "${test_metrics[@]}"; do
        echo "$metric" | curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/test-alerts/instance/test"
    done

    echo -e "${BLUE}ℹ️  Test metrics sent. Check AlertManager in a few minutes for test alerts.${NC}"
}

# Function to validate monitoring configuration
validate_config() {
    echo -e "\n${YELLOW}Validating monitoring configuration files...${NC}"

    config_files=(
        "./prometheus/prometheus.yml"
        "./alertmanager/alertmanager.yml"
        "./dashboards/dashboard-config.yaml"
        "./alerts/alert-rules.yaml"
    )

    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            echo -e "${GREEN}✅ Found: ${config_file}${NC}"
        else
            echo -e "${RED}❌ Missing: ${config_file}${NC}"
        fi
    done

    # Validate YAML syntax
    if command -v yamllint >/dev/null 2>&1; then
        for config_file in "${config_files[@]}"; do
            if [ -f "$config_file" ]; then
                if yamllint "$config_file" >/dev/null 2>&1; then
                    echo -e "${GREEN}✅ YAML syntax valid: ${config_file}${NC}"
                else
                    echo -e "${RED}❌ YAML syntax error: ${config_file}${NC}"
                fi
            fi
        done
    else
        echo -e "${YELLOW}⚠️  yamllint not installed, skipping YAML validation${NC}"
    fi
}

# Function to test network connectivity
test_network_connectivity() {
    echo -e "\n${YELLOW}Testing network connectivity...${NC}"

    # Test internal service communication
    services=(
        "prometheus:9090"
        "grafana:3000"
        "alertmanager:9093"
        "pushgateway:9091"
    )

    for service in "${services[@]}"; do
        service_name=$(echo "$service" | cut -d':' -f1)
        service_port=$(echo "$service" | cut -d':' -f2)

        if nc -z "$service_name" "$service_port" 2>/dev/null; then
            echo -e "${GREEN}✅ ${service_name}:${service_port} is reachable${NC}"
        else
            echo -e "${RED}❌ ${service_name}:${service_port} is not reachable${NC}"
        fi
    done
}

# Function to generate monitoring report
generate_report() {
    echo -e "\n${BLUE}📊 Generating Monitoring Health Report${NC}"

    report_file="monitoring-health-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "TipTap Monitoring Health Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo

        # Prometheus metrics
        echo "Prometheus Metrics:"
        curl -s "${PROMETHEUS_URL}/api/v1/label/__name__/values" | jq -r '.data[]' | head -20
        echo

        # Active alerts
        echo "Active Alerts:"
        curl -s "${ALERTMANAGER_URL}/api/v1/alerts" | jq -r '.data[] | .labels.alertname' || echo "No active alerts"
        echo

        # Service status
        echo "Service Status:"
        echo "Prometheus: $(curl -s -o /dev/null -w "%{http_code}" "$PROMETHEUS_URL" || echo "DOWN")"
        echo "Grafana: $(curl -s -o /dev/null -w "%{http_code}" "$GRAFANA_URL" || echo "DOWN")"
        echo "AlertManager: $(curl -s -o /dev/null -w "%{http_code}" "$ALERTMANAGER_URL" || echo "DOWN")"
        echo "PushGateway: $(curl -s -o /dev/null -w "%{http_code}" "$PUSHGATEWAY_URL" || echo "DOWN")"

    } > "$report_file"

    echo -e "${GREEN}✅ Report saved to: ${report_file}${NC}"
}

# Main test execution
main() {
    echo -e "${BLUE}Starting comprehensive monitoring tests...${NC}"

    # Check prerequisites
    if ! command -v curl >/dev/null 2>&1; then
        echo -e "${RED}❌ curl is required but not installed${NC}"
        exit 1
    fi

    if ! command -v jq >/dev/null 2>&1; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        exit 1
    fi

    # Run tests
    test_passed=0
    test_failed=0

    # Service availability tests
    check_service "Prometheus" "$PROMETHEUS_URL" "200" && ((test_passed++)) || ((test_failed++))
    check_service "Grafana" "$GRAFANA_URL" "200" && ((test_passed++)) || ((test_failed++))
    check_service "AlertManager" "$ALERTMANAGER_URL" "200" && ((test_passed++)) || ((test_failed++))
    check_service "PushGateway" "$PUSHGATEWAY_URL" "200" && ((test_passed++)) || ((test_failed++))

    # Functional tests
    test_prometheus_queries && ((test_passed++)) || ((test_failed++))
    test_alertmanager && ((test_passed++)) || ((test_failed++))
    test_grafana && ((test_passed++)) || ((test_failed++))
    test_pushgateway && ((test_passed++)) || ((test_failed++))
    test_alert_rules && ((test_passed++)) || ((test_failed++))

    # Configuration validation
    validate_config && ((test_passed++)) || ((test_failed++))

    # Network tests
    test_network_connectivity && ((test_passed++)) || ((test_failed++))

    # Optional: Simulate test alerts
    if [ "${1:-}" == "--simulate-alerts" ]; then
        simulate_test_alerts
    fi

    # Generate report
    generate_report

    # Summary
    echo -e "\n${BLUE}=========================================="
    echo -e "📊 TEST SUMMARY${NC}"
    echo -e "${GREEN}✅ Passed: $test_passed${NC}"
    echo -e "${RED}❌ Failed: $test_failed${NC}"

    if [ $test_failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All monitoring tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Check the output above.${NC}"
        exit 1
    fi
}

# Run main function with arguments
main "$@"