import { EmergencyProfile, EmergencyAccessToken, EmergencyAccessLog } from '../types';
import { AppDataStore } from './store';

export class EmergencyService {
  static getEmergencyProfile(patientId: string): EmergencyProfile {
    const profile = AppDataStore.getEmergencyProfile();
    return profile;
  }

  static updateEmergencyProfile(
    patientId: string,
    updates: Partial<EmergencyProfile>
  ): { success: boolean; message: string } {
    const current = AppDataStore.getEmergencyProfile();
    const updated: EmergencyProfile = {
      ...current,
      ...updates,
      patientId,
    };
    AppDataStore.setEmergencyProfile(updated);
    return { success: true, message: 'Emergency medical profile updated successfully.' };
  }

  static getActiveTokens(patientId: string): EmergencyAccessToken[] {
    const tokens = AppDataStore.getEmergencyTokens();
    const now = new Date().toISOString();
    return tokens.filter((t) => t.patientId === patientId && !t.isRevoked && t.expiresAt > now);
  }

  /**
   * Generates a revocable, temporary random token hash.
   * Never embeds private health data in the token string itself.
   */
  static generateToken(patientId: string, validDays: number = 30): EmergencyAccessToken {
    const tokens = AppDataStore.getEmergencyTokens();
    const tokenHash = 'cb_er_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
    const expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();

    const newToken: EmergencyAccessToken = {
      id: 'tok_' + Date.now(),
      patientId,
      tokenHash,
      expiresAt,
      isRevoked: false,
      createdAt: new Date().toISOString(),
    };

    AppDataStore.setEmergencyTokens([newToken, ...tokens]);

    // Record audit log
    const auditLogs = AppDataStore.getAuditLogs();
    AppDataStore.setAuditLogs([
      {
        id: 'aud_' + Date.now(),
        action: 'EMERGENCY_QR_TOKEN_GENERATED',
        entityType: 'emergency_token',
        entityId: newToken.id,
        details: { tokenHash: newToken.tokenHash, validDays, expiresAt },
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ]);

    return newToken;
  }

  static revokeToken(tokenId: string): { success: boolean; message: string } {
    const tokens = AppDataStore.getEmergencyTokens();
    const updated = tokens.map((t) => {
      if (t.id === tokenId) {
        return {
          ...t,
          isRevoked: true,
          revokedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    AppDataStore.setEmergencyTokens(updated);

    // Record audit log
    const auditLogs = AppDataStore.getAuditLogs();
    AppDataStore.setAuditLogs([
      {
        id: 'aud_' + Date.now(),
        action: 'EMERGENCY_TOKEN_REVOKED',
        entityType: 'emergency_token',
        entityId: tokenId,
        details: { revokedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ]);

    return { success: true, message: 'Emergency access token has been revoked. The QR code is now invalidated.' };
  }

  /**
   * Used by the public paramedic / ER view to securely retrieve minimum
   * essential data (blood group, critical allergies, contacts, emergency notes).
   * Logs access attempt with timestamp and client metadata.
   */
  static verifyAndAccessData(
    tokenHash: string,
    accessorContext?: { ip?: string; userAgent?: string; location?: string }
  ): {
    valid: boolean;
    reason?: string;
    data?: {
      patientName: string;
      patientIdentifier: string;
      bloodGroup: string;
      allergies: string[];
      chronicConditions: string[];
      primaryContact: { name: string; phone: string; relation: string };
      criticalNotes?: string;
      organDonor: boolean;
      activeMedications: string[];
    };
  } {
    const tokens = AppDataStore.getEmergencyTokens();
    const token = tokens.find((t) => t.tokenHash === tokenHash);

    if (!token) {
      return { valid: false, reason: 'Invalid or unknown emergency QR token.' };
    }
    if (token.isRevoked) {
      return { valid: false, reason: 'This emergency QR code has been revoked by the patient.' };
    }
    if (new Date(token.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: 'This emergency token has expired.' };
    }

    const emProfile = AppDataStore.getEmergencyProfile();
    const prescriptions = AppDataStore.getPrescriptions().filter((p) => p.patientId === token.patientId);
    const activeMeds = prescriptions.flatMap((p) => p.items.map((i) => `${i.medicationName} (${i.dosage})`));

    // Log the emergency access event
    const logs = AppDataStore.getEmergencyLogs();
    AppDataStore.setEmergencyLogs([
      {
        id: 'log_' + Date.now(),
        tokenId: token.id,
        patientId: token.patientId,
        accessedAt: new Date().toISOString(),
        accessorIp: accessorContext?.ip || '198.51.100.22',
        userAgent: accessorContext?.userAgent || navigator.userAgent,
        locationEstimate: accessorContext?.location || 'Emergency Responder Mobile Unit',
      },
      ...logs,
    ]);

    return {
      valid: true,
      data: {
        patientName: emProfile.patientName,
        patientIdentifier: emProfile.patientIdentifier,
        bloodGroup: emProfile.bloodGroup,
        allergies: emProfile.allergies,
        chronicConditions: emProfile.chronicConditions,
        primaryContact: {
          name: emProfile.primaryContactName,
          phone: emProfile.primaryContactPhone,
          relation: emProfile.primaryContactRelation,
        },
        criticalNotes: emProfile.criticalNotes,
        organDonor: emProfile.organDonorIndicator,
        activeMedications: activeMeds.slice(0, 5),
      },
    };
  }

  static getAccessLogs(patientId: string): EmergencyAccessLog[] {
    const logs = AppDataStore.getEmergencyLogs();
    return logs.filter((l) => l.patientId === patientId);
  }
}
