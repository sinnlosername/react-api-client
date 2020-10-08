import React from 'react'

import 'react-api-client/dist/index.css'
import { ApiClient } from 'react-api-client/dist/index'
import { ApiResult } from '../../src'

const client = new ApiClient({
  baseUrl: "https://hastebin.com",
  extraSettings: {
    mode: 'no-cors'
  }
});

window["x"] = client;

const App = () => {
  console.log(client.Loader);
  return (<client.Loader consumer={true} endpoint={"/raw/obeyujudoj.css"}>
    {(result: ApiResult) => (
      <>{JSON.stringify(result)}</>
    )}
  </client.Loader>)
}

export default App
