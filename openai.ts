import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionRequest,
  OpenAIApi,
} from "openai";

import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPEN_AI;

const configuration = new Configuration({
  apiKey,
});

const openai = new OpenAIApi(configuration);

export const chat = async (
  messages: ChatCompletionRequestMessage[],
  stream?: boolean,
  model: "gpt-4" | "gpt-3.5-turbo" = "gpt-4"
) => {
  const opts: CreateChatCompletionRequest = {
    model,
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 1000,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    messages,
    stream,
  };
  console.log("PROMPT", JSON.stringify(messages, null, 2));
  const res = await openai.createChatCompletion(
    opts,
    stream ? { responseType: "stream" } : undefined
  );
  console.log("RESPONSE", res.data.choices[0].message);
  return res;
};
