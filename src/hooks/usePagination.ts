import { useCallback, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';

export interface IUsePaginationParams<TParams> {
  apiService: (params: TParams) => Promise<AxiosResponse>;
  limit?: number;
  apiParams?: Partial<TParams>;
  initialPage?: number;
  infiniteScroll?: boolean; // Enable infinite scroll mode
}

export interface IUsePaginationReturn<TParams, TData> {
  data: TData[];
  currentPage: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  apiResponse: AxiosResponse | undefined;
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
  fetchData: (page?: number, otherParams?: Partial<TParams>) => Promise<void>;
  loadMore: () => Promise<void>; // Load next page (for infinite scroll)
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  goToPage: (page: number) => void;
  reset: () => void;
}

const DEFAULT_LIMIT = 20;

const usePagination = <TParams extends { page?: number; limit?: number }, TData extends { id?: string | number }>({
  apiService,
  limit = DEFAULT_LIMIT,
  apiParams,
  initialPage = 1,
  infiniteScroll = false,
}: IUsePaginationParams<TParams>): IUsePaginationReturn<TParams, TData> => {
  const [data, setData] = useState<TData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<AxiosResponse | undefined>();

  /**
   * Fetch data
   */
  const fetchData = useCallback(
    async (page?: number, otherParams?: Partial<TParams>) => {
      const targetPage = page !== undefined ? page : currentPage;
      const isFirstPage = targetPage === 1 || targetPage === initialPage;
      
      // Prevent duplicate requests if already loading the same page
      if (loading && targetPage === currentPage) {
        return;
      }
      
      setLoading(true);

      try {
        const res = await apiService({
          ...apiParams,
          ...otherParams,
          page: targetPage,
          limit: limit || DEFAULT_LIMIT,
        } as TParams);

        setApiResponse(res);

        // Support both data.data and data.items response formats
        if (res.data) {
          const responseData = res.data as {
            data?: { books?: TData[]; items?: TData[]; data?: TData[]; total?: number; totalPages?: number; page?: number };
            items?: TData[];
            books?: TData[];
            total?: number;
            totalPages?: number;
            page?: number;
          };

          // Try to extract data from different response structures
          let items: TData[] | undefined;
          let totalCount = 0;
          let totalPagesCount = 1;
          let pageNum = targetPage;

          if (responseData.data) {
            // Nested structure: { data: { books: [], total: 10, totalPages: 1 } }
            const nested = responseData.data;
            items = (nested.books || nested.items || nested.data) as TData[] | undefined;
            totalCount = nested.total || 0;
            totalPagesCount = nested.totalPages || 1;
            pageNum = nested.page || targetPage;
          } else if (responseData.books) {
            // Direct structure: { books: [], total: 10, totalPages: 1 }
            items = responseData.books;
            totalCount = responseData.total || 0;
            totalPagesCount = responseData.totalPages || 1;
            pageNum = responseData.page || targetPage;
          } else if (responseData.items) {
            // Items structure: { items: [], total: 10, totalPages: 1 }
            items = responseData.items;
            totalCount = responseData.total || 0;
            totalPagesCount = responseData.totalPages || 1;
            pageNum = responseData.page || targetPage;
          }

          if (items) {
            // For infinite scroll: append new items if loading next page, replace if first page
            if (infiniteScroll && !isFirstPage) {
              // Infinite scroll mode: append data for subsequent pages (page 2+)
              setData((prevData) => {
                // Prevent duplicates by checking if items already exist
                const existingIds = new Set(prevData.map((item: TData) => item.id).filter((id): id is string | number => id !== undefined));
                const newItems = items.filter((item: TData) => item.id === undefined || !existingIds.has(item.id));
                return [...prevData, ...newItems];
              });
            } else {
              // First page or non-infinite scroll: replace data
              setData(items);
            }
            setTotal(totalCount);
            setTotalPages(totalPagesCount);
            setCurrentPage(pageNum);
            setHasMore(pageNum < totalPagesCount);
          } else {
            setHasMore(false);
            if (isFirstPage) {
              setData([]);
            }
          }
        } else {
          setHasMore(false);
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setHasMore(false);
        if (targetPage === 1 || targetPage === initialPage) {
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, limit, apiParams, apiService, infiniteScroll, initialPage, loading]
  );

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        fetchData(page);
      }
    },
    [totalPages, currentPage, fetchData]
  );

  /**
   * Load more data (for infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (hasMore && !loading && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      await fetchData(nextPage);
    }
  }, [hasMore, loading, currentPage, totalPages, fetchData]);

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(initialPage);
    setTotalPages(1);
    setTotal(0);
    setHasMore(false);
    setApiResponse(undefined);
  }, [initialPage]);

  useEffect(() => {
    return () => {
      setApiResponse(undefined);
      setLoading(false);
    };
  }, []);

  return {
    data,
    currentPage,
    totalPages,
    total,
    hasMore,
    loading,
    apiResponse,
    setData,
    fetchData,
    loadMore,
    setLoading,
    goToPage,
    reset,
  };
};

export default usePagination;

