export type EntityId = string;
export type ISODateString = string;

export type Pagination = { page: number; pageSize: number; total: number };

export type AsyncState<T> =
  | { status: "idle"; data?: undefined; error?: undefined }
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: string };
