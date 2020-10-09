# react-api-client

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-api-client.svg)](https://www.npmjs.com/package/react-api-client) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-api-client
```

## Usage

Define a result type
```ts
import { BaseApiResult } from 'react-api-client'

interface ApiResult extends BaseApiResult {
  /* Add custom fields here */
}
```

Create an api client
```ts
import { ApiClient } from 'react-api-client'

const client = new ApiClient<ApiResult>({
  baseUrl: "http://your-server/api", // Your api base url
  responseHandler: (data) => { // Handle an api response
    if (data.error != null) {
      return {
        hasError: true,
        errorMessage: data.error,
        /* Extract additional error information from data here */
      }
    }

    return {
      hasError: false
    }
  },
  errorHandler: (e) => ({ // Handle an error while performing a request
    hasError: true,
    errorMessage: e.message
  }),
  fetchOptions: {
    /* Add extra options for the fetch() method here */
  }
});
```

Send a request from normal code
```ts
result = await client.get("/");
result = await client.post("/", {});
```

Send a request from a component
```tsx
function MyComponent() {
  const [
    result,  /* The api result */
    loading, /* Indicates if the request is loading or not */
    reload   /* Call this function to perform the request again */
  ] = client.useGet("/");

  return (
    <span>{loading ? "Loading..." : JSON.stringify(result)}</span>
  );
}
```

Send a request using a data loader (with inline handler)
```tsx
function MyComponent() {
  return (
    <client.Loader consumer={true} endpoint="/">
      {(result: ApiResult, reload: ReloadFunction) => (
        <span>{JSON.stringify(result)}</span>
      )}
    </client.Loader>
  )
}
```

Send a request using a data loader (with context handler)

```tsx
import { ReloadFunction } from 'react-api-client'

const DataContext = React.createContext("dataContext");

function MyOuterComponent() {
  return (
    <client.Loader consumer={DataContext} endpoint="/">
      <MyComponent />
    </client.Loader>
  )
}

function MyComponent() {
  const [
    result,  /* The api result */
    reload   /* Call this function to perform the request again */
  ] = useContext(DataContext);

  return (<span>{JSON.stringify(result)}</span>);
}
```

## License

MIT © [sinnlosername](https://github.com/sinnlosername)
