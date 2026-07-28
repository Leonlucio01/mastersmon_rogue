let audioContext = null
let enabled =
  typeof window !== 'undefined' &&
  window.localStorage.getItem('mastersmon_combat_sound') === 'on'

function context() {
  if (!audioContext) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext
    if (!AudioContext) return null
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') audioContext.resume()
  return audioContext
}

function tone(frequency, duration, offset = 0, volume = 0.035, type = 'sine') {
  const ctx = context()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const start = ctx.currentTime + offset

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(45, frequency * 0.62),
    start + duration,
  )
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function isCombatSoundEnabled() {
  return enabled
}

export function setCombatSoundEnabled(nextEnabled) {
  enabled = nextEnabled
  window.localStorage.setItem(
    'mastersmon_combat_sound',
    nextEnabled ? 'on' : 'off',
  )
  if (nextEnabled) {
    context()
    tone(520, 0.09, 0, 0.022)
    tone(720, 0.12, 0.06, 0.018)
  }
}

export function playCombatEvent(event) {
  if (!enabled || !event) return

  if (event.skillName === 'Corte veloz') {
    tone(620, 0.1, 0, 0.035, 'sawtooth')
    tone(760, 0.1, 0.12, 0.03, 'sawtooth')
  } else if (event.skillName === 'Golpe sombrío') {
    tone(170, 0.38, 0, 0.05, 'triangle')
    tone(460, 0.18, 0.26, 0.035, 'sawtooth')
  } else if (event.skillName === 'Paso evasivo') {
    tone(440, 0.25, 0, 0.022)
    tone(820, 0.28, 0.08, 0.018)
  } else {
    tone(390, 0.13, 0, 0.032, 'square')
  }

  if (event.wasCritical) {
    tone(880, 0.26, 0.04, 0.045, 'sawtooth')
    tone(1320, 0.3, 0.1, 0.035)
  }
  if (event.enemyDamage > 0) {
    tone(120, 0.24, 0.24, 0.05, 'square')
  }
  if (event.playerEvaded) {
    tone(740, 0.15, 0.2, 0.02)
  }
  if (event.monsterDefeated) {
    tone(523, 0.25, 0.2, 0.03)
    tone(659, 0.28, 0.32, 0.03)
    tone(784, 0.36, 0.44, 0.035)
  }
}

export function playHealingSound() {
  if (!enabled) return
  tone(520, 0.22, 0, 0.022)
  tone(660, 0.24, 0.1, 0.022)
  tone(880, 0.32, 0.2, 0.025)
}
