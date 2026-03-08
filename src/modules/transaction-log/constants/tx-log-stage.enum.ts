export enum TxLogStage {
  /** 클라이언트로부터 rawTransaction 수신 */
  RECEIVED = 'RECEIVED',
  /** rawTransaction 검증 완료 (from, to, function, args) */
  VALIDATED = 'VALIDATED',
  /** feePayer 서명 + txHash 사전 계산 완료 */
  HASH_CALCULATED = 'HASH_CALCULATED',
  /** 블록체인 노드에 tx 브로드캐스트 완료 */
  BROADCAST = 'BROADCAST',
  /** 브로드캐스트 실패 */
  BROADCAST_FAILED = 'BROADCAST_FAILED',
}
