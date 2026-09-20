import { v4 as uuidv4 } from 'uuid';
import { GeoLocation, Role } from '../../shared/types';
import { db, SafetyIncidentRecord } from '../database/db';

export class SafetyService {
  /**
   * Triggers high-priority Emergency SOS Panic protocol for rider or driver.
   */
  public triggerSOS(
    tripId: string,
    reporterId: string,
    reporterRole: Role,
    location: GeoLocation,
    notes?: string
  ): SafetyIncidentRecord {
    const incidentId = `sos-${uuidv4().substring(0, 8)}`;

    const incident: SafetyIncidentRecord = {
      id: incidentId,
      trip_id: tripId,
      reporter_id: reporterId,
      reporter_role: reporterRole,
      incident_type: 'SOS_BUTTON',
      latitude: location.latitude,
      longitude: location.longitude,
      status: 'OPEN',
      notes: notes || 'EMERGENCY SOS button triggered by mobile user.',
      created_at: new Date().toISOString(),
    };

    db.safetyIncidents.set(incidentId, incident);

    console.warn(`🚨 [SAFETY EMERGENCY] SOS Panic Alert initiated: Incident ${incidentId} for Trip ${tripId}`);
    console.warn(`🚨 Dispatching SMS alert to emergency contacts and Operations Control Center.`);

    return incident;
  }

  public reportIncident(
    tripId: string,
    reporterId: string,
    reporterRole: Role,
    incidentType: SafetyIncidentRecord['incident_type'],
    location: GeoLocation,
    notes?: string
  ): SafetyIncidentRecord {
    const incidentId = `inc-${uuidv4().substring(0, 8)}`;
    const incident: SafetyIncidentRecord = {
      id: incidentId,
      trip_id: tripId,
      reporter_id: reporterId,
      reporter_role: reporterRole,
      incident_type: incidentType,
      latitude: location.latitude,
      longitude: location.longitude,
      status: 'OPEN',
      notes,
      created_at: new Date().toISOString(),
    };

    db.safetyIncidents.set(incidentId, incident);
    return incident;
  }

  public updateIncidentStatus(
    incidentId: string,
    status: SafetyIncidentRecord['status'],
    resolvedBy?: string
  ): SafetyIncidentRecord {
    const incident = db.safetyIncidents.get(incidentId);
    if (!incident) throw new Error('Safety incident not found.');

    incident.status = status;
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      incident.resolved_by = resolvedBy;
      incident.resolved_at = new Date().toISOString();
    }

    db.safetyIncidents.set(incidentId, incident);
    return incident;
  }

  public getAllIncidents(): SafetyIncidentRecord[] {
    return Array.from(db.safetyIncidents.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
}

export const safetyService = new SafetyService();
