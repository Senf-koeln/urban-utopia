import {
  type GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
  type Part,
} from "@google/genai";
import cors from "cors";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

type HttpHandler = Parameters<typeof onRequest>[0];
type HttpRequest = Parameters<HttpHandler>[0];
type HttpResponse = Parameters<HttpHandler>[1];

const corsHandler = cors({ origin: "*" });

const MAX_CHUNK_SIZE = 950_000;
const TEXT_MODEL = "gemini-3.1-flash-lite";
const IMAGE_MODEL = "gemini-3.1-flash-lite-image";

const IMAGE_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_HATE,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const IMAGE_GENERATION_CONFIG: GenerateContentConfig = {
  temperature: 1,
  topP: 0.95,
  maxOutputTokens: 32768,
  responseModalities: ["TEXT", "IMAGE"],
  safetySettings: IMAGE_SAFETY_SETTINGS,
};

interface GeminiImageInput {
  data: string;
  mimeType: string;
}

export interface GeminiRequest {
  body: string;
  assistantId: string;
  lang: string;
  images?: GeminiImageInput[];
}

interface Assistant {
  systemPrompt: string;
  model: string;
  responseMimeType?: string;
  supportsImages?: boolean;
  isImageGeneration?: boolean;
  generationConfig?: GenerateContentConfig;
}

interface UsageAggregate {
  apiCalls: number;
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

const VERTEX_PRICING_USD_PER_1M: Array<{
  match: RegExp;
  input: number;
  output: number;
  label: string;
}> = [
  { match: /flash-lite/i, input: 0.075, output: 0.3, label: "flash-lite" },
  { match: /flash-image/i, input: 0.3, output: 30, label: "flash-image" },
  { match: /flash/i, input: 0.15, output: 0.6, label: "flash-default" },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isResourceExhaustedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

async function withRetryOn429<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  attempt = 0,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isResourceExhaustedError(error) && attempt < maxRetries) {
      const delayMs = 2000 * 2 ** attempt;
      logger.warn(
        `Vertex AI 429 RESOURCE_EXHAUSTED, retrying in ${delayMs}ms`,
        {
          attempt: attempt + 1,
        },
      );
      await delay(delayMs);
      return withRetryOn429(fn, maxRetries, attempt + 1);
    }
    throw error;
  }
}

function normalizeText(text: string): string {
  try {
    if (text.includes("\\u") || text.includes("\\x")) {
      const decoded: unknown = JSON.parse(`"${text}"`);
      if (typeof decoded === "string") return decoded;
    }
    return text.normalize("NFC");
  } catch (error) {
    logger.warn("Text normalization failed, using original text:", error);
    return text;
  }
}

function splitIntoChunks(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = Math.min(currentIndex + maxSize, text.length);

    if (endIndex < text.length) {
      const possibleBreaks = [
        text.lastIndexOf("\n\n", endIndex),
        text.lastIndexOf("\n", endIndex),
        text.lastIndexOf(". ", endIndex),
        text.lastIndexOf("? ", endIndex),
        text.lastIndexOf("! ", endIndex),
        text.lastIndexOf(" ", endIndex),
      ].filter((pos) => pos > currentIndex && pos < endIndex);

      if (possibleBreaks.length > 0) {
        endIndex = Math.max(...possibleBreaks) + 1;
      }
    }

    const chunk = text.slice(currentIndex, endIndex).trim();
    if (chunk) chunks.push(chunk);
    currentIndex = endIndex;
  }

  return chunks;
}

function recordUsage(
  agg: UsageAggregate,
  usageMetadata:
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined,
): void {
  agg.apiCalls += 1;
  if (!usageMetadata) return;
  if (typeof usageMetadata.promptTokenCount === "number") {
    agg.promptTokenCount += usageMetadata.promptTokenCount;
  }
  if (typeof usageMetadata.candidatesTokenCount === "number") {
    agg.candidatesTokenCount += usageMetadata.candidatesTokenCount;
  }
  if (typeof usageMetadata.totalTokenCount === "number") {
    agg.totalTokenCount += usageMetadata.totalTokenCount;
  }
}

function logUsageSummary(
  assistantId: string,
  model: string,
  usage: UsageAggregate,
): void {
  if (usage.apiCalls === 0) return;

  const tier = VERTEX_PRICING_USD_PER_1M.find((t) => t.match.test(model)) ?? {
    input: 0.15,
    output: 0.6,
    label: "fallback",
  };
  const inputCostUsd = (usage.promptTokenCount / 1_000_000) * tier.input;
  const outputCostUsd = (usage.candidatesTokenCount / 1_000_000) * tier.output;
  const totalCostUsd = inputCostUsd + outputCostUsd;

  logger.log("gemini.usage.summary", {
    assistantId,
    model,
    apiCalls: usage.apiCalls,
    promptTokenCount: usage.promptTokenCount,
    candidatesTokenCount: usage.candidatesTokenCount,
    totalTokenCount: usage.totalTokenCount,
    pricingTier: tier.label,
    estimatedTotalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
  });
}

function parseGeminiImages(raw: unknown): GeminiImageInput[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const parsed: GeminiImageInput[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const data = "data" in item ? item.data : undefined;
    const mimeType = "mimeType" in item ? item.mimeType : undefined;
    if (typeof data === "string" && typeof mimeType === "string") {
      parsed.push({ data, mimeType });
    }
  }
  return parsed.length > 0 ? parsed : undefined;
}

function parseGeminiRequest(raw: unknown): GeminiRequest {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid request body");
  }
  const body = "body" in raw && typeof raw.body === "string" ? raw.body : "";
  const assistantId =
    "assistantId" in raw && typeof raw.assistantId === "string"
      ? raw.assistantId
      : "";
  const lang = "lang" in raw && typeof raw.lang === "string" ? raw.lang : "";
  const images = "images" in raw ? parseGeminiImages(raw.images) : undefined;
  return { body, assistantId, lang, images };
}

function buildAssistants(lang: string): Record<string, Assistant> {
  return {
    default: {
      systemPrompt: `Do precisely as instructed in the prompt.

Rules:
- Return only the result
- Don't explain changes
- ALWAYS respond in this language: ${lang}`,
      model: TEXT_MODEL,
    },
    jsonDefault: {
      systemPrompt: `Do precisely as instructed in the prompt.

Rules:
- Return only the result
- Don't explain changes
- ALWAYS respond in this language: ${lang}`,
      model: TEXT_MODEL,
      responseMimeType: "application/json",
    },
    restyleImage: {
      systemPrompt:
        "You are an expert image style transfer assistant. Your task is to edit the input image based on the provided prompt.",
      model: IMAGE_MODEL,
      supportsImages: true,
      isImageGeneration: true,
      generationConfig: IMAGE_GENERATION_CONFIG,
    },
    manipulateImageGeneral: {
      systemPrompt: `Advanced AI for Creative Image Generation

You are an advanced AI specializing in creative image generation. Your primary goal is to generate new visual elements that seamlessly integrate into the original scene.

Image Generation:
- Intelligently analyze the image to identify the most suitable areas for the requested modifications
- Consider composition, empty spaces, and visual balance
- Choose placement that enhances the overall image while maintaining natural context
- Generate content in the identified areas based on the prompt

Core Integration Principles:
- Seamlessly blend new elements ensuring:
  • Perfect lighting and shadow matching
  • Correct perspective and scale
  • Natural texture and material consistency
  • Seamless boundary transitions
- Match the style, quality, and characteristics of the original image
- Consider full image context when generating new elements
- Account for environmental factors (lighting, reflections, shadows)

General Requirements:
- Never generate content that covers most of the image
- Keep generated content modest and proportional
- Focus on precise, localized changes rather than large-scale modifications

Technical Requirements:
– [IMPORTANT: NEVER change the size and format of the input and output image.]
– [IMPORTANT: Preserve the buildings and the overall structure of the image, it has to be still recognizable as the same image.]
- [Preserve the structures of the original image, the buildings, the concept of the neighborhood]
– Generate high-quality, detailed content
- Ensure perfect blending at boundaries
- Maintain consistent resolution and detail level
- Always return an image, never text
- Generate content exactly as specified in the prompt
- Ensure new content looks natural and intentional
- Ensure the output image has an even better pixel quality than the input image`,
      model: IMAGE_MODEL,
      supportsImages: true,
      isImageGeneration: true,
      generationConfig: IMAGE_GENERATION_CONFIG,
    },
    manipulateImageWithMask: {
      systemPrompt: `Advanced AI for Mask-Guided Image Generation

You are an advanced AI specializing in mask-guided image generation. Your primary goal is to generate new visual elements that seamlessly integrate into the original scene based on provided masks.

Operation Mode - Mask-Guided Generation:
- Analyze the second image to identify masked regions (areas with random noise). This area shall be the area of interest in the first image.
- Use these masked areas as a strict guide for content placement
- Follow mask boundaries precisely for content placement
- Generate appropriate new content for these regions based on the prompt
- Never generate content outside the masked areas

Core Integration Principles:
- Seamlessly blend new elements ensuring:
  • Perfect lighting and shadow matching
  • Correct perspective and scale
  • Natural texture and material consistency
  • Seamless boundary transitions
- Match the style, quality, and characteristics of the original image
- Consider full image context when generating new elements
- Account for environmental factors (lighting, reflections, shadows)

General Requirements:
- Strictly follow mask size constraints
- Focus on precise, localized changes within masked areas
- Never generate content outside the masked regions

Technical Requirements:
- Generate high-quality, detailed content
- Ensure perfect blending at boundaries
- Maintain consistent resolution and detail level
- Always return an image, never text
- Generate content exactly as specified in the prompt
- Ensure new content looks natural and intentional
- Ensure the output image has an even better pixel quality than the input image`,
      model: IMAGE_MODEL,
      supportsImages: true,
      isImageGeneration: true,
      generationConfig: IMAGE_GENERATION_CONFIG,
    },
  };
}

/**
 * Runs a Utopia Gemini text or image request against Vertex AI.
 *
 * @example
 * const result = await handleGemini({ body: "Translate", assistantId: "default", lang: "en" });
 */
export async function handleGemini({
  body,
  assistantId,
  lang,
  images,
}: GeminiRequest): Promise<string | Buffer> {
  const bodyForGemini = normalizeText(body);
  const assistants = buildAssistants(lang);
  const assistant = assistants[assistantId];
  if (!assistant) {
    throw new Error(`Assistant ${assistantId} not found`);
  }

  if (images?.length && !assistant.supportsImages) {
    throw new Error(`Assistant ${assistantId} does not support image analysis`);
  }

  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error(
      "GCLOUD_PROJECT environment variable is not set. This should be automatically set by Firebase.",
    );
  }

  const vertexEndpoint = assistant.isImageGeneration ? "global" : "eu";
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: vertexEndpoint,
  });

  const usageAgg: UsageAggregate = {
    apiCalls: 0,
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    totalTokenCount: 0,
  };

  if (assistant.isImageGeneration) {
    const contents: Part[] = [
      ...(images ?? []).map((image) => ({
        inlineData: { data: image.data, mimeType: image.mimeType },
      })),
      { text: `${assistant.systemPrompt}\n\n${bodyForGemini}` },
    ];

    const response = await ai.models.generateContent({
      model: assistant.model,
      contents,
      config: {
        temperature: assistant.generationConfig?.temperature ?? 0.5,
        topP: assistant.generationConfig?.topP ?? 0.95,
        maxOutputTokens: assistant.generationConfig?.maxOutputTokens ?? 32768,
        responseModalities: assistant.generationConfig?.responseModalities ?? [
          "TEXT",
          "IMAGE",
        ],
        safetySettings: assistant.generationConfig?.safetySettings ?? [],
      },
    });

    recordUsage(usageAgg, response.usageMetadata);

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        logUsageSummary(assistantId, assistant.model, usageAgg);
        return Buffer.from(part.inlineData.data, "base64");
      }
    }

    throw new Error(
      "The model did not generate an image. Please try again with a different prompt.",
    );
  }

  const chunks = splitIntoChunks(bodyForGemini, MAX_CHUNK_SIZE);
  const textConfig: GenerateContentConfig = {
    responseMimeType: assistant.responseMimeType ?? "text/plain",
    temperature: 1,
    topP: 0.95,
    topK: 40,
  };

  const chunkOutputs = await Promise.all(
    chunks.map(async (chunk, index) => {
      const contextPrefix =
        chunks.length > 1
          ? `[Part ${index + 1}/${chunks.length}]${
              index === 0
                ? " Beginning of text:"
                : index === chunks.length - 1
                  ? " End of text:"
                  : " Continuing text:"
            } `
          : "";

      const response = await withRetryOn429(() =>
        ai.models.generateContent({
          model: assistant.model,
          contents: [
            { text: `${assistant.systemPrompt}\n\n${contextPrefix}${chunk}` },
          ],
          config: textConfig,
        }),
      );

      recordUsage(usageAgg, response.usageMetadata);

      const chunkText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!chunkText) {
        throw new Error("Invalid response format from Gemini");
      }

      return normalizeText(chunkText);
    }),
  );

  let fullResponse = chunkOutputs.join("\n");

  if (chunks.length > 1) {
    const finalResponse = await withRetryOn429(() =>
      ai.models.generateContent({
        model: assistant.model,
        contents: [
          {
            text: `I will now provide you with the combined results of analyzing multiple chunks of text. Please provide a coherent, unified response that synthesizes all the information as if you had processed it as a single piece. Here is the combined analysis:\n\n${fullResponse}`,
          },
        ],
        config: { ...textConfig, maxOutputTokens: 8192 },
      }),
    );

    recordUsage(usageAgg, finalResponse.usageMetadata);

    const consolidated =
      finalResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (consolidated) {
      fullResponse = normalizeText(consolidated);
    }
  }

  logUsageSummary(assistantId, assistant.model, usageAgg);
  return fullResponse;
}

const REQUEST_OPTIONS = {
  memory: "4GiB",
  timeoutSeconds: 540,
} as const;

const geminiHandler = (req: HttpRequest, res: HttpResponse) => {
  corsHandler(req, res, async () => {
    let assistantId: string | undefined;
    try {
      const requestBody = parseGeminiRequest(req.body);
      assistantId = requestBody.assistantId;
      const result = await handleGemini(requestBody);

      if (Buffer.isBuffer(result)) {
        const contentType = requestBody.assistantId.includes("Image")
          ? "image/png"
          : "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Content-Length": result.length.toString(),
        });
        res.end(result);
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(result);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Gemini Error:", {
        error: err.message,
        stack: err.stack,
        assistantId,
      });
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Gemini failed",
          message: err.message,
          details:
            process.env.NODE_ENV === "development" ? err.stack : undefined,
        }),
      );
    }
  });
};

export const gemini = onRequest(
  {
    region: "europe-west1",
    ...REQUEST_OPTIONS,
  },
  geminiHandler,
);
