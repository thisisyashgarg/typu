import { NextApiRequest, NextApiResponse } from 'next';
import * as curlconverter from 'curlconverter';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { curlCommand } = req.body;
    console.log(curlCommand, 'hi')
    try {
      const axiosRequestString = curlconverter.toJsonString(curlCommand);
      res.status(200).json({ axiosRequestString });
    } catch (error) {
      res.status(500).json({ error: 'Error processing cURL command' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
