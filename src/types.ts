export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'guide' | 'user';
  created_at: string;
};

export type Tour = {
  id: string;
  name: string;
  description: string;
  route_data: any; // JSONB for coordinates
  created_by: string;
  created_at: string;
};

export type QR = {
  id: string;
  code: string;
  tour_id: string;
  is_active: boolean;
  created_at: string;
};
