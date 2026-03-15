import OpenAI from 'openai'

// Z.AI (Zhipu AI) es compatible con la API de OpenAI
export const zai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY!,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
})

export const MODEL = 'glm-4.7'
