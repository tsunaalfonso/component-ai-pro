export type VisionAnalysis = {
  component_name: string;
  package_type: string;
  manufacturer: string;
  visible_damage: string[];
  severity: string;
  possible_cause: string;
  summary: string;
  recommended_action: string;
  repairability: string;
  recommendations: string[];
  confidence: number;
  status: string;
};

const SYSTEM_PROMPT = `You are an expert electronics failure-analysis engineer inspecting integrated circuits and PCB-mounted components from photographs.
Inspect strictly for: burn marks, broken pins, corrosion, oxidation, missing pins, bent pins, physical cracks, heat damage, package deformation, PCB contamination, improper solder residue, label readability, surface discoloration.
Be conservative: only report damage you can actually see. If the image is unusable, say so and use status "undetermined" with a low confidence.`;

const TOOL = {
  type: "function",
  function: {
    name: "report_diagnosis",
    description: "Report the visual diagnosis of the electronic component.",
    parameters: {
      type: "object",
      properties: {
        component_name: { type: "string", description: "Part number / component name, or 'Unidentified'" },
        package_type: { type: "string", description: "e.g. DIP-8, TQFP-64, SOIC-16, or 'Unknown'" },
        manufacturer: { type: "string", description: "Manufacturer if the logo/marking is readable, else 'Unknown'" },
        visible_damage: {
          type: "array",
          items: { type: "string" },
          description: "Observed defects, e.g. 'Burn mark on top surface', 'Bent pin 4'. Empty if none.",
        },
        severity: { type: "string", enum: ["none", "minor", "moderate", "severe", "undetermined"] },
        possible_cause: { type: "string" },
        summary: { type: "string", description: "2-4 sentence diagnosis summary" },
        recommended_action: { type: "string" },
        repairability: { type: "string", enum: ["repairable", "partially repairable", "not repairable", "unknown"] },
        recommendations: { type: "array", items: { type: "string" } },
        confidence: { type: "number", description: "0-100 confidence in this assessment" },
        status: { type: "string", enum: ["healthy", "possible_defect", "severe_defect", "undetermined"] },
      },
      required: [
        "component_name",
        "package_type",
        "manufacturer",
        "visible_damage",
        "severity",
        "possible_cause",
        "summary",
        "recommended_action",
        "repairability",
        "recommendations",
        "confidence",
        "status",
      ],
      additionalProperties: false,
    },
  },
};

export async function analyzeImage(dataUrl: string): Promise<VisionAnalysis> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI service is not configured.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Diagnose this electronic component / IC from the photograph and call report_diagnosis.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "report_diagnosis" } },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up to continue analysing.");
    throw new Error(`AI analysis failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[]; content?: string } }[];
  };
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("The AI did not return a structured diagnosis. Please retry.");
  return JSON.parse(args) as VisionAnalysis;
}
