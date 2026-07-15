import type {
  BookingRecord,
  BookingStatus,
} from "@/features/booking/types";
import type {
  RepositoryContext,
  RepositoryResult,
} from "@/repositories/types";

export type AppointmentFilters = {
  staffId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus;
  statuses?: readonly BookingStatus[];
};

export type CreateAppointmentInput = Omit<
  BookingRecord,
  "id" | "createdAt"
> &
  Partial<Pick<BookingRecord, "id" | "createdAt">>;

export type UpdateAppointmentInput = Partial<
  Omit<BookingRecord, "id" | "createdAt">
>;

export interface AppointmentRepository {
  subscribe(subscriber: () => void): () => void;
  list(
    context: RepositoryContext,
    filters?: AppointmentFilters,
  ): Promise<RepositoryResult<BookingRecord[]>>;
  getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<BookingRecord>>;
  create(
    context: RepositoryContext,
    input: CreateAppointmentInput,
  ): Promise<RepositoryResult<BookingRecord>>;
  update(
    context: RepositoryContext,
    id: string,
    input: UpdateAppointmentInput,
  ): Promise<RepositoryResult<BookingRecord>>;
  updateStatus(
    context: RepositoryContext,
    id: string,
    status: BookingStatus,
  ): Promise<RepositoryResult<BookingRecord>>;
  delete(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<void>>;
  checkConflict(
    context: RepositoryContext,
    staffId: string,
    startAt: string,
    endAt: string,
    excludeAppointmentId?: string,
  ): Promise<RepositoryResult<boolean>>;
}
