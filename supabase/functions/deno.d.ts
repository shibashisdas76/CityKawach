/// <reference lib="dom" />

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export type SupabaseClient<Database = any> = {
    from(relation: string): any;
    schema(schema: string): any;
    rpc(fn: string, args?: any): any;
    auth: any;
    storage: any;
    functions: any;
  };

  export function createClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): SupabaseClient<Database>;
}

declare module "https://esm.sh/@supabase/supabase-js*" {
  export type SupabaseClient<Database = any> = {
    from(relation: string): any;
    schema(schema: string): any;
    rpc(fn: string, args?: any): any;
    auth: any;
    storage: any;
    functions: any;
  };

  export function createClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): SupabaseClient<Database>;
}

declare module "npm:@supabase/supabase-js@2" {
  export type SupabaseClient<Database = any> = {
    from(relation: string): any;
    schema(schema: string): any;
    rpc(fn: string, args?: any): any;
    auth: any;
    storage: any;
    functions: any;
  };

  export function createClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): SupabaseClient<Database>;
}

declare module "npm:@supabase/supabase-js*" {
  export type SupabaseClient<Database = any> = {
    from(relation: string): any;
    schema(schema: string): any;
    rpc(fn: string, args?: any): any;
    auth: any;
    storage: any;
    functions: any;
  };

  export function createClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): SupabaseClient<Database>;
}






