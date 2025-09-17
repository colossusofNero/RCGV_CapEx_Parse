import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {Transaction} from '@/types';
import {RootState} from '../index';

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  description?: string;
}

interface PaymentResponse {
  id: string;
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
  amount: number;
  currency: string;
}

interface TransactionListResponse {
  transactions: Transaction[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/',
  prepareHeaders: (headers, {getState}) => {
    const state = getState() as RootState;
    const token = state.user.currentUser?.token;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    headers.set('accept', 'application/json');
    headers.set('content-type', 'application/json');

    return headers;
  },
});

const baseQueryWithRetry = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Handle token refresh or logout
    console.warn('Unauthorized access - redirecting to login');
  }

  return result;
};

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Transaction', 'Payment'],
  keepUnusedDataFor: 300, // 5 minutes
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: builder => ({
    processPayment: builder.mutation<PaymentResponse, PaymentRequest>({
      query: payment => ({
        url: 'payments',
        method: 'POST',
        body: payment,
      }),
      invalidatesTags: ['Transaction'],
    }),

    getTransactions: builder.query<TransactionListResponse, {
      page?: number;
      limit?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }>({
      query: (params = {}) => ({
        url: 'transactions',
        params: {
          page: 1,
          limit: 20,
          ...params,
        },
      }),
      providesTags: result =>
        result
          ? [
              ...result.transactions.map(({id}) => ({type: 'Transaction' as const, id})),
              {type: 'Transaction', id: 'LIST'},
            ]
          : [{type: 'Transaction', id: 'LIST'}],
      serializeQueryArgs: ({queryArgs}) => {
        const {page, ...rest} = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, {arg}) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          transactions: [...currentCache.transactions, ...newItems.transactions],
        };
      },
      forceRefetch({currentArg, previousArg}) {
        return currentArg?.page !== previousArg?.page;
      },
    }),

    getTransaction: builder.query<Transaction, string>({
      query: id => `transactions/${id}`,
      providesTags: (_result, _error, id) => [{type: 'Transaction', id}],
    }),

    updateTransactionStatus: builder.mutation<Transaction, {
      id: string;
      status: Transaction['status'];
    }>({
      query: ({id, status}) => ({
        url: `transactions/${id}`,
        method: 'PATCH',
        body: {status},
      }),
      invalidatesTags: (_result, _error, {id}) => [{type: 'Transaction', id}],
    }),

    getPaymentMethods: builder.query<any[], void>({
      query: () => 'payment-methods',
      keepUnusedDataFor: 600, // 10 minutes - payment methods don't change often
    }),

    validatePayment: builder.query<{isValid: boolean; errors?: string[]}, PaymentRequest>({
      query: payment => ({
        url: 'payments/validate',
        method: 'POST',
        body: payment,
      }),
    }),
  }),
});

export const {
  useProcessPaymentMutation,
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
  useGetTransactionQuery,
  useUpdateTransactionStatusMutation,
  useGetPaymentMethodsQuery,
  useValidatePaymentQuery,
  useLazyValidatePaymentQuery,
} = paymentApi;