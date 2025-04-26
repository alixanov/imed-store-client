import { apiSlice } from "./api.service";

// `debtorApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const debtorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDebtor: builder.mutation({
      query: (debtor) => ({
        url: "/debtors",
        method: "POST",
        body: debtor,
      }),
    }),
    returnProductDebtor: builder.mutation({
      query: (body) => ({
        url: "/debtors/return",
        method: "POST",
        body,
      }),
    }),
    getDebtors: builder.query({
      query: () => ({
        url: "/debtors",
        method: "GET",
      }),
      providesTags: ["debtor"]
    }),
    updatePrice: builder.mutation({
      query: ({ id, sell_price }) => ({
        url: `/debtors/${id}/price`, // To'g'ri URL
        method: "PUT",
        body: { sell_price },
      }),
      invalidatesTags: ["debtor"]
    }),
    updateDebtor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/debtors/${id}`, // To'g'ri URL
        method: "PUT",
        body, // Faqat kerakli ma'lumotlar yuboriladi
      }),
    }),
    payDebt: builder.mutation({
      query: ({ id }) => ({
        url: `/debtors/${id}/pay`, // To'g'ri URL
        method: "PUT",
        body: {},
      }),
      invalidatesTags: ["debtor"]

    }),
    deleteDebtor: builder.mutation({
      query: (id) => ({
        url: `/debtors/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useUpdatePriceMutation,
  useCreateDebtorMutation,
  useGetDebtorsQuery,
  useUpdateDebtorMutation,
  useDeleteDebtorMutation,
  useReturnProductDebtorMutation,
  usePayDebtMutation,
} = debtorApi;
