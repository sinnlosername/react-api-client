import React, { FunctionComponent, ReactElement } from 'react'
import { ApiClient, ApiResult } from './client'

export interface ApiLoaderProps extends ApiLoaderPropsNoClient {
  client: ApiClient
}

export interface ApiLoaderPropsNoClient {
  consumer: React.Context<any> | true,
  endpoint: string

  createLoading?: ApiLoaderCreateLoadingFunction,
  createError?: ApiLoaderCreateErrorFunction
}

export type ApiLoaderCreateLoadingFunction = () => ReactElement<any, any>;
export type ApiLoaderCreateErrorFunction = (result: ApiResult) => ReactElement<any, any>;

export const ApiLoader : FunctionComponent<ApiLoaderProps> = (props) => {
  const [result, loading] = props.client.useGet(props.endpoint)
  //todo reload data

  function getInlineChild(): ReactElement<any, any> {
    if (typeof props.children !== "function")
      throw new Error("Inline child requires children function")
    return props.children(result);
  }

  function getContextChild(): ReactElement<any, any> {
    const context = props.consumer as React.Context<any>;
    const ContextProvider = context.Provider;

    return (
      <ContextProvider value={{
        result
      }}>
        {props.children}
      </ContextProvider>
    )
  }

  if (loading) {
    return props.createLoading?.() ?? (<span>Loading...</span>)
  }

  if (result?.hasError) {
    return props.createError?.(result) ?? (<span>Error: {result.error}</span>);
  }

  return props.consumer === true ? getInlineChild() : getContextChild();
}
