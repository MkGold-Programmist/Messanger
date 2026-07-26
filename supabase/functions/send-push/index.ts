import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const record = body?.record; 

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_KEY = Deno.env.get("ONESIGNAL_REST_KEY");

    if (!record || !record.recipient_id) {
      return new Response(
        JSON.stringify({ error: "No recipient_id found in record" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [record.recipient_id], 
        contents: { ru: record.text || "📷 Прикрепленный файл" },
        headings: { ru: "Новое сообщение" },
        data: { chatId: record.chat_id }
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});