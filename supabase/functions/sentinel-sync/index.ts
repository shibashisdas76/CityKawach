import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    // Initialize Supabase with Service Role to bypass RLS for system sync
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(JSON.stringify({ error: "Missing Supabase configuration environment variables." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});