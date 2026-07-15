declare module "midtrans-client" {
  type MidtransClientConfig = {
    isProduction: boolean
    serverKey: string
    clientKey?: string
  }

  type MidtransParameter =
    Record<string, unknown>

  type MidtransTransactionResponse = {
    token: string
    redirect_url: string
    [key: string]: unknown
  }

  type MidtransStatusResponse =
    Record<string, unknown>

  type SnapClient = {
    createTransaction(
      parameter: MidtransParameter
    ): Promise<MidtransTransactionResponse>

    createTransactionToken(
      parameter: MidtransParameter
    ): Promise<string>

    createTransactionRedirectUrl(
      parameter: MidtransParameter
    ): Promise<string>

    transaction: {
      status(
        orderId: string
      ): Promise<MidtransStatusResponse>
    }
  }

  type CoreApiClient = {
    transaction: {
      status(
        orderId: string
      ): Promise<MidtransStatusResponse>
    }
  }

  type MidtransClientModule = {
    Snap: new (
      config: MidtransClientConfig
    ) => SnapClient

    CoreApi: new (
      config: MidtransClientConfig
    ) => CoreApiClient
  }

  const midtransClient:
    MidtransClientModule

  export = midtransClient
}
