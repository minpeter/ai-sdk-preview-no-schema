import { streamObject } from "ai";
import { friendli } from "@friendliai/ai-provider";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  const { prompt, source }: { prompt: string; source: string } =
    await req.json();

  if (!source.startsWith("https://en.wikipedia.org/wiki/")) {
    throw new Error("Invalid source URL");
  }

  const content = await fetch(source);

  const text = await content.text();
  const $ = cheerio.load(text);
  $("script").remove();
  $("style").remove();
  const strippedText = $("body").text().trim();
  const cleanText = strippedText.replace(/\s+/g, " ");

  const result = await streamObject({
    model: friendli("meta-llama-3.1-70b-instruct"),
    system: `\
      - for the following webpage, generate a JSON schema based on the user prompt
      - use camelCase for keys

      ${cleanText}
    `,
    prompt,
    output: "no-schema",
    onFinish({ object }) {
      // save object to database
    },
  });

  return result.toTextStreamResponse();
}
