import * as functions from 'firebase-functions'
import * as serviceAccount from '../service-account.json'

interface Config {
  openai: {
    apiKey: string
  }
  firebase: {
    credential: {
      projectId: string
      clientEmail: string
      privateKey: string
    }
    storageBucket: string
  }
}

const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.key,
  },
  firebase: {
    credential: {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    },
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  },
}

export default config 