import scheduleApi from '../api/scheduleApi';

export interface Schedule {
  _id?: string;
  trainNumber: string;
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  dayOfWeek: string[];
  distanceFromOrigin: number;
  platform?: string;
  haltMinutes?: number;
}

export const scheduleService = {
  // Get all schedules
  getAllSchedules: async (): Promise<Schedule[]> => {
    return await scheduleApi.getAll();
  },

  // Get schedule for a specific train
  getSchedulesByTrain: async (trainNumber: string): Promise<Schedule[]> => {
    return await scheduleApi.getByTrain(trainNumber);
  },

  // Get schedule for a specific station
  getSchedulesByStation: async (stationCode: string): Promise<Schedule[]> => {
    return await scheduleApi.getByStation(stationCode);
  },

  // Create new schedule
  createSchedule: async (schedule: Schedule): Promise<Schedule> => {
    return await scheduleApi.create(schedule);
  },

  // Seed schedules with sample data
  seedSchedules: async (): Promise<{ message: string }> => {
    return await scheduleApi.seed();
  }
};

export default scheduleService;
