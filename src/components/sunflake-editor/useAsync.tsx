import React, { useEffect, useReducer, useRef } from "react"

export type AsyncState<T> = {
  loading: boolean
  data: T | null
  error: any
}

type Action<T> =
  | { asyncName: string, type: 'ASYNC_REQUEST' }
  | { asyncName: string, type: 'ASYNC_SUCCESS', data: T }
  | { asyncName: string, type: 'ASYNC_FAILURE', error: any }

function reducer<T>(state: AsyncState<T>, action: Action<T>): AsyncState<T> {
  console.log('useAsync => reducer:', action)
  switch (action.type) {
    case 'ASYNC_REQUEST':
      return {
        loading: true,
        data: null,
        error: null,
      }
    case 'ASYNC_SUCCESS':
      return {
        loading: false,
        data: action.data,
        error: null,
      }
    case 'ASYNC_FAILURE':
      return {
        loading: false,
        data: null,
        error: action.error,
      }
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

export type CallbackFn<T> = () => Promise<T>
export type FetchFn = () => void
export type CompleteFn<T> = (t: T) => void

function useAsync<T>(asyncName: string, callback: CallbackFn<T>, deps: React.DependencyList = [], afterMounted?: any, skip = false, completeFn?: CompleteFn<T>): [AsyncState<T>, FetchFn] {
  const initState = {
    loading: false,
    data: null,
    error: null,
  }
  const [state, dispatch] = useReducer(reducer<T>, initState)
  const mounted = useRef(false)

  const fetchData = async () => {
    dispatch({ asyncName, type: 'ASYNC_REQUEST' })

    try {
      const data = await callback()
      dispatch({ asyncName, type: 'ASYNC_SUCCESS', data })
      if (completeFn) {
        completeFn(data)
      }
    } catch (error) {
      dispatch({ asyncName, type: 'ASYNC_FAILURE', error })
    }
  }

  useEffect(() => {
    if (!skip) {
      if (afterMounted && !mounted.current) {
        console.log(asyncName, 'notMounted')
        mounted.current = true
        return
      }

      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return [state, fetchData]
}

export default useAsync
