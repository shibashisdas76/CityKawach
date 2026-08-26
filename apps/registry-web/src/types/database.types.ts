import { UserRole, CameraStatus, CameraType } from '@shared/types/cctv-metadata.contract';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          code: string;
          name: string;
          district: string;
          state: string;
          contact_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          district: string;
          state?: string;
          contact_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          department_id: string | null;
          badge_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          department_id?: string | null;
          badge_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      cameras: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: CameraType;
          status: CameraStatus;
          department_id: string;
          latitude: number;
          longitude: number;
          altitude: number;
          address: string | null;
          city: string;
          district: string;
          state: string;
          pincode: string | null;
          ip_address: string;
          mac_address: string;
          rtsp_url_template: string;
          resolution: string;
          frame_rate: number;
          codec: string;
          field_of_view_degrees: number;
          night_vision_distance_meters: number;
          ptz_support: boolean;
          uptime_percentage: number;
          tags: string[];
          installed_at: string;
          last_health_check_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cameras']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cameras']['Insert']>;
      };
      camera_health: {
        Row: {
          id: string;
          camera_id: string;
          timestamp: string;
          status: CameraStatus;
          latency_ms: number;
          packet_loss_rate: number;
          cpu_usage_percent: number;
          memory_usage_percent: number;
          storage_usage_percent: number;
          temperature_celsius: number;
          error_message: string | null;
        };
        Insert: Omit<Database['public']['Tables']['camera_health']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['camera_health']['Insert']>;
      };
      coverage_zones: {
        Row: {
          id: string;
          code: string;
          name: string;
          district: string;
          city: string;
          state: string;
          target_camera_density: number;
          area_sq_km: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coverage_zones']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['coverage_zones']['Insert']>;
      };
      gap_analysis: {
        Row: {
          id: string;
          zone_id: string;
          required_cameras: number;
          installed_cameras: number;
          online_cameras: number;
          vulnerability_deficit_index: number;
          tier: 'LOW_DEFICIT' | 'MEDIUM_DEFICIT' | 'HIGH_DEFICIT';
          calculated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gap_analysis']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['gap_analysis']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          timestamp: string;
          actor_id: string;
          actor_name: string;
          actor_role: UserRole;
          actor_department_id: string | null;
          action: string;
          target_entity: string;
          target_id: string;
          ip_address: string;
          metadata_diff: Json;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id'> & { id?: string };
        Update: never; // Append-only
      };
    };
    Functions: {
      rpc_get_cameras_in_bbox: {
        Args: {
          min_lng: number;
          min_lat: number;
          max_lng: number;
          max_lat: number;
          target_dept?: string;
        };
        Returns: Database['public']['Tables']['cameras']['Row'][];
      };
      rpc_get_cameras_near_point: {
        Args: {
          center_lng: number;
          center_lat: number;
          radius_meters?: number;
        };
        Returns: {
          id: string;
          code: string;
          name: string;
          type: CameraType;
          status: CameraStatus;
          latitude: number;
          longitude: number;
          distance_meters: number;
        }[];
      };
      rpc_recalculate_zone_gaps: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
