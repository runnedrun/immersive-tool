import axios from 'axios';

export type HitApiEndpointProps = {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";  
  body?: string;
}

export const hitApiEndpoint = async ({method, url, body}: HitApiEndpointProps) => {
  const resp = await axios({
    method,
    url,
    data: body,
  }).then((resp) => {
    return `${resp.status}: ${JSON.stringify(resp.data)}`
  }).catch((err) => {
    return `Error: ${err.message};`
  })
  return `Response was: ${resp};`
}