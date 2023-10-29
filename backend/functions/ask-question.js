import { ChatOpenAI } from 'langchain/chat_models/openai'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PromptTemplate } from 'langchain/prompts'
import { RunnableSequence } from 'langchain/schema/runnable'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { formatDocumentsAsString } from 'langchain/util/document'
import { Pinecone } from '@pinecone-database/pinecone'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import assert from 'assert'

let streamController
const writeToRes = (token) => {
  process.stdout.write(token)
  console.log('streamController', streamController, token)
  streamController.enqueue(token)
}

const setup = async () => {
  const pinecone = new Pinecone()

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX)

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex }
  )
  const retriever = vectorStore.asRetriever(6)
  const model = new ChatOpenAI({
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken (token) {
          writeToRes(token)
        }
      }
    ]
  })
  return { model, retriever }
}

const askQuestion = async (model, retriever, question, history) => {
  const questionPrompt = PromptTemplate.fromTemplate(
  `
  You are an assistant answering questions about EVE Online, the computer game.
  Assume that the majority of the questions are focused on the lore of the game, rather than any playable characters or real-life.
  You may use all of your knowledge to assist you with your answers, but additional specific information will be attached.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  Always assume that the question and context is in reference to the EVE online fictional universe.
  Never say 'based on the context provided' or variations of that.
  Only answers questions about EVE Online.
  The additional info may be helpful but ALWAYS look at the chat history first for the primary conversation context.
  ----------------
  ADDITIONAL INFO: {context}
  ----------------
  CHAT HISTORY: {chatHistory}
  ----------------
  QUESTION: {question}
  ----------------
  Helpful Answer:`
  )
  // TODO - There is always a problem with sending just the question to the relevantDocs
  // you have to include history too, or use ConversationalQAChain etc
  const relevantDocs = await retriever.getRelevantDocuments(history.length > 0 ? `${question}- Previous chat history: ${history}` : question)
  const serializedDocs = formatDocumentsAsString(relevantDocs)
  const chain = RunnableSequence.from([
    {
      question: (input) => input.question,
      chatHistory: (input) => input.chatHistory ?? '',
      context: async (input) => {
        return serializedDocs
      }
    },
    questionPrompt,
    model,
    new StringOutputParser()
  ])
  const answer = await chain.invoke({
    question,
    chatHistory: history
  })
  // history = formatChatHistory(question, answer, history)
  const relevantURLs = [...new Set(relevantDocs.map(d => d.metadata.source))]
  // return { answer, history, relevantURLs }
  return { answer, relevantURLs }
}

export default async (request, context) => {
  // export async function handler (event, context) {
  console.log('START')
  const reqBody = await new Response(request.body).json()
  console.log('req', request.method, reqBody)
  assert(request.method === 'POST')
  const { model, retriever } = await setup()
  const resBody = new ReadableStream({
    start (controller) {
      streamController = controller
    }
  })

  askQuestion(model, retriever, reqBody.question, reqBody.history)
    .then((answerData) => {
      console.log('answer', answerData.answer, 'relevantURLs', answerData.relevantURLs)
      streamController.enqueue(`|||||${answerData.relevantURLs.join('|||')}`)
      streamController.close()
    })
  return new Response(resBody)
}
