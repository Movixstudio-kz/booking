export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
  onlineBookingEnabled: boolean;
  description: string;
};
