import { GoogleGenAI } from "@google/genai";

type GeminiImage = { data: string; mimeType: string };

export type GeminiRequestBody = {
  body: string;
  assistantId: string;
  lang?: string;
  images?: GeminiImage[];
  skipDlp?: boolean;
  isExperimental?: boolean;
};

type Assistant = {
  systemPrompt: string;
  model: string;
  location: string;
  supportsImages?: boolean;
  isImageGeneration?: boolean;
  responseMimeType?: string;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseModalities?: string[];
    safetySettings?: Array<{ category: string; threshold: string }>;
  };
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function isResourceExhaustedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

async function withRetryOn429<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isResourceExhaustedError(error) && attempt < maxRetries) {
        await delay(2000 * 2 ** attempt);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}

function getModels(isExperimental: boolean) {
  const textModel =
    process.env.GEMINI_TEXT_MODEL ??
    (isExperimental ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash");
  const imageModel =
    process.env.GEMINI_IMAGE_MODEL ??
    (isExperimental
      ? "gemini-3.1-flash-image-preview"
      : "gemini-2.5-flash-image");
  return { textModel, imageModel };
}

function buildAssistants(lang: string, isExperimental: boolean): Record<string, Assistant> {
  const { textModel, imageModel } = getModels(isExperimental);

  return {
    default: {
      systemPrompt: `Do precisely as instructed in the prompt.

        Rules:
          - Return only the result
          - Don't explain changes
          - ALWAYS respond in this language: ${lang}
          `,
      model: textModel,
      location: "global",
    },
    jsonDefault: {
      systemPrompt: `Do precisely as instructed in the prompt.

        Rules:
          - Return only the result
          - Don't explain changes
          - ALWAYS respond in this language: ${lang}
          `,
      model: textModel,
      location: "global",
      responseMimeType: "application/json",
    },
    manipulateImageGeneral: {
      systemPrompt: `
        Advanced AI for Creative Image Generation

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
        - Ensure the output image has an even better pixel quality than the input image
      `,
      model: imageModel,
      supportsImages: true,
      isImageGeneration: true,
      location: "global",
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        maxOutputTokens: 32768,
        responseModalities: ["TEXT", "IMAGE"],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      },
    },
  };
}

export async function handleGemini(
  request: GeminiRequestBody,
): Promise<string | Buffer> {
  const {
    body,
    assistantId,
    lang = "de",
    images,
    isExperimental = false,
  } = request;

  const assistants = buildAssistants(lang, isExperimental);
  const assistant = assistants[assistantId];
  if (!assistant) {
    throw new Error(`Assistant ${assistantId} not found`);
  }

  if (images?.length && !assistant.supportsImages && !assistant.isImageGeneration) {
    throw new Error(`Assistant ${assistantId} does not support images`);
  }

  const projectId = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is required for Vertex AI");
  }

  const ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: assistant.location || "global",
  });

  if (assistant.isImageGeneration) {
    const fullPrompt = `${assistant.systemPrompt}\n\n${body}`;
    const contents: Array<
      | { inlineData: { data: string; mimeType: string } }
      | { text: string }
    > = [];

    if (images?.length) {
      contents.push(
        ...images.map((image) => ({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        })),
      );
    }
    contents.push({ text: fullPrompt });

    const response = await withRetryOn429(() =>
      ai.models.generateContent({
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
      }),
    );

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }

    throw new Error(
      "The model did not generate an image. Please try again with a different prompt.",
    );
  }

  const contents: Array<{ text: string }> = [
    { text: `${assistant.systemPrompt}\n\n${body}` },
  ];

  const response = await withRetryOn429(() =>
    ai.models.generateContent({
      model: assistant.model,
      contents,
      config: {
        temperature: 1,
        topP: 0.95,
        responseMimeType: assistant.responseMimeType ?? "text/plain",
      },
    }),
  );

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Invalid response format from Gemini");
  }

  return text;
}
