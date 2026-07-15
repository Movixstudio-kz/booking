import type { RepositoryContext, RepositoryResult } from "@/repositories/types";
import type { StaffSchedule } from "@/features/schedule/types";

export type ListAvailableSlotsParams = {
  staffId: string;
  date: string;
  slots: readonly string[];
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  excludeAppointmentId?: string;
  now?: Date;
};

export type ScheduleRepositorySubscriber = () => void;

export interface ScheduleRepository {
  list(context: RepositoryContext): Promise<RepositoryResult<StaffSchedule[]>>;
  getByStaffId(context: RepositoryContext, staffId: string): Promise<RepositoryResult<StaffSchedule>>;
  save(
    context: RepositoryContext,
    staffId: string,
    schedule: StaffSchedule,
  ): Promise<RepositoryResult<StaffSchedule>>;
  listAvailableSlots(
    context: RepositoryContext,
    params: ListAvailableSlotsParams,
  ): Promise<RepositoryResult<string[]>>;
  subscribe(subscriber: ScheduleRepositorySubscriber): () => void;
}
