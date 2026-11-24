import { getCloudFunctionUrl } from "./firebase";

type GeminiRequestProps = {
  body: string;
  assistantId: string;
  lang?: string;
  image?: {
    data: string;
    mimeType: string;
  };
  images?: Array<{
    data: string;
    mimeType: string;
  }>;
  signal?: AbortSignal;
  skipDlp?: boolean;
};

export const geminiRequest = async ({
  body,
  assistantId,
  lang,
  image,
  images,
  signal,
  skipDlp,
}: GeminiRequestProps) => {
  try {
    const finalImages = images || (image ? [image] : undefined);

    const response = await fetch(getCloudFunctionUrl("gemini"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
        assistantId,
        lang: resolveLangForGeminiHttp(lang),
        images: finalImages,
        ...(skipDlp ? { skipDlp } : {}),
      }),
      signal,
    });

    if (!response.ok) {
      try {
        await response.text();
      } catch (readError) {
        console.error(readError);
      }
      return null;
    }

    const contentType = response.headers.get("Content-Type");

    if (
      contentType &&
      (contentType.includes("image") || contentType.includes("octet-stream"))
    ) {
      try {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          return null;
        }
        return arrayBufferToBase64(arrayBuffer);
      } catch (binaryError) {
        console.error(binaryError);
        return null;
      }
    }

    try {
      const clonedResponse = response.clone();
      const arrayBuffer = await clonedResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const isProbablyBinary =
        (uint8Array[0] === 0x89 &&
          uint8Array[1] === 0x50 &&
          uint8Array[2] === 0x4e &&
          uint8Array[3] === 0x47) ||
        (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) ||
        uint8Array
          .slice(0, 100)
          .filter((b) => b < 32 && b !== 9 && b !== 10 && b !== 13).length >
          10;

      if (isProbablyBinary) {
        return arrayBufferToBase64(arrayBuffer);
      }

      const data = await response.text();
      return parseGeminiHttpTextResponse(data);
    } catch (error) {
      console.error(error);
      try {
        const textResponse = await response.text();
        return parseGeminiHttpTextResponse(textResponse);
      } catch (textError) {
        console.error(textError);
        return null;
      }
    }
  } catch (error) {
    console.error(error);
    if (error instanceof TypeError && error.message.includes("NetworkError")) {
      console.error(
        "Network error detected. This might be a CORS or connection issue.",
      );
    }
    return null;
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function resolveLangForGeminiHttp(lang?: string): string | undefined {
  if (!lang) return undefined;
  return lang.split("-")[0];
}

function parseGeminiHttpTextResponse(data: string): string | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data) as { text?: string; error?: string };
    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.error === "string") {
      console.error(parsed.error);
      return null;
    }
  } catch {
    // Plain text response
  }
  return data;
}
