import React from 'react'
import 'react-api-client/dist/index.css'
import { ApiClient } from 'react-api-client/dist/index'
import { BaseApiResult, ReloadFunction } from 'react-api-client/dist/index'

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
    <>
      <Test1 />
      <Test2 />
    </>
  )
}

const Test1 = () => {
  return (
    <div>
      <client.Loader consumer={true} endpoint={"/okay"}>
        {({data: {
          date
        }}: ApiResult, reloadData: ReloadFunction) => (
          <>
            {date}
            <br />
            <button onClick={() => reloadData()}>Reload</button>
          </>
        )}
      </client.Loader>
    </div>
  )
}

const Test2 = () => {
  const {handle, loading, result} = client.useRequestState()

  return (
    <div>
      {JSON.stringify(handle)}<br />
      {JSON.stringify(loading)}<br />
      {JSON.stringify(result)}<br />
      <button onClick={() => {
        client.get("/okay?delay=2", handle)
      }}>Load</button>
    </div>
  )
}

export default App
