import {
  StreamPositionsRequest,
  StreamPositionsResponse,
} from '@injectivelabs/exchange-api/injective_derivative_exchange_rpc_pb'
import { InjectiveDerivativeExchangeRPCClient } from '@injectivelabs/exchange-api/injective_derivative_exchange_rpc_pb_service'
import { TradeExecutionSide } from '@injectivelabs/ts-types'
import { DerivativeTransformer } from '../../transformers/DerivativeTransformer'
import { Position } from '../../types'

export type TradeStreamCallback = ({
  position,
  timestamp,
}: {
  position: Position | undefined
  timestamp: number
}) => void

const transformer = (response: StreamPositionsResponse) => {
  const position = response.getPosition()

  return {
    position: position
      ? DerivativeTransformer.grpcPositionToPosition(position)
      : undefined,
    timestamp: response.getTimestamp(),
  }
}

export class PositionStream {
  protected client: InjectiveDerivativeExchangeRPCClient

  protected endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
    this.client = new InjectiveDerivativeExchangeRPCClient(endpoint)
  }

  start({
    marketId,
    callback,
  }: {
    marketId: string
    callback: TradeStreamCallback
  }) {
    const request = new StreamPositionsRequest()
    request.setMarketId(marketId)

    const stream = this.client.streamPositions(request)

    stream.on('data', (response: StreamPositionsResponse) => {
      callback(transformer(response))
    })

    return stream
  }

  subaccount({
    marketId,
    subaccountId,
    callback,
  }: {
    marketId: string
    subaccountId: string
    executionSide?: TradeExecutionSide
    callback: TradeStreamCallback
  }) {
    const request = new StreamPositionsRequest()
    request.setMarketId(marketId)
    request.setSubaccountId(subaccountId)

    const stream = this.client.streamPositions(request)

    stream.on('data', (response: StreamPositionsResponse) => {
      callback(transformer(response))
    })

    return stream
  }
}
