import maintenanceApi from '../api/maintenanceApi';

export interface Maintenance {
  _id?: string;
  sectionId: any;
  title: string;
  description: string;
  type: 'Track' | 'Signal' | 'Bridge' | 'Station' | 'Electrification' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  startStation: string;
  endStation: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  actualStart?: Date | string;
  actualEnd?: Date | string;
  trackClosure: boolean;
  affectedTracks: number;
  speedRestriction?: number;
  crewCount: number;
  equipment: string[];
  estimatedDelayMinutes: number;
  notes?: string[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const maintenanceService = {
  // Get all maintenance works
  getAllMaintenances: async (filters?: any): Promise<Maintenance[]> => {
    return await maintenanceApi.getAll(filters);
  },

  // Get active maintenance works
  getActiveMaintenances: async (): Promise<Maintenance[]> => {
    return await maintenanceApi.getActive();
  },

  // Get maintenance by ID
  getMaintenanceById: async (id: string): Promise<Maintenance> => {
    return await maintenanceApi.getById(id);
  },

  // Create new maintenance
  createMaintenance: async (data: Partial<Maintenance>): Promise<Maintenance> => {
    return await maintenanceApi.create(data);
  },

  // Update maintenance
  updateMaintenance: async (id: string, data: Partial<Maintenance>): Promise<Maintenance> => {
    return await maintenanceApi.update(id, data);
  },

  // Start maintenance
  startMaintenance: async (id: string): Promise<Maintenance> => {
    return await maintenanceApi.start(id);
  },

  // Complete maintenance
  completeMaintenance: async (id: string): Promise<Maintenance> => {
    return await maintenanceApi.complete(id);
  },

  // Delete maintenance
  deleteMaintenance: async (id: string): Promise<void> => {
    return await maintenanceApi.delete(id);
  },

  // Seed sample data
  seedMaintenances: async (): Promise<{ message: string }> => {
    return await maintenanceApi.seed();
  }
};

export default maintenanceService;
