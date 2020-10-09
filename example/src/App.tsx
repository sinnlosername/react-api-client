import React from 'react'
import 'react-api-client/dist/index.css'
import { ApiClient } from 'react-api-client/dist/index'
import { BaseApiResult } from 'react-api-client/dist/index'

interface ApiResult extends BaseApiResult {
  date?: string
}

const client = new ApiClient<ApiResult>({
  baseUrl: "http://localhost:3001",
  responseHandler: (data) => ({
    hasError: false,
    errorMessage: "",
    date: data["date"]
  }),
  errorHandler: (e) => ({
    hasError: true,
    errorMessage: e.message
  })
});

window["apiClient"] = client;

const App = () => {
  return (
    <div>
      <client.Loader consumer={true} endpoint={"/okay"}>
        {(result: ApiResult, reloadData: () => {}) => (
          <>
            {JSON.stringify(result)}
            <button onClick={() => reloadData()}>Reload</button>
          </>
        )}
      </client.Loader>
    </div>
  )
}

export default App
