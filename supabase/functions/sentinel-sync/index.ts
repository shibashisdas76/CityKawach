import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    // Initialize Supabase with Service Role to bypass RLS for system sync
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        const res = await fetch("http://<host>/api/ingest");
        const catalogue = await res.json();

        // Iterate and upsert the authoritative registry
        for (const cam of catalogue) {
            await supabase.from('cameras').upsert({
                camera_id: cam.id,
                camera_type: cam.codec === 'h265' ? 'HEVC_AI' : 'STANDARD',
                rtsp_url: cam.stream_properties?.rtsp_url || null,
                status: cam.live_status ? 'ONLINE' : 'OFFLINE',
            }, { onConflict: 'camera_id' });
        }

        return new Response(JSON.stringify({ success: true, count: catalogue.length }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});