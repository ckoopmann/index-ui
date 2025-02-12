import React, { useCallback, useState } from 'react'

import { provider } from 'web3-core'

import ConfirmTransactionModal, {
  TransactionStatusType,
} from 'components/ConfirmTransactionModal'
import {
  farmTwoAddress,
  uniswapEthDpiLpTokenAddress,
} from 'constants/ethContractAddresses'
import useApproval from 'hooks/useApproval'
import useTransactionWatcher from 'hooks/useTransactionWatcher'
import useWallet from 'hooks/useWallet'
import {
  claimEarnedIndexLpReward,
 farmTwoStartTime,  stakeUniswapEthDpiLpTokens,
  unstakeAndClaimEarnedIndexLpReward,
  unstakeUniswapEthDpiLpTokens } from 'index-sdk/farmTwo'
import BigNumber from 'utils/bignumber'
import { waitTransaction } from 'utils/index'

import Context from './Context'

const Provider: React.FC = ({ children }) => {
  const [confirmTxModalIsOpen, setConfirmTxModalIsOpen] = useState(false)

  const {
    transactionId,
    transactionStatus,
    onSetTransactionStatus,
    onSetTransactionId,
  } = useTransactionWatcher()
  const { account, ethereum } = useWallet()

  const { isApproved, isApproving, onApprove } = useApproval(
    uniswapEthDpiLpTokenAddress,
    farmTwoAddress,
    () => setConfirmTxModalIsOpen(false)
  )

  const handleApprove = useCallback(() => {
    setConfirmTxModalIsOpen(true)
    onApprove()
  }, [onApprove, setConfirmTxModalIsOpen])

  const handleStake = useCallback(
    async (amount: string) => {
      if (!ethereum || !account || !amount || new BigNumber(amount).lte(0))
        return

      setConfirmTxModalIsOpen(true)
      onSetTransactionStatus(TransactionStatusType.IS_APPROVING)

      const bigStakeQuantity = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(18)
      )
      const transactionId = await stakeUniswapEthDpiLpTokens(
        ethereum as provider,
        account,
        bigStakeQuantity
      )

      if (!transactionId) {
        onSetTransactionStatus(TransactionStatusType.IS_FAILED)
        return
      }

      onSetTransactionId(transactionId)
      onSetTransactionStatus(TransactionStatusType.IS_PENDING)

      const success = await waitTransaction(ethereum as provider, transactionId)

      if (success) {
        onSetTransactionStatus(TransactionStatusType.IS_COMPLETED)
      } else {
        onSetTransactionStatus(TransactionStatusType.IS_FAILED)
      }
    },
    [
      ethereum,
      account,
      setConfirmTxModalIsOpen,
      onSetTransactionId,
      onSetTransactionStatus,
    ]
  )

  const handleUnstake = useCallback(
    async (amount: string) => {
      if (!ethereum || !account || !amount || new BigNumber(amount).lte(0))
        return

      setConfirmTxModalIsOpen(true)
      onSetTransactionStatus(TransactionStatusType.IS_APPROVING)

      const bigStakeQuantity = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(18)
      )
      const transactionId = await unstakeUniswapEthDpiLpTokens(
        ethereum as provider,
        account,
        bigStakeQuantity
      )

      if (!transactionId) {
        onSetTransactionStatus(TransactionStatusType.IS_FAILED)
        return
      }

      onSetTransactionId(transactionId)
      onSetTransactionStatus(TransactionStatusType.IS_PENDING)

      const success = await waitTransaction(ethereum as provider, transactionId)

      if (success) {
        onSetTransactionStatus(TransactionStatusType.IS_COMPLETED)
      } else {
        onSetTransactionStatus(TransactionStatusType.IS_FAILED)
      }
    },
    [
      ethereum,
      account,
      setConfirmTxModalIsOpen,
      onSetTransactionId,
      onSetTransactionStatus,
    ]
  )

  const handleHarvest = useCallback(async () => {
    if (!ethereum || !account) return

    setConfirmTxModalIsOpen(true)
    onSetTransactionStatus(TransactionStatusType.IS_APPROVING)

    const transactionId = await claimEarnedIndexLpReward(
      ethereum as provider,
      account
    )

    if (!transactionId) {
      onSetTransactionStatus(TransactionStatusType.IS_FAILED)
      return
    }

    onSetTransactionId(transactionId)
    onSetTransactionStatus(TransactionStatusType.IS_PENDING)

    const success = await waitTransaction(ethereum as provider, transactionId)

    if (success) {
      onSetTransactionStatus(TransactionStatusType.IS_COMPLETED)
    } else {
      onSetTransactionStatus(TransactionStatusType.IS_FAILED)
    }
  }, [
    ethereum,
    account,
    setConfirmTxModalIsOpen,
    onSetTransactionId,
    onSetTransactionStatus,
  ])

  const handleUnstakeAndHarvest = useCallback(async () => {
    if (!ethereum || !account) return

    setConfirmTxModalIsOpen(true)
    onSetTransactionStatus(TransactionStatusType.IS_APPROVING)

    const transactionId = await unstakeAndClaimEarnedIndexLpReward(
      ethereum as provider,
      account
    )

    if (!transactionId) {
      onSetTransactionStatus(TransactionStatusType.IS_FAILED)
      return
    }

    onSetTransactionId(transactionId)
    onSetTransactionStatus(TransactionStatusType.IS_PENDING)

    const success = await waitTransaction(ethereum as provider, transactionId)

    if (success) {
      onSetTransactionStatus(TransactionStatusType.IS_COMPLETED)
    } else {
      onSetTransactionStatus(TransactionStatusType.IS_FAILED)
    }
  }, [
    ethereum,
    account,
    setConfirmTxModalIsOpen,
    onSetTransactionId,
    onSetTransactionStatus,
  ])

  const currentTime = Date.now()
  const isPoolActive = new BigNumber(farmTwoStartTime).isLessThan(
    new BigNumber(currentTime)
  )

  return (
    <Context.Provider
      value={{
        isPoolActive,
        isApproved,
        isApproving,
        onApprove: handleApprove,
        onHarvest: handleHarvest,
        onUnstakeAndHarvest: handleUnstakeAndHarvest,
        onStake: handleStake,
        onUnstake: handleUnstake,
      }}
    >
      {children}
      <ConfirmTransactionModal
        isOpen={confirmTxModalIsOpen}
        transactionId={transactionId}
        transactionMiningStatus={transactionStatus}
        onDismiss={() => {
          setConfirmTxModalIsOpen(false)
          onSetTransactionStatus(undefined)
        }}
      />
    </Context.Provider>
  )
}

export default Provider
