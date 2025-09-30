import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskTitle, taskDescription, availableHours, taskId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Breaking down task:", taskTitle);

    // Call Lovable AI to break down the task
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em dividir tarefas complexas em subtarefas menores e gerenciáveis.
              
Dado uma tarefa e o tempo disponível, divida-a em 3-5 subtarefas específicas e acionáveis.
Para cada subtarefa, estime o tempo necessário em minutos de forma realista.
A soma dos tempos deve ser aproximadamente igual ao tempo total disponível.

Responda APENAS com um JSON array no seguinte formato:
[
  {"title": "Subtarefa 1", "estimated_minutes": 60},
  {"title": "Subtarefa 2", "estimated_minutes": 90}
]`,
            },
            {
              role: "user",
              content: `Tarefa: ${taskTitle}
${taskDescription ? `Descrição: ${taskDescription}` : ""}
Tempo disponível: ${availableHours} horas (${availableHours * 60} minutos)

Divida esta tarefa em subtarefas menores com estimativas de tempo realistas.`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log("AI response:", aiContent);

    // Parse the JSON response
    let subtasks: Array<{ title: string; estimated_minutes: number }>;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      subtasks = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI response");
    }

    // Create subtasks in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const subtasksToInsert = subtasks.map((subtask, index) => ({
      task_id: taskId,
      title: subtask.title,
      estimated_minutes: subtask.estimated_minutes,
      order_index: index,
    }));

    const { error: insertError } = await supabase
      .from("subtasks")
      .insert(subtasksToInsert);

    if (insertError) {
      console.error("Database error:", insertError);
      throw insertError;
    }

    // Update task total estimated time
    const totalEstimatedMinutes = subtasks.reduce(
      (sum, st) => sum + st.estimated_minutes,
      0
    );

    await supabase
      .from("tasks")
      .update({ total_estimated_minutes: totalEstimatedMinutes })
      .eq("id", taskId);

    return new Response(
      JSON.stringify({ success: true, subtasks: subtasksToInsert }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in break-down-task function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
