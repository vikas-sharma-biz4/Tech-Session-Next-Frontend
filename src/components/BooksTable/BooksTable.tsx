'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { Book, BooksResponse } from '@/interfaces/books';
import LoadingSpinner from '@/components/LoadingSpinner';
import { API_ENDPOINTS } from '@/constants';
import usePagination from '@/hooks/usePagination';

const BOOK_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'non-fiction', label: 'Non-Fiction' },
  { value: 'academic', label: 'Academic' },
  { value: 'biography', label: 'Biography' },
  { value: 'other', label: 'Other' },
];

const BOOK_CONDITIONS = [
  { value: 'all', label: 'All Conditions' },
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'title', label: 'Title: A to Z' },
  { value: 'author', label: 'Author: A to Z' },
];

interface BookFilters {
  type?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  page?: number;
  limit?: number;
}

export default function BooksTable() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [searchInput, setSearchInput] = useState('');

  // Build API service function
  const apiService = useMemo(
    () => async (params: BookFilters) => {
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.type && params.type !== 'all') {
        queryParams.append('type', params.type);
      }
      if (params.condition && params.condition !== 'all') {
        queryParams.append('condition', params.condition);
      }
      if (params.minPrice) {
        queryParams.append('minPrice', params.minPrice);
      }
      if (params.maxPrice) {
        queryParams.append('maxPrice', params.maxPrice);
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }

      return api.get<{ message: string; data: BooksResponse }>(
        `${API_ENDPOINTS.BOOKS.LIST}?${queryParams.toString()}`
      );
    },
    []
  );

  // Build API params from filters
  const apiParams = useMemo<Partial<BookFilters>>(() => {
    const params: Partial<BookFilters> = {
      type: typeFilter,
      condition: conditionFilter,
      search: searchInput,
    };

    if (minPrice) {
      params.minPrice = minPrice;
    }
    if (maxPrice) {
      params.maxPrice = maxPrice;
    }

    // Handle sort options
    if (sortBy) {
      if (sortBy === 'price-desc') {
        params.sortBy = 'price';
        params.sortOrder = 'DESC';
      } else if (sortBy === 'price') {
        params.sortBy = 'price';
        params.sortOrder = 'ASC';
      } else {
        params.sortBy = sortBy;
        params.sortOrder = 'ASC';
      }
    }

    return params;
  }, [typeFilter, conditionFilter, minPrice, maxPrice, sortBy, searchInput]);

  // Use pagination hook - fetch all data on one page
  const {
    data: books,
    total,
    loading,
    fetchData,
  } = usePagination<BookFilters, Book>({
    apiService,
    limit: 1000, // Large limit to get all data
    apiParams,
    initialPage: 1,
  });

  // Fetch books when filters change
  useEffect(() => {
    fetchData(1); // Always fetch page 1 when filters change
  }, [typeFilter, conditionFilter, minPrice, maxPrice, sortBy, searchInput, fetchData]);

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
  };

  const handleConditionChange = (condition: string) => {
    setConditionFilter(condition);
  };

  const handlePriceChange = (field: 'min' | 'max', value: string) => {
    if (field === 'min') {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger fetch by updating searchInput state (already handled in useEffect)
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setConditionFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('created_at');
    setSearchInput('');
  };


  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const formatType = (type: string): string => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  const formatCondition = (condition: string): string => {
    return condition
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  const hasActiveFilters = typeFilter !== 'all' || conditionFilter !== 'all' || minPrice || maxPrice || sortBy !== 'created_at' || searchInput;

  return (
    <div className="w-full">
      {/* Filters and Search */}
      <div className="mb-6 bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header with Clear Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {/* First Row: Type, Condition, Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Type Filter */}
          <div className="relative">
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Filter by Type
              </span>
            </label>
            <div className="relative">
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${
                  typeFilter !== 'all' ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              >
                {BOOK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Condition Filter */}
          <div className="relative">
            <label htmlFor="condition-filter" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Filter by Condition
              </span>
            </label>
            <div className="relative">
              <select
                id="condition-filter"
                value={conditionFilter}
                onChange={(e) => handleConditionChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${
                  conditionFilter !== 'all' ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
              >
                {BOOK_CONDITIONS.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="relative">
            <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort By
              </span>
            </label>
            <div className="relative">
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${
                  sortBy !== 'created_at' ? 'border-purple-300 bg-purple-50' : 'border-gray-300'
                }`}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Price Range and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Min Price */}
          <div>
            <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Min Price
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  minPrice ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
                }`}
              />
            </div>
          </div>

          {/* Max Price */}
          <div>
            <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Max Price
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                id="max-price"
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                placeholder="No limit"
                className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  maxPrice ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
                }`}
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Books
              </span>
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by title, author, ISBN..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    searchInput ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TITLE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AUTHOR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TYPE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CONDITION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRICE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SELLER
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No books found. Try adjusting your filters or search terms.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{book.title}</div>
                      {book.isbn && (
                        <div className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{book.author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {formatType(book.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {formatCondition(book.condition)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(book.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{book.seller?.name || 'N/A'}</div>
                      {book.seller?.email && (
                        <div className="text-xs text-gray-500">{book.seller.email}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results Count */}
        {!loading && books.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{books.length}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

