export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type POI = {
  id: string; // Added to match Supabase structure
  title: string;
  description: string;
  images?: string[];
  audio_url?: string | null; // URL to audio file
  latitude: number;
  longitude: number;
};

export type RouteData = {
  waypoints: Coordinate[];
  pois: POI[];
};

export type Tour = {
  id: string;
  name: string;
  description: string;
  route_data: RouteData; // JSONB in Supabase
  created_by: string;
  created_at: string;
  is_active: boolean;  // Added for soft delete/draft status
};

export type QR = {
  id: string;
  code: string;
  tour_id: string;
  created_at: string;
  is_active: boolean; 
  expires_at?: string | null; // Optional expiration date
};

export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'guide' | 'user';
  created_at: string;
};
