export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'guide' | 'user';
  created_at: string;
};

export type Coordinate = {
  latitude: number;
  longitude: number;
  time?: number; // timestamp for GPX based routes
};

export type POI = {
  id: string; // Now required as it's a DB entity
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  images?: string[];
  created_at?: string;
};

export type RouteData = {
  waypoints: Coordinate[];
  // Legacy POIs inside JSON (deprecated for editing, used for display if synced)
  pois?: POI[]; 
};

export type Tour = {
  id: string;
  name: string;
  description: string;
  route_data: RouteData; 
  created_by: string;
  created_at: string;
  // Resolved POIs from relation
  tour_pois?: (POI & { order: number })[];
};

export type QR = {
  id: string;
  code: string;
  tour_id: string;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
};
