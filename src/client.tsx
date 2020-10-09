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

    this.get = (endpoint) => this.call("get", endpoint);
    this.useGet = (endpoint) => this.useCall("get", endpoint);

    ["post", "put", "patch", "delete"].forEach(method => {
      this[method] = ((endpoint, requestData) =>
        this.call(method, endpoint, requestData)) as CallFunctionWithBody<TApiResult>;
      this["use" + firstUp(method)] = ((endpoint, requestData) =>
        this.useCall(method, endpoint, requestData)) as UseCallFunctionWithBody<TApiResult>;
    })

    this.Loader = (props: ApiLoaderPropsNoClient<TApiResult>) => {
      assignIfNull(props, {
        createLoading: this.options.loaderCreateLoading,
        createError: this.options.loaderCreateLoading
      } as Partial<ApiLoaderPropsNoClient<TApiResult>>);

      return (<ApiLoader client={this} {...props} />)
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

  useCall(method: string, endpoint: string, requestData?: object): UseCallFunctionReturnType<TApiResult> {
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

  async call(method: string, endpoint: string, requestData?: object) : Promise<TApiResult> {
    try {
      return await fetch(this.options.baseUrl + endpoint, {
        method,
        body: JSON.stringify(requestData),
        ...this.options.fetchOptions
      }).then(response => {
        return response.json().then(data => ({
          statusCode: response.status,
          data
        }))
      }).then(({ statusCode, data }) => {
        return Object.assign({
          data,
          statusCode
        }, this.options.responseHandler(data)) as TApiResult
      })
    } catch (e) {
      return Object.assign({
        data: null
      }, this.options.errorHandler(e)) as TApiResult;
    }
  }
}

export interface ApiClientOptions<TApiResult extends BaseApiResult> {
  baseUrl: string

  responseHandler: (data: object) => ApiResultWithoutRaw<TApiResult>
  errorHandler: (error: Error) => ApiResultWithoutRaw<TApiResult>

  loaderCreateLoading?: ApiLoaderCreateLoadingFunction,
  loaderCreateError?: ApiLoaderCreateErrorFunction<TApiResult>,

  fetchOptions?: Partial<RequestInit>
}

type CallFunctionWithoutBody<TApiResult extends BaseApiResult> = (endpoint: string) => Promise<TApiResult>;
type CallFunctionWithBody<TApiResult extends BaseApiResult> = (endpoint: string, requestData: object) => Promise<TApiResult>;

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
