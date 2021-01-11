import { assignIfNull, firstUp } from './helper'
import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  ApiLoader,
  ApiLoaderCreateErrorFunction,
  ApiLoaderCreateLoadingFunction,
  ApiLoaderPropsNoClient
} from './Loader'

export class ApiClient<TApiResult extends BaseApiResult> {
  options: ApiClientOptions<TApiResult>

  constructor(options: ApiClientOptions<TApiResult>) {
    assignIfNull(options, {
      fetchOptions: {}
    } as Partial<ApiClientOptions<TApiResult>>);

    this.options = options;

    this.get = (endpoint, stateHandle) => this.call("get", endpoint, undefined, stateHandle);
    this.useGet = (endpoint) => this.useCall("get", endpoint);

    ["post", "put", "patch", "delete"].forEach(method => {
      this[method] = ((endpoint, requestData, stateHandle) =>
        this.call(method, endpoint, requestData, stateHandle)) as CallFunctionWithBody<TApiResult>;
      this["use" + firstUp(method)] = ((endpoint, requestData) =>
        this.useCall(method, endpoint, requestData)) as UseCallFunctionWithBody<TApiResult>;
    })

    this.Loader = (props: ApiLoaderPropsNoClient<TApiResult>) => {
      const tempProps = {...props}; // This is required because component properties can't be modified
      assignIfNull(tempProps, {
        createLoading: this.options.loaderCreateLoading,
        createError: this.options.loaderCreateLoading,
        ignoreError: false
      } as Partial<ApiLoaderPropsNoClient<TApiResult>>);

      return (<ApiLoader client={this} {...tempProps} />)
    }
  }

  Loader: FunctionComponent<ApiLoaderPropsNoClient<TApiResult>>

  get: CallFunctionWithoutBody<TApiResult>
  post: CallFunctionWithBody<TApiResult>
  put: CallFunctionWithBody<TApiResult>
  patch: CallFunctionWithBody<TApiResult>
  delete: CallFunctionWithBody<TApiResult>

  useGet: UseCallFunctionWithoutBody<TApiResult>
  usePost: UseCallFunctionWithBody<TApiResult>
  usePut: UseCallFunctionWithBody<TApiResult>
  usePatch: UseCallFunctionWithBody<TApiResult>
  useDelete: UseCallFunctionWithBody<TApiResult>

  private useCall(method: string, endpoint: string, requestData?: object): UseCallFunctionReturnType<TApiResult> {
    const [loadCounter, setLoadCounter] = useState(0);
    const [result, setResult] = useState(null as TApiResult | null);

    useEffect(() => {
      let unmounted = false;

      this.call(method, endpoint, requestData).then(callResult => {
        if (unmounted) return;
        setResult(callResult);
      });

      return () => {
        unmounted = true;
      }
    }, [loadCounter])

    return [
      result,
      result == null,
      () => setLoadCounter(loadCounter + 1)
    ] as UseCallFunctionReturnType<TApiResult>;
  }

  private async call(method: string, endpoint: string, requestData?: object,
             handle?: ApiRequestStateHandle<TApiResult>) : Promise<TApiResult> {
    handle?.startRequest();

    let fetchOptions;
    if (typeof this.options.fetchOptions === "function") {
      fetchOptions = this.options.fetchOptions();
    } else {
      fetchOptions = this.options.fetchOptions;
    }

    return await fetch(this.options.baseUrl + endpoint, {
      method,
      body: JSON.stringify(requestData),
      ...fetchOptions
    }).then(response => { // Convert response to json
      return response.json().then(data => ({
        statusCode: response.status,
        data
      }))
    }).then(({ statusCode, data }) => { // Create api result using response handler
      return Object.assign({
        data,
        statusCode
      }, this.options.responseHandler(data)) as TApiResult
    }).catch(error => { // Handle errors
      return Object.assign({
        data: null
      }, this.options.errorHandler(error)) as TApiResult
    }).then(result => { // Update handle
      handle?.finishRequest(result);
      return result;
    })
  }

  useRequestState(resetResultOnRefresh: boolean = true): ApiRequestState<TApiResult> {
    const [handleState, setHandleState] = useState({
      loading: false,
      result: null as TApiResult | null
    });

    function startRequest() {
      if (resetResultOnRefresh) {
        handleState.result = null;
      }
      handleState.loading = true;
      setHandleState({...handleState});
    }

    function finishRequest(data: TApiResult) {
      setHandleState({result: data, loading: false});
    }

    function resetHandle() {
      setHandleState({result: null, loading: false});
    }

    return {
      handle: {
        startRequest,
        finishRequest
      },
      loading: handleState.loading,
      result: handleState.result,
      resetHandle
    };
  }
}

export interface ApiRequestState<TApiResult extends BaseApiResult> {
  handle: ApiRequestStateHandle<TApiResult>,
  loading: boolean,
  result: TApiResult | null
  resetHandle: () => void
}

export interface ApiRequestStateHandle<TApiResult extends BaseApiResult> {
  startRequest: () => void
  finishRequest: (result: TApiResult) => void
}

export interface ApiClientOptions<TApiResult extends BaseApiResult> {
  baseUrl: string

  responseHandler: (data: object) => ApiResultWithoutRaw<TApiResult>
  errorHandler: (error: Error) => ApiResultWithoutRaw<TApiResult>

  loaderCreateLoading?: ApiLoaderCreateLoadingFunction,
  loaderCreateError?: ApiLoaderCreateErrorFunction<TApiResult>,

  fetchOptions?: (() => Partial<RequestInit>) | Partial<RequestInit>
}

type CallFunctionWithoutBody<TApiResult extends BaseApiResult> = (endpoint: string, stateHandle?: ApiRequestStateHandle<TApiResult>) => Promise<TApiResult>;
type CallFunctionWithBody<TApiResult extends BaseApiResult> = (endpoint: string, requestData: object, stateHandle?: ApiRequestStateHandle<TApiResult>) => Promise<TApiResult>;

type UseCallFunctionWithoutBody<TApiResult extends BaseApiResult> = (endpoint: string) => UseCallFunctionReturnType<TApiResult>;
type UseCallFunctionWithBody<TApiResult extends BaseApiResult> = (endpoint: string, requestData: object) => UseCallFunctionReturnType<TApiResult>;

export type ReloadFunction = () => {}
type UseCallFunctionReturnType<TApiResult extends BaseApiResult> = [TApiResult, false, ReloadFunction] | [null, true, ReloadFunction];

export type ApiResultWithoutRaw<TApiResult extends BaseApiResult> = Omit<TApiResult, keyof RawApiResult>;

interface RawApiResult {
  statusCode: number | null
  data: any | null,
}

export interface BaseApiResult extends RawApiResult {
  hasError: boolean,
  errorMessage?: string
}
