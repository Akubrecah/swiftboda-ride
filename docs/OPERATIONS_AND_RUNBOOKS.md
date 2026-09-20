# Operations, Runbooks & Disaster Recovery Guide
## Swift Boda Site Reliability Engineering (SRE) Manual

### 1. Incident Escalation & Response Workflow
When an incident is detected (e.g. API latency > 500ms, Redis connection drop, or SOS alert spike):

```
┌────────────────────────┐
│  Incident Detected     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ PagerDuty / Ops Alert  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐      Is Database Healthy?      ┌────────────────────────┐
│  SRE On-Call Assigned   ├───────────────────────────────►│ Check Primary / Replica │
└───────────┬────────────┘               YES              └───────────┬────────────┘
            │ NO                                                      │
            ▼                                                         ▼
┌────────────────────────┐                                ┌────────────────────────┐
│ Failover to Replica DB │                                │ Is Redis Geohash Live? │
└────────────────────────┘                                └────────────────────────┘
```

---

### 2. High Availability & Multi-Region Setup
- **99.99% Availability Target**: Active-Active multi-AZ Kubernetes deployment across 3 availability zones.
- **Circuit Breaker Pattern**: Automatic fallback to cash payments and simplified fare calculation if external payment providers experience timeouts (>3s).
- **Disaster Recovery RPO & RTO**:
  - **Recovery Point Objective (RPO)**: &lt; 1 minute (Write-ahead logs streaming to S3/GCS).
  - **Recovery Time Objective (RTO)**: &lt; 5 minutes (Automated Kubernetes cluster failover via Terraform).

---

### 3. SRE Runbook: Database Connection Spike & Latency Troubleshooting
1. **Check Active PostgreSQL Connections**:
   `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`
2. **Flush Redis Spatial Cache**:
   `redis-cli SCRIPT FLUSH`
3. **Trigger Zero-Downtime Blue/Green Pod Rollout**:
   `kubectl rollout restart deployment/swiftboda-gateway-deployment -n production`
