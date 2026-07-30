import { useCallback, useEffect, useRef, useState } from 'react'

export const AUTO_FARM_INTERVAL_MS = 3000

const pauseMessages = {
  enemy: 'Auto-farm pausado: enemigo derrotado',
  defeated: 'Auto-farm detenido: necesitas descansar',
  zone: 'Auto-farm pausado: cambio de zona',
  replay: 'Auto-farm pausado: inicio de replay',
}

export function useAutoFarm({
  attack,
  character,
  enemy,
  isAttacking,
}) {
  const [status, setStatus] = useState('off')
  const [nextAttackAt, setNextAttackAt] = useState(null)
  const [clock, setClock] = useState(Date.now())
  const [notice, setNotice] = useState(null)
  const timeoutRef = useRef(null)
  const requestInFlightRef = useRef(false)
  const statusRef = useRef(status)
  const attackRef = useRef(attack)
  const stateRef = useRef({ character, enemy, isAttacking })
  const runAttackRef = useRef(null)

  useEffect(() => {
    attackRef.current = attack
    stateRef.current = { character, enemy, isAttacking }
  }, [attack, character, enemy, isAttacking])

  const updateStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const clearScheduledAttack = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setNextAttackAt(null)
  }, [])

  const scheduleNextAttack = useCallback((delay = AUTO_FARM_INTERVAL_MS) => {
    if (statusRef.current !== 'active') return
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setNextAttackAt(Date.now() + delay)
    timeoutRef.current = window.setTimeout(() => {
      runAttackRef.current?.()
    }, delay)
  }, [])

  const pause = useCallback((reason, customMessage) => {
    clearScheduledAttack()
    updateStatus(`paused-${reason}`)
    setNotice({
      message: customMessage ?? pauseMessages[reason],
      id: Date.now(),
    })
  }, [clearScheduledAttack, updateStatus])

  const stop = useCallback(() => {
    clearScheduledAttack()
    updateStatus('off')
    setNotice(null)
  }, [clearScheduledAttack, updateStatus])

  const start = useCallback(() => {
    const current = stateRef.current
    if (current.character.health <= 0) {
      pause('defeated')
      return
    }
    if (current.enemy.health <= 0) {
      pause('enemy')
      return
    }

    updateStatus('active')
    setNotice(null)
    window.setTimeout(() => scheduleNextAttack(), 0)
  }, [pause, scheduleNextAttack, updateStatus])

  const toggle = useCallback(() => {
    if (
      statusRef.current === 'active' ||
      statusRef.current === 'paused-enemy'
    ) {
      stop()
    } else {
      start()
    }
  }, [start, stop])

  const pauseForContext = useCallback((reason = 'zone') => {
    if (statusRef.current === 'off') return
    pause(reason)
  }, [pause])

  runAttackRef.current = async () => {
    if (statusRef.current !== 'active') return

    const current = stateRef.current
    if (current.character.health <= 0) {
      pause('defeated')
      return
    }
    if (current.enemy.health <= 0) {
      pause('enemy')
      return
    }
    if (requestInFlightRef.current || current.isAttacking) {
      scheduleNextAttack(400)
      return
    }

    requestInFlightRef.current = true
    setNextAttackAt(null)
    try {
      const result = await attackRef.current()
      if (statusRef.current !== 'active') return
      if (result?.playerDefeated || result?.character?.health <= 0) {
        pause('defeated')
      } else if (result?.monsterDefeated || result?.enemy?.health <= 0) {
        pause('enemy')
      } else {
        scheduleNextAttack()
      }
    } finally {
      requestInFlightRef.current = false
    }
  }

  useEffect(() => {
    if (status !== 'active') return undefined
    const intervalId = window.setInterval(() => setClock(Date.now()), 100)
    return () => window.clearInterval(intervalId)
  }, [status])

  useEffect(() => {
    if (status === 'active' && character.health <= 0) {
      pause('defeated')
    } else if (status === 'active' && enemy.health <= 0) {
      pause('enemy')
    }
  }, [character.health, enemy.health, pause, status])

  useEffect(() => {
    if (status === 'paused-enemy' && enemy.health > 0) {
      updateStatus('active')
      setNotice({
        message: 'Auto-farm reanudado: nuevo objetivo',
        id: Date.now(),
      })
      window.setTimeout(() => scheduleNextAttack(), 0)
    }
  }, [enemy.health, scheduleNextAttack, status, updateStatus])

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  const remainingMs = nextAttackAt
    ? Math.max(0, nextAttackAt - clock)
    : 0
  const nextAttackSeconds = Math.ceil(remainingMs / 1000)
  const countdownProgress = nextAttackAt
    ? Math.min(100, Math.max(0, (1 - remainingMs / AUTO_FARM_INTERVAL_MS) * 100))
    : 0

  let activity = 'Auto-farm disponible'
  if (status === 'active') {
    activity = isAttacking
      ? `${character.name} está atacando automáticamente...`
      : nextAttackSeconds <= 1
        ? 'Preparando siguiente golpe...'
        : 'Buscando oportunidad de ataque...'
  } else if (status === 'paused-enemy') {
    activity = 'Objetivo derrotado · Pulsa Siguiente enemigo para continuar'
  } else if (status === 'paused-defeated') {
    activity = 'Necesitas descansar antes de continuar'
  } else if (status === 'paused-zone' || status === 'paused-replay') {
    activity = 'Reactiva el auto-farm cuando estés listo'
  }

  return {
    status,
    notice,
    activity,
    nextAttackSeconds,
    countdownProgress,
    requestInFlight: requestInFlightRef.current,
    toggle,
    stop,
    pauseForContext,
  }
}
