'use client';
import { useState, FormEvent } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

interface RequestType {
  [key: string]: string;
}

interface ResponseType {
  [key: string]: string;
}

const Home = () => {
  const [curlCommand, setCurlCommand] = useState<string>('');
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [responseType, setResponseType] = useState<ResponseType | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);

  const handleCurlSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('/api/curl', { curlCommand });
      const axiosRequestString = response.data.axiosRequestString;
      const parsedRequest: AxiosRequestConfig = JSON.parse(axiosRequestString);
  
      const requestBody = parsedRequest.data;
      const requestType = extractType(requestBody);
      setRequestType(requestType);
  
      const apiResponse = await axios({
        method: parsedRequest.method,
        url: parsedRequest.url,
        headers: parsedRequest.headers,
        data: parsedRequest.data,
      });
  
      const responseBody = apiResponse.data;
      setResponseBody(responseBody);
      const responseType = extractType(responseBody);
      setResponseType(responseType);
    } catch (error) {
      console.error('Error processing cURL command:', error);
    }
  };
  

  const extractType = (data: any): { [key: string]: string } | null => {
    if (typeof data !== 'object') return null;

    const typeObj: { [key: string]: string } = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        typeObj[key] = typeof data[key];
      }
    }
    return typeObj;
  };

  return (
    <div>
      <h1>cURL to Request/Response Types</h1>
      <form onSubmit={handleCurlSubmit}>
        <textarea
          value={curlCommand}
          onChange={(e) => setCurlCommand(e.target.value)}
          rows={5}
          cols={80}
          placeholder="Paste your cURL command here"
        />
        <br />
        <button type="submit">Submit</button>
      </form>
      {requestType && (
        <div>
          <h2>Request Type</h2>
          <pre>{JSON.stringify(requestType, null, 2)}</pre>
        </div>
      )}
      {responseType && (
        <div>
          <h2>Response Type</h2>
          <pre>{JSON.stringify(responseType, null, 2)}</pre>
        </div>
      )}
      {responseBody && (
        <div>
          <h2>Response Body</h2>
          <pre>{JSON.stringify(responseBody, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;
