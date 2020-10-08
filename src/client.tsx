import { assignIfNull, firstUp } from './helper'
import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  ApiLoader,
  ApiLoaderCreateErrorFunction,
  ApiLoaderCreateLoadingFunction,
  ApiLoaderPropsNoClient
} from './Loader'

export interface ApiClientOptions {
  baseUrl: string

  hasErrorChecker?: (data: object) => boolean,
  errorExtractor?: (data: object) => string | undefined,
  errorCodeExtractor?: (data: object) => string | undefined,

  loaderCreateLoading?: ApiLoaderCreateLoadingFunction,
  loaderCreateError?: ApiLoaderCreateErrorFunction,

  extraSettings?: Partial<RequestInit>
}

export class ApiClient {
  options: ApiClientOptions

  constructor(options: ApiClientOptions) {
    assignIfNull(options, {
      hasErrorChecker: (data: object) => data["status"] === "error",
      errorExtractor: (data: object) => data["error"] as string ?? undefined,
      errorCodeExtractor: (data: object) => data["errorCode"] as string ?? undefined,
      extraSettings: {}
    } as Partial<ApiClientOptions>);

    this.options = options;

    this.get = (endpoint) => this.call("get", endpoint);
    this.useGet = (endpoint) => this.useCall("get", endpoint);

    ["post", "put", "patch", "delete"].forEach(method => {
      this[method] = ((endpoint, requestData) =>
        this.call(method, endpoint, requestData)) as CallFunctionWithBody;
      this["use" + firstUp(method)] = ((endpoint, requestData) =>
        this.useCall(method, endpoint, requestData)) as UseCallFunctionWithBody;
    })

    this.Loader = (props: ApiLoaderPropsNoClient) => {
      assignIfNull(props, {
        createLoading: props.createLoading,
        createError: props.createError
      } as Partial<ApiLoaderPropsNoClient>);

      return (<ApiLoader client={this} {...props} />)
    }


    console.log("LOADER: " + this.Loader)
  }

  Loader: FunctionComponent<ApiLoaderPropsNoClient>

  get: CallFunctionWithoutBody
  post: CallFunctionWithBody
  put: CallFunctionWithBody
  patch: CallFunctionWithBody
  delete: CallFunctionWithBody

  useGet: UseCallFunctionWithoutBody
  usePost: UseCallFunctionWithBody
  usePut: UseCallFunctionWithBody
  usePatch: UseCallFunctionWithBody
  useDelete: UseCallFunctionWithBody

  useCall(method: string, endpoint: string, requestData?: object): UseCallFunctionReturnType {
    const [unmounted, setUnmounted] = useState(false);
    const [result, setResult] = useState(null as ApiResult | null);

    useEffect(() => {
      this.call(method, endpoint, requestData).then(callResult => {
        if (unmounted) return;
        setResult(callResult);
      });

      return () => setUnmounted(true);
    }, [""])

    return [result, result == null] as UseCallFunctionReturnType;
  }

  async call(method: string, endpoint: string, requestData?: object) : Promise<ApiResult> {
    try {
      const data = await fetch(this.options.baseUrl + endpoint, {
        method,
        body: JSON.stringify(requestData),
        ...this.options.extraSettings
      }).then(response => response.json());

      if (this.options.hasErrorChecker?.(data)) {
        return {
          data,
          hasError: true,
          errorCode: this.options.errorCodeExtractor?.(data),
          error: this.options.errorExtractor?.(data)
        }
      } else {
        return {
          hasError: false,
          data
        }
      }
    } catch (e) {
      return {
        data: null,
        hasError: true,
        error: `Request error - ${e.message}`,
        errorCode: "REQUEST_FAILED"
      }
    }
  }
}
type CallFunctionWithoutBody = (endpoint: string) => Promise<ApiResult>;

type CallFunctionWithBody = (endpoint: string, requestData: object) => Promise<ApiResult>;
type UseCallFunctionReturnType = [ApiResult, false] | [null, true];
type UseCallFunctionWithoutBody = (endpoint: string) => UseCallFunctionReturnType;

type UseCallFunctionWithBody = (endpoint: string, requestData: object) => UseCallFunctionReturnType;

export interface ApiResult {
  data: object | null,
  hasError: boolean,
  errorCode?: string,
  error?: string
}
