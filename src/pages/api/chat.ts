import type { NextApiRequest, NextApiResponse } from 'next'

import {  createEmbedding, getChatResponse } from '@/src/services/openai'
import {  getGroqChatCompletion } from '@/src/services/groq'
import { fetchDataFromPinecone } from '@/src/services/fetchDataFromPinecone'
import chatResponseFromOpensource from '@/src/services/opensourceai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { basePrompt, question, namespace, selectedModel, chatHistory } = req.body
  
  if (!question) {
    return res.status(400).json({ message: 'No question in the request' })
  }

  if (!selectedModel?.value) {
    return res.status(500).json('Something went wrong')
  }

  // replacing newlines with spaces
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ')
 
  try {
    let fetchedText = ''

    //fetch text from vector database
    if(namespace && namespace !== 'none') {
      const embeddedQuery = await createEmbedding(question)
      fetchedText = await fetchDataFromPinecone(embeddedQuery, namespace)
    }

    // get response from AI
    const { category } = selectedModel
    let chatResponse: string | undefined

    switch(category){
      case 'openai':
        chatResponse = await getChatResponse(basePrompt, chatHistory, sanitizedQuestion, fetchedText, selectedModel.value)
        break
      
      case 'groq':
        chatResponse = await getGroqChatCompletion(basePrompt, chatHistory, sanitizedQuestion, fetchedText, selectedModel.value)
        break

      case 'hf-small':
      case 'hf-large':
        const baseUrl = category === 'hf-small' 
          ? process.env.NEXT_PUBLIC_SERVER_URL 
          : process.env.NEXT_PUBLIC_SERVER_GPU_URL
          if(!baseUrl) {
            return res.status(500).json(`Url address for posting the data to ${selectedModel} is missing`)
          }
          const url = `${baseUrl}/api/chat_${category === 'hf-small' ? 'cpu' : 'gpu'}`
          chatResponse = await chatResponseFromOpensource(basePrompt, chatHistory, sanitizedQuestion, fetchedText, modelValue, url)
          break
          
      default:
        return res.status(500).json('Invalid model category')
    }
   
    const chatAnswer = chatResponse ?? 'I am sorry. I can\'t find an answer to your question.'

    res.status(200).json(chatAnswer)
  
  } catch (error: any) {
    console.error('An error occurred: ', error);
    res.status(500).json({ error: error.message || 'Something went wrong' })
  }
}
