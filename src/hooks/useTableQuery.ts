import { useCallback, useEffect, useRef, useState } from "react";

import type { BaseQueryParams, PageResult } from "@/api/common";

interface UseTableQueryOptions<T, Q extends BaseQueryParams> {
  /**
   * 列表查询方法，必须是稳定引用（直接传 API 对象上的方法）
   */
  fetcher: (params: Q) => Promise<PageResult<T>>;
  /** 分页之外的初始查询条件 */
  defaultParams?: Partial<Q>;
  /** 每页条数，默认 10 */
  pageSize?: number;
}

/**
 * 列表分页查询
 * 页面只需要关心查询条件的变更
 */
export function useTableQuery<T, Q extends BaseQueryParams>({
  fetcher,
  defaultParams,
  pageSize = 10,
}: UseTableQueryOptions<T, Q>) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<T[]>([]);
  const [total, setTotal] = useState(0);

  // 连续切换查询条件时只认最后一次请求的结果
  const requestSeq = useRef(0);

  const [queryParams, setQueryParams] = useState<Q>(
    () =>
      ({
        pageNum: 1,
        pageSize,
        ...defaultParams,
      }) as Q
  );

  const fetchList = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const data = await fetcher(queryParams);
      if (seq !== requestSeq.current) return;
      setList(data.list ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      // 提示已由响应拦截器给出，这里只记录日志
      console.warn(error);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [fetcher, queryParams]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { loading, list, total, queryParams, setQueryParams, fetchList };
}
