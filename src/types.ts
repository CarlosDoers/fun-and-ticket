export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'guide' | 'user';
  created_at: string;
};

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type POI = Coordinate & {
  title: string;
  description: string;
};

export type RouteData = {
  waypoints: Coordinate[];
  pois: POI[];
};

export type Tour = {
  id: string;
  name: string;
  description: string;
  route_data: RouteData; // JSONB for coordinates
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
