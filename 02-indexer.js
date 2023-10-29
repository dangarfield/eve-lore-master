import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Pinecone } from '@pinecone-database/pinecone'
import { PineconeStore } from 'langchain/vectorstores/pinecone'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const initLoad = async () => {
  const loader = new DirectoryLoader(
    '_data',
    {
      '.txt': (path) => new TextLoader(path)
    }
  )
  const docs = await loader.load()
  for (const doc of docs) {
    doc.metadata.source = 'https://universe.eveonline.com' + doc.metadata.source.split('_data')[1].replace('.txt', '')
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 50
  })
  const splitDocs = await splitter.splitDocuments(docs)

  console.log(splitDocs[4], docs.length, splitDocs.length)

  console.log('loading')
  console.log('env', process.env.OPENAI_API_KEY, process.env.PINECONE_ENVIRONMENT, process.env.PINECONE_API_KEY, process.env.PINECONE_INDEX)
  const pinecone = new Pinecone()
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX)

  console.log('saving')
  await PineconeStore.fromDocuments(splitDocs, new OpenAIEmbeddings(), {
    pineconeIndex,
    maxConcurrency: 5 // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
  })
  console.log('complete')
}
initLoad()
