import React, { PropsWithChildren, ReactElement } from 'react'
import { ApiClient, BaseApiResult } from './client'

export interface ApiLoaderProps<TApiResult extends BaseApiResult> extends ApiLoaderPropsNoClient<TApiResult> {
  client: ApiClient<TApiResult>
}

export interface ApiLoaderPropsNoClient<TApiResult extends BaseApiResult> {
  consumer: React.Context<any> | true,
  endpoint: string

  createLoading?: ApiLoaderCreateLoadingFunction,
  createError?: ApiLoaderCreateErrorFunction<TApiResult>
}

export type ApiLoaderCreateLoadingFunction = () => ReactElement<any, any>;
export type ApiLoaderCreateErrorFunction<TApiResult extends BaseApiResult> = (result: TApiResult) => ReactElement<any, any>;

export function ApiLoader<TApiResult extends BaseApiResult>(props: PropsWithChildren<ApiLoaderProps<TApiResult>>) {
  const [result, loading, reload] = props.client.useGet(props.endpoint)

  function getInlineChild(): ReactElement<any, any> {
    if (typeof props.children !== "function")
      throw new Error("Inline child requires children function")
    return props.children(result, reload);
  }

  function getContextChild(): ReactElement<any, any> {
    const context = props.consumer as React.Context<any>;
    const ContextProvider = context.Provider;

    return (
      <ContextProvider value={{
        result,
        reload
      }}>
        {props.children}
      </ContextProvider>
    )
  }

  if (loading) {
    return props.createLoading?.() ?? (<span>Loading...</span>)
  }

  if (result?.hasError) {
    return props.createError?.(result) ?? (<span>Error: {result.errorMessage}</span>);
  }

  return props.consumer === true ? getInlineChild() : getContextChild();
}
