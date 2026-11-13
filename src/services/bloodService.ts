import { BloodRequest, Donor, OrganRequest } from '../types';
import { AppDataStore } from './store';

export class BloodService {
  static getBloodRequests(status?: string): BloodRequest[] {
    let list = AppDataStore.getBloodRequests();
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createBloodRequest(data: {
    requesterProfileId: string;
    patientName: string;
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    unitsRequired: number;
    hospitalName: string;
    city: string;
    contactPhone: string;
    urgency: 'normal' | 'urgent' | 'critical_stat';
  }): { success: boolean; message: string; request?: BloodRequest } {
    const list = AppDataStore.getBloodRequests();
    const newReq: BloodRequest = {
      id: 'br_' + Date.now(),
      requesterProfileId: data.requesterProfileId,
      patientName: data.patientName,
      bloodGroup: data.bloodGroup,
      unitsRequired: data.unitsRequired,
      hospitalName: data.hospitalName,
      city: data.city,
      contactPhone: data.contactPhone,
      urgency: data.urgency,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    AppDataStore.setBloodRequests([newReq, ...list]);

    // Broadcast notification to matching registered donors
    const donors = AppDataStore.getDonors();
    const matchingDonors = donors.filter(
      (d) => d.isAvailableForBlood && (d.bloodGroup === data.bloodGroup || d.bloodGroup === 'O-')
    );

    const notifs = AppDataStore.getNotifications();
    const newNotifs = matchingDonors.map((d) => ({
      id: 'not_' + Date.now() + Math.random().toString(36).substring(7),
      recipientProfileId: d.profileId,
      title: `Urgent Blood Need: ${data.bloodGroup} in ${data.city}`,
      message: `${data.unitsRequired} units needed at ${data.hospitalName}. Can you help?`,
      type: 'blood_request' as const,
      actionPath: '/donor/requests',
      isRead: false,
      createdAt: new Date().toISOString(),
    }));

    if (newNotifs.length > 0) {
      AppDataStore.setNotifications([...newNotifs, ...notifs]);
    }

    return {
      success: true,
      message: `Emergency blood request for ${data.bloodGroup} broadcasted to ${matchingDonors.length} matching donor(s).`,
      request: newReq,
    };
  }

  static acceptBloodRequest(
    requestId: string,
    donorId: string,
    donorName?: string
  ): { success: boolean; message: string } {
    const list = AppDataStore.getBloodRequests();
    const req = list.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const updated = list.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'matched' as const,
          matchedDonorId: donorId,
          matchedDonorName: donorName || 'Verified Donor',
        };
      }
      return r;
    });

    AppDataStore.setBloodRequests(updated);

    // Notify requester
    const notifs = AppDataStore.getNotifications();
    AppDataStore.setNotifications([
      {
        id: 'not_' + Date.now(),
        recipientProfileId: req.requesterProfileId,
        title: 'Blood Donor Matched!',
        message: `${donorName || 'A registered donor'} has accepted the request for ${req.patientName} at ${req.hospitalName}.`,
        type: 'blood_request',
        actionPath: '/patient/blood-help',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...notifs,
    ]);

    return { success: true, message: 'Thank you! The hospital and requester have been notified of your commitment.' };
  }

  static registerOrganPledge(
    donorId: string,
    organTypes: string[],
    contactConsent: boolean
  ): { success: boolean; message: string } {
    const donors = AppDataStore.getDonors();
    const updated = donors.map((d) => {
      if (d.id === donorId) {
        return {
          ...d,
          organPledgeRegistered: true,
          organPledgeTypes: organTypes,
          contactSharingConsent: contactConsent,
        };
      }
      return d;
    });

    AppDataStore.setDonors(updated);
    return { success: true, message: 'Your organ donor pledge has been recorded in the CareBridge Registry.' };
  }
}
