import cors from 'cors'
import { Request, Response } from 'express'
import * as functions from 'firebase-functions'

const corsHandler = cors({ origin: true })

export const withCors = (handler: functions.CloudFunction<any>) => 
  (req: Request, res: Response): Promise<void> => {
    return new Promise((resolve, reject) => {
      corsHandler(req, res, () => {
        return Promise.resolve(handler(req, res))
          .then(resolve)
          .catch(reject)
      })
    })
} 