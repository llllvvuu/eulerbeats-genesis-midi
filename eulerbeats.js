(function (window) {
/*eslint-env es2017*/

window.EulerBeats = {}
window.EulerBeats.version = '1.1.1'

console.log(`
EulerBeats ${window.EulerBeats.version}

Usage:

var seed = 0x41a010103 // token id number or hex string

// Assuming there is an element such as <div id="eulerbeats"/>
EulerBeats.visual.render(document.getElementById("eulerbeats"), seed)
// ...and click on the image

// Audio only:
EulerBeats.audio.play(seed)
// ...and click somewhere on the page if no audio comes out

// Before playing another:
EulerBeats.audio.stop()

`)

window.EulerBeats.decodeSeed = seed => {
  if (typeof seed == 'number') {
    seed = seed.toString(16)
  }
  if (seed.startsWith('0x')) {
    seed = seed.slice(2)
  }
  if (seed.length % 2 != 0) {
    seed = '0' + seed
  }

  const byte = i => parseInt(seed.substr(i * 2, 2), 16)

  let gridLengthLever = byte(0)
  const isPrint = Boolean(gridLengthLever & 0x80)
  if (isPrint) gridLengthLever -= 0x80
  const horizontalLever = byte(1)
  const diagonalLever = byte(2)
  const paletteLever = byte(3)
  const innerShapeLever = byte(4)

  return {
    gridLengthLever,
    horizontalLever,
    diagonalLever,
    paletteLever,
    innerShapeLever,
    originalSeed: gridLengthLever.toString() + seed.slice(2),
    isPrint,
    gridLength: gridLengthLever + 7,
    xOffset: diagonalLever + horizontalLever + 2,
    yOffset: diagonalLever + 1,
    palette: window.EulerBeats.visual.PALETTES[paletteLever],
    innerShape: window.EulerBeats.visual.INNER_SHAPES[window.EulerBeats.visual.INNER_SHAPES_KEYS[innerShapeLever]],
  }
}

function gcd(a, b) {
  if (!b) {
    return a
  }
  return gcd(b, a % b)
}
const EBV = {}

window.EulerBeats.visual = EBV

EBV.elementStates = {}
EBV.animationTimeouts = []
EBV.animationIntervals = []

EBV.INNER_SHAPES_KEYS = ['square', 'squareCircle', 'squareDiamond', 'circle']
EBV.INNER_SHAPES = {
  square: 'square',
  squareCircle: 'squareCircle',
  squareDiamond: 'squareDiamond',
  circle: 'circle',
}
EBV.PALETTES = [
  {
    // 3
    onColorMain: '#b67fd8',
    onColorSecondary: '#d0d1ff',
    offColorMain: '#ffcbf2',
    offColorSecondary: '#f3c4fb',
    shadowColor: 'rgba(192, 253, 255, 0.7)',
  },
  {
    // 6
    onColorMain: '#80b918',
    onColorSecondary: '#fff70e',
    offColorMain: '#eeef20',
    offColorSecondary: '#ffff3f',
    shadowColor: 'rgba(43, 147, 72, 0.7)',
  },
  {
    // 8
    onColorMain: '#3a6ea5',
    onColorSecondary: '#004e98',
    offColorMain: '#c0c0c0',
    offColorSecondary: '#ebebeb',
    shadowColor: 'rgba(255, 103, 0, 0.7)',
  },
  {
    // 9
    onColorMain: '#d81159',
    onColorSecondary: '#ffbc42',
    offColorMain: '#73d2de',
    offColorSecondary: '#218380',
    shadowColor: 'rgba(255, 188, 66, 0.7)',
  },
  {
    // 10
    onColorMain: '#f2542d',
    onColorSecondary: '#f5dfbb',
    offColorMain: '#0e9594',
    offColorSecondary: '#127475',
    shadowColor: 'rgba(86, 44, 44, 0.7)',
  },
  {
    // 12
    onColorMain: '#ec0868',
    onColorSecondary: '#fc2f00',
    offColorMain: '#ffbc0a',
    offColorSecondary: '#ec7d10',
    shadowColor: 'rgba(194, 0, 251, 0.7)',
  },
  {
    // 14
    onColorMain: '#ba181b',
    onColorSecondary: '#e5383b',
    offColorMain: '#d3d3d3',
    offColorSecondary: '#f5f3f4',
    shadowColor: 'rgba(102, 7, 8, 0.7)',
  },
  {
    // 15
    onColorMain: '#ff206e',
    onColorSecondary: '#fbff12',
    offColorMain: '#41ead4',
    offColorSecondary: '#ffffff',
    shadowColor: 'rgba(61, 52, 139, 0.7)',
  },
  {
    // 16
    onColorMain: '#7a6ee2',
    onColorSecondary: '#da6cdc',
    offColorMain: '#f7b801',
    offColorSecondary: '#f18701',
    shadowColor: 'rgba(243, 91, 4, 0.7)',
  },
  {
    // 17
    onColorMain: '#d0b8ac',
    onColorSecondary: '#f3d8c7',
    offColorMain: '#efe5dc',
    offColorSecondary: '#fbfefb',
    shadowColor: 'rgba(255, 159, 28, 0.7)',
  },
  {
    // 18
    onColorMain: '#ef476f',
    onColorSecondary: '#ffc43d',
    offColorMain: '#1b9aaa',
    offColorSecondary: '#06d6a0',
    shadowColor: 'rgba(248, 255, 229, 0.7)',
  },
  {
    onColorMain: '#FFAEBC',
    onColorSecondary: '#A0E7E5',
    offColorMain: '#1B4F8C8',
    offColorSecondary: '#06d6a0',
    shadowColor: 'rgb(251, 231, 198, 0.7)',
  },
]

EBV.getStyles = (id, containerSize, cellSize, palette) => `
  #${id}.eulerbeats-main {
    width: ${containerSize}px;
    height: ${containerSize}px;
    background-color: ${palette.shadowColor};
    position: relative;
    cursor: pointer;
    background-color: black;
    border-radius: 50%;
    box-shadow: 0 0 5px 5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    position: relative;
  }

  #${id}.eulerbeats-main.eulerbeats-is-playing {
    animation: spin 6s infinite linear;
  }

  #${id}.eulerbeats-main::after {
    content: '';
    width: 100%;
    height: 100%;
    background-color: #333;
    transform: scale(0.92);
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }

  #${id}.eulerbeats-main:before {
    content: '';
    width: 100%;
    height: 100%;
    background-color: black;
    transform: scale(0.3);
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
  }

  #${id}.eulerbeats-main > .eulerbeats-inner {
    transform: scale(0.75);
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
  }

  #${id}.eulerbeats-main .eulerbeats-cell:not(.highlighted) {
    opacity: 0;
  }

  #${id} .eulerbeats-inner {
    display: flex;
  }

  #${id} .eulerbeats-inner:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${cellSize / 2}px;
    height: ${cellSize / 2}px;
    margin-left: -${cellSize / 4}px;
    margin-top: -${cellSize / 4}px;
    z-index: 3;
    background-color: white;
    border-radius: 50%;
  }

  #${id} .eulerbeats-col {
    display: flex;
    flex-direction: column; 
  }

  #${id} .eulerbeats-col > div:nth-child(2n):not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  #${id} .eulerbeats-cell {
    width: ${cellSize}px;
    height: ${cellSize}px;
    background-color: ${palette.offColorMain};
    position: relative;
    opacity: 0.7;
  }

  #${id}.eulerbeats-is-playing .eulerbeats-cell.highlighted.pulse {
    animation: pop 1s ease-in-out;
    animation-iteration-count: 1;
    opacity: 1;
  }

  #${id}.eulerbeats-is-playing .eulerbeats-cell.highlighted.smallPulse {
    animation: smallPop 1s ease-in-out;
    animation-iteration-count: 1;
    opacity: 1;
  }

  #${id} .eulerbeats-cell.highlighted {
    background-color: ${palette.onColorMain};
  }

  #${id} .eulerbeats-cell.eulerbeats-shape-circle {
    border-radius: 50%;
  }

  #${id} .eulerbeats-cell.eulerbeats-shape-squareCircle:after {
    content: '';
    width: ${cellSize}px;
    height: ${cellSize}px;
    background-color: ${palette.offColorSecondary};
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(0.7);
  }

  #${id} .eulerbeats-cell.highlighted.eulerbeats-shape-squareCircle:after {
    border-color: ${palette.onColorSecondary} transparent transparent transparent;
  }

  #${id} .eulerbeats-cell.eulerbeats-shape-squareDiamond:after {
    content: '';
    width: ${cellSize}px;
    height: ${cellSize}px;
    background-color: ${palette.offColorSecondary};
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(0.5) rotate(45deg);
  }
  
  #${id} .eulerbeats-cell.highlighted.eulerbeats-shape-squareDiamond:after {
    background-color: ${palette.onColorSecondary};
  }

  @keyframes spin { 
    from { 
      transform: rotate(0deg); 
    }
    to { 
      transform: rotate(360deg); 
    }
  }

  @keyframes pop {
    0% {
        transform: scale(1);
        filter: hue-rotate(0);
    }
    5% {
        transform: scale(1.5);
        filter: hue-rotate(45deg);
    }
    60% {
        transform: scale(0.75);
    }
    100% {
        transform: scale(1);
        filter: hue-rotate(0);
    }
  }

  @keyframes smallPop {
    0% {
        transform: scale(1);
        filter: hue-rotate(0);
    }
    5% {
        transform: scale(1.1);
        filter: hue-rotate(-45deg);
    }
    60% {
        transform: scale(0.8);
    }
    100% {
        transform: scale(1);
        filter: hue-rotate(0);
    }
  }
`

const addStyles = (id, containerSize, cellSize, palette) => {
  const style = document.createElement('style')
  style.textContent = EBV.getStyles(id, containerSize, cellSize, palette)
  document.head.append(style)
}

const pulseAnimation = (id, center, waveDelay) => {
  for (let i = 0; i <= center; i++) {
    ripple(id, center, i, waveDelay)
  }
}

const melodyAnimation = (id, center, gridLength) => {
  if (gridLength % 2 === 0) {
    smallPop(id, center, center)
    smallPop(id, center, center - 1)
    smallPop(id, center - 1, center)
    smallPop(id, center - 1, center - 1)
  } else {
    smallPop(id, center, center)
    smallPop(id, center - 1, center)
    smallPop(id, center + 1, center)
    smallPop(id, center, center + 1)
    smallPop(id, center, center - 1)
  }
}

const snareAnimation = id => pop(id, EBV.elementStates[id].beatIndex, 2)

const hihatAnimation = id => pop(id, EBV.elementStates[id].beatIndex, 1)

const kickAnimation = id => pop(id, EBV.elementStates[id].beatIndex, 0)

const kick2Animation = (id, gridLength) => pop(id, gridLength - 1, EBV.elementStates[id].beatIndex)

const ripple = (id, center, radius, waveDelay) => {
  if (radius === 0) {
    smallPop(id, center, center)
  } else {
    setTimeout(() => {
      for (let i = 0; i < radius * 2 + 1; i++) {
        smallPop(id, center - radius + i, center - radius)
        smallPop(id, center - radius, center - radius + i)
        smallPop(id, center + radius - i, center - radius)
        smallPop(id, center + radius, center + radius - i)
      }
    }, waveDelay * radius)
  }
}

const pop = (id, x, y) => {
  const cell = document.querySelector(`#${id} .eulerbeats-cell-${x}-${y}`)
  if (!cell) {
    return
  }
  cell.classList.add('pulse')
  setTimeout(() => {
    cell.classList.remove('pulse')
  }, 1000)
}

const smallPop = (id, x, y) => {
  const cell = document.querySelector(`#${id} .eulerbeats-cell-${x}-${y}`)
  if (!cell) {
    return
  }
  cell.classList.add('smallPulse')
  setTimeout(() => {
    cell.classList.remove('smallPulse')
  }, 1000)
}

const setupAnimation = (tracks, key, frequency, animationFunc) => {
  EBV.animationTimeouts.push(
    setTimeout(() => {
      console.log(`starting ${key}`)
      const animationInterval = setInterval(animationFunc, frequency)
      EBV.animationIntervals.push(animationInterval)
      EBV.animationTimeouts.push(
        setTimeout(() => {
          console.log(`ending ${key}`)
          clearInterval(animationInterval)
        }, tracks[key].duration * 1000)
      )
    }, (tracks[key].start + window.EulerBeats.audio.options.startDelay + window.EulerBeats.audio.Gibberish.ctx.baseLatency) * 1000 - frequency)
  )
}

const clearIntervalsTimeouts = () => {
  while (EBV.animationIntervals.length) {
    clearInterval(EBV.animationIntervals.pop())
  }
  while (EBV.animationTimeouts.length) {
    clearTimeout(EBV.animationTimeouts.pop())
  }
}

const setupAnimations = (id, bpm, gridLength, tracks) => {
  const bps = bpm / 60
  const beatFrequencyMs = (1 / bps) * 1000
  const pulseFrequencyMs = beatFrequencyMs * gridLength * 2
  const center = Math.floor(gridLength / 2)

  // beat interval used to track the current index inside the matrix
  const state = EBV.elementStates[id]
  state.beatIndex = 0
  EBV.animationIntervals.push(
    setInterval(() => {
      const index = state.beatIndex + 1
      state.beatIndex = index % gridLength
    }, beatFrequencyMs)
  )

  setupAnimation(tracks, 'melody', beatFrequencyMs * 2, () =>
    melodyAnimation(id, center, gridLength)
  )
  setupAnimation(tracks, 'chords', pulseFrequencyMs, () =>
    pulseAnimation(id, center, beatFrequencyMs)
  )
  setupAnimation(tracks, 'snare', beatFrequencyMs, () => snareAnimation(id))
  setupAnimation(tracks, 'kick', beatFrequencyMs, () => kickAnimation(id, gridLength))
  setupAnimation(tracks, 'kick2', beatFrequencyMs, () => kick2Animation(id, gridLength))
  setupAnimation(tracks, 'hat', beatFrequencyMs, () => hihatAnimation(id))
}

const stopAnimations = () => {
  clearIntervalsTimeouts()
  for (let id in EBV.elementStates) {
    const el = document.getElementById(id)
    if (el) {
      el.classList.remove('eulerbeats-is-playing')
    }
    const state = EBV.elementStates[id]
    state.isPlaying = false
    typeof state.callback == 'function' && state.callback(id, 'stop')
  }
}

EBV.play = async mainElement => {
  EBV.stop()
  const id = mainElement.id
  const state = EBV.elementStates[id]

  const {bpm, tracks, totalDuration} = await window.EulerBeats.audio.play(state.seed)
  EBV.animationTimeouts.push(setTimeout(() => stopAnimations(), (totalDuration + 3) * 1000))
  state.isPlaying = true
  mainElement.classList.add('eulerbeats-is-playing')

  const {gridLength} = window.EulerBeats.decodeSeed(state.seed)
  setupAnimations(id, bpm, gridLength, tracks)
  typeof state.callback == 'function' && state.callback(id, 'start')
}

EBV.stop = () => {
  stopAnimations()
  window.EulerBeats.audio.stop()
}

EBV.toggle = mainElement => {
  if (EBV.elementStates[mainElement.id].isPlaying) {
    EBV.stop()
  } else {
    EBV.play(mainElement)
  }
}

// callback(elementId, event: 'start' | 'stop')
EBV.render = (mainElement, seed, containerSize = 480, callback) => {
  if (!mainElement.id) {
    console.error('Element must have id')
    return
  }
  const decodedSeed = window.EulerBeats.decodeSeed(seed)
  console.log('Rendering', seed, decodedSeed)

  const id = mainElement.id

  EBV.elementStates[id] = {
    seed,
    callback,
    isPlaying: false,
    beatIndex: 0,
  }

  const {gridLength, xOffset, yOffset, palette, innerShape} = decodedSeed
  const cellSize = containerSize / gridLength

  addStyles(id, containerSize, cellSize, palette)

  mainElement.className = 'eulerbeats-main'
  mainElement.innerHTML = ''
  const innerDiv = document.createElement('div')
  innerDiv.className = 'eulerbeats-inner'
  mainElement.appendChild(innerDiv)

  mainElement.addEventListener('click', () => EBV.toggle(mainElement), false)

  for (let xIndex = 0; xIndex < gridLength; xIndex++) {
    const col = document.createElement('div')
    col.classList.add('eulerbeats-col')
    innerDiv.appendChild(col)
    for (let yIndex = 0; yIndex < gridLength; yIndex++) {
      const xParam = xIndex + xOffset
      const yParam = yIndex + yOffset
      const cell = document.createElement('div')
      cell.classList.add('eulerbeats-cell')
      cell.classList.add(`eulerbeats-cell-${xIndex}-${yIndex}`)
      if (xParam >= yParam && gcd(xParam, yParam) === 1) {
        cell.classList.add('highlighted')
      }
      cell.classList.add(`eulerbeats-shape-${innerShape}`)
      col.insertBefore(cell, col.children[0])
    }
  }
}
/*eslint-env es2017*/

const EBA = {}

window.EulerBeats.audio = EBA

EBA.overrides = {}
EBA.entryPoints = {}
EBA.entryPoints.fx = fx => (console.log(fx), fx)
EBA.entryPoints.tracks = (tracks, theme) => (console.log(tracks), tracks)
EBA.entryPoints.gibberish = gibberish => (console.log({gibberish}), gibberish)

EBA.options = {
  startDelay: 0.1,
  memoryAllocation: 1 * 60 * 44100, // initial memory allocation for 2 minutes
  bufferSize: 2048,
  audioContext: undefined,
  audioContextOptions: {
    latencyHint: 0.08,
  },
  audioWorkletNodeOptions: {
    outputChannelCount: [2],
  },
}

let initializingAudio = false

EBA.isReady = () => EBA.Gibberish && EBA.Gibberish.output

document.addEventListener('DOMContentLoaded', () => EBA.initialize().catch(console.error), false)

EBA.initialize = async function () {
  return new Promise((resolve, reject) => {
    if (!initializingAudio && !EBA.isReady()) {
      initializingAudio = true
      try {
        // eslint-disable-next-line no-new-func,no-undef
        const Gibberish = new Function(GibberishCommon + ';return Gibberish;')()
        Gibberish.bufferSize = EBA.options.bufferSize
        Gibberish.audioContextOptions = EBA.options.audioContextOptions
        Gibberish.audioWorkletNodeOptions = EBA.options.audioWorkletNodeOptions
        Gibberish.workletPath = window.URL.createObjectURL(
          // eslint-disable-next-line no-undef
          new Blob([[GibberishWorkletPre, GibberishCommon, GibberishWorkletPost].join('\n')], {
            type: 'text/javascript',
          })
        )
        Gibberish.init(EBA.options.memoryAllocation, EBA.options.audioContext).catch(err => {
          initializingAudio = false
          reject(err)
        })
        EBA.Gibberish = Gibberish
      } catch (err) {
        initializingAudio = false
        reject(err)
      }
    }
    function tryAgain() {
      if (EBA.isReady()) {
        initializingAudio = false
        resolve()
      } else {
        requestAnimationFrame(tryAgain)
      }
    }
    tryAgain()
  })
}

EBA.play = async (seed, overrides = {}) => {
  const decodedSeed = window.EulerBeats.decodeSeed(seed)
  console.log('Playing', seed, decodedSeed)

  const {gridLength, xOffset, yOffset, originalSeed} = decodedSeed
  const randomSeed = parseInt(originalSeed, 16)

  return EBA.initialize()
    .then(() => {
      // reallocate memory to garbage-collect previous plays
      EBA.Gibberish.memory = EBA.Gibberish.memory.create(EBA.options.memoryAllocation, Float64Array)
      const theme = EBA.generateTheme(randomSeed, gridLength, xOffset, yOffset, overrides)
      console.log(theme)
      const gibberish = EBA.generateGibberishCode(theme.tracks, theme.sampleTime)
      const env = {Gibberish: EBA.Gibberish}
      // eslint-disable-next-line no-new-func
      new Function(...Object.keys(env), `;Gibberish.export(window);` + gibberish)(
        ...Object.values(env)
      )
      return theme
    })
    .catch(console.error)
}

EBA.stop = () => {
  if (EBA.Gibberish && EBA.Gibberish.output) {
    EBA.Gibberish.clear()
  }
}

EBA.generateTheme = (randomSeed, pulses, xOffset, yOffset, overrides = {}) => {
  const random = new RandomContext(randomSeed)

  overrides = {...overrides, ...EBA.overrides}

  // this helps to preserve random seed sequence evaluating value without logic shortcut
  const override = (key, value) => overrides[key] ?? value

  const matrix = buildCoprimesMatrix(pulses, xOffset, yOffset)
  const getRow = row => matrix.map(col => col[row])
  const getCol = col => matrix[col]

  const INSTRUMENTS_COUNT = 6

  // feel the rhythm
  const minBpm = project(pulses, [7, 12], [200, 300])
  const bpm = override('bpm', project(random.int(0, 9), [0, 9], [minBpm, 400]))
  const beat = 60 / bpm
  const bar = beat * pulses
  const separation = bar * override('separationBars', 2)
  const totalDurationTarget = override('totalDurationTarget', 60 * 2)

  // choose among octaves 2 to 4
  const key = override('key', random.int(-14, 7))

  // choose among ionian (major), phrygian and aeolian (minor)
  const mode = override('mode', random.choose(1, 3, 6))
  const scale = override('scale', createScale(mode))

  // create a progression of degrees
  const progression = override('progression', createProgression(random))

  // create progression of chords from degrees over a scale in a given key
  let chords = progression.map(chordBuilder(scale)).map(transpose(key))

  // improvise a melody over the chords
  let melody = flatten(chords.map(improvBuilder(pulses, random)))

  if (progression.length <= 2) {
    chords = chords.concat(chords)
    melody = melody.concat(flatten(chords.map(improvBuilder(pulses, random))))
  }

  // times most patterns are repeated
  const repeats = override(
    'repeats',
    Math.max(1, Math.floor((totalDurationTarget - INSTRUMENTS_COUNT * separation) / bar))
  )

  // chords last twice than a bar, but if it's a 2 chord progression, make sure it's longer
  const melodyBeatFactor = override(
    'melodyBeatFactor',
    progression.length === 2 ? 2 : random.int(1, 2)
  )
  const chordsBarFactor = override('chordsBarFactor', 2 * melodyBeatFactor)
  const chordsValue = bar * chordsBarFactor
  const melodyValue = beat * melodyBeatFactor
  const chordsTime = chords.length * chordsValue
  const melodyTime = melody.length * melodyValue
  const percussionDuration = bar * repeats
  const chordsRepeats = Math.max(1, Math.ceil(percussionDuration / chordsTime))
  const melodyRepeats = Math.max(1, Math.ceil(percussionDuration / melodyTime))

  // select start time of different instruments
  const starts = random.shuffle(range(INSTRUMENTS_COUNT)).map(i => i * separation)
  let [kickStart, snareStart, hatStart, chordsStart, kick2Start, melodyStart] = starts

  const percussionEnd = percussionDuration + Math.max(kickStart, kick2Start, snareStart, hatStart)

  // sync chords and melody:
  // try to start one after the other, only if the result is not too long
  // otherwise, start at the same time.
  if (chordsStart > melodyStart) {
    const chordsStartNew = melodyStart + melodyTime
    const chordsEndNew = chordsStartNew + chordsTime * chordsRepeats
    chordsStart = chordsEndNew > percussionEnd ? melodyStart : chordsStartNew
  } else if (chordsStart < melodyStart) {
    const melodyStartNew = chordsStart + chordsTime
    const melodyEndNew = melodyStartNew + melodyTime * melodyRepeats
    melodyStart = melodyEndNew > percussionEnd ? chordsStart : melodyStartNew
  }

  // count coprimes per col and row to determine dynamic accents
  // ("partial totient function")
  const count = values => values.reduce((acc, cur) => acc + Number(cur), 0)
  const colCounts = range(pulses).map((_, i) => count(getCol(i)))
  const rowCounts = range(pulses).map((_, i) => count(getRow(i)))
  const accent = v => project(v, [0, pulses], [0.1, 0.5])
  const colAccents = colCounts.map(accent)
  const rowAccents = rowCounts.map(accent)

  const sampleRate = override('sampleRate', 44100)
  const sampleTime = time => time * sampleRate

  const beatify = timings(beat)
  const kickBeats = beatify(getRow(0))
  const kick2Beats = beatify(getCol(pulses - 1))
  const hatBeats = beatify(getRow(1))
  const snareBeats = beatify(getRow(2))

  const kickActualStart = kickStart + kickBeats.start
  const kick2ActualStart = kick2Start + kick2Beats.start
  const hatActualStart = hatStart + hatBeats.start
  const snareActualStart = snareStart + snareBeats.start

  const theme = {
    pulses,
    bpm,
    beat,
    bar,
    key,
    mode,
    keySPN: `${noteSPN(key, false)} ${mode == 1 ? 'Major' : mode == 6 ? 'Minor' : 'Mode ' + mode}`,
    scale,
    scaleSPN: scale.map(d => noteSPN(key + d, false)),
    progression,
    sampleRate,
    sampleTime,
    totalDurationTarget,
    chords,
    chordsSPN: chords.map(chord => chord.map(note => noteSPN(note))),
    melody,
    melodySPN: melody.map(note => noteSPN(note)),
    chordsBarFactor,
    melodyBeatFactor,
    colAccents,
    rowAccents,
  }

  const tracks = EBA.entryPoints.tracks(
    {
      kick: random.use(() => {
        return {
          type: 'trigger',
          instrument: 'Kick',
          instrumentConfig: {},
          chain: [
            {
              name: 'output',
              gain: 0.8,
            },
          ],
          timings: kickBeats.pauses,
          accents: colAccents,
          start: kickActualStart,
          repeats,
        }
      }),
      kick2: random.use(() => {
        return {
          type: 'trigger',
          instrument: 'Kick',
          instrumentConfig: {},
          chain: [
            {
              name: 'reverb2.input',
              gain: undefined,
            },
            {
              name: 'output',
              gain: 0.5,
            },
          ],
          timings: kick2Beats.pauses,
          accents: rowAccents,
          start: kick2ActualStart,
          repeats,
        }
      }),
      hat: random.use(() => {
        return {
          type: 'trigger',
          instrument: random.choose('Hat', 'Clave', 'Clap'),
          instrumentConfig: {},
          chain: [
            {
              name: 'output',
              gain: 0.17,
            },
          ],
          timings: hatBeats.pauses,
          accents: colAccents,
          start: hatActualStart,
          repeats,
        }
      }),
      snare: random.use(() => {
        const instrumentConfig = {
          decay: random.float(0.1, 0.2),
          snappy: random.float(0.1, 1.5),
          tune: random.float(-0.1, 0.1),
        }

        const chain = [
          {
            name: 'output',
            gain: 0.75,
          },
        ]
        const fx = random.int(0, 2)
        if (fx !== 2) {
          chain.unshift({
            name: ['reverb1.input', 'reverb2.input'][fx],
            gain: 0.5,
          })
        }

        return {
          type: 'trigger',
          instrument: 'Snare',
          instrumentConfig,
          chain,
          timings: snareBeats.pauses,
          accents: rowAccents,
          start: snareActualStart,
          repeats,
        }
      }),
      melody: random.use(() => {
        const config = {
          decay: sampleTime(bar / random.float(8, 16)),
          attack: sampleTime(bar / random.float(8, 16)),
          cutoff: random.float(0.1, 0.5),
          filterType: random.int(1, 4),
          filterMult: random.float(1, 3.5),
          Q: random.float(0.1, 0.5),
          waveform: random.choose('pwm', 'sine', 'triangle'),
          pulsewidth: random.float(0.1, 0.5),
          detune2: random.float(-1, 1),
          detune3: random.float(-1, 1),
          gain: random.float(0.3, 0.4),
        }
        // edge cases
        if (config.waveform == 'pwm' && config.filterType == 4) {
          config.filterMult = Math.min(config.filterMult, 1.5)
          config.gain = 0.2
        }

        const fx = random.int(0, 2)
        let chain
        if (fx < 2) {
          chain = [
            {
              name: ['reverb1.input', 'reverb2.input'][fx],
            },
            {
              name: 'output',
              gain: 0.2,
            },
          ]
        } else {
          chain = [
            {
              name: 'output',
              gain: 0.3,
            },
          ]
        }

        return {
          type: 'note',
          instrument: 'Synth',
          instrumentConfig: config,
          chain,
          values: melody.map(noteFrequency),
          timings: [melodyValue],
          start: melodyStart,
          repeats: melodyRepeats,
        }
      }),
      chords: random.use(() => {
        const instrumentConfig = {
          waveform: random.choose('pwm', 'sine', 'triangle'),
          pulsewidth: () => `Add( .35, Sine({ frequency:.9, gain:.3 }) )`,
          gain: random.float(0.05, 0.1),
          // glide: random.float(1, beat * 4),
          attack: sampleTime(random.float(beat / 4, 2)),
          decay: sampleTime(chordsValue * 2),
          shape: random.choose('exponential', 'linear'),
          antialias: true,
          filterType: 2,
          panVoices: true,
          cutoff: random.float(0.1, 2),
        }

        const chain = [{name: 'chorus'}, {name: 'output'}]

        return {
          type: 'chord',
          instrument: 'PolySynth',
          instrumentConfig,
          chain,
          values: chords.map(chord => chord.map(noteFrequency)),
          timings: [chordsValue],
          start: chordsStart,
          repeats: chordsRepeats,
        }
      }),
    },
    theme
  )

  tracks.kick.duration = percussionDuration - last(kickBeats.pauses)
  tracks.kick2.duration = percussionDuration - last(kick2Beats.pauses)
  tracks.snare.duration = percussionDuration - last(snareBeats.pauses)
  tracks.hat.duration = percussionDuration - last(hatBeats.pauses)
  tracks.chords.duration = chordsTime * chordsRepeats
  tracks.melody.duration = melodyTime * melodyRepeats

  theme.totalDuration = Math.max(
    kickActualStart + tracks.kick.duration,
    kick2ActualStart + tracks.kick2.duration,
    snareActualStart + tracks.snare.duration,
    hatActualStart + tracks.hat.duration,
    chordsStart + tracks.chords.duration,
    melodyStart + tracks.melody.duration
  )

  theme.tracks = tracks

  return theme
}

EBA.generateGibberishCode = (tracks, sampleTime) => {
  const fx = EBA.entryPoints.fx({
    reverb1: {roomSize: 0.75, damping: 0.1, input: () => 'Bus2()'},
    reverb2: {roomSize: 0.95, damping: 0.5, input: () => 'Bus2()'},
    chorus: {slowGain: 8, fastFrequency: 4, fastGain: 1},
  })
  return EBA.entryPoints.gibberish(`
    reverb1 = Freeverb(${stringifyLiteral(fx.reverb1)}).connect()
    reverb2 = Freeverb(${stringifyLiteral(fx.reverb2)}).connect()
    chorus = Chorus(${stringifyLiteral(fx.chorus)}).connect( reverb2.input )

    ${generateTracksCode(tracks, sampleTime)}
  `)
}

function generateTracksCode(tracks, sampleTime) {
  const code = []
  for (let key in tracks) {
    code.push(generateSequencerCode(tracks[key], sampleTime))
  }
  return code.join('\n')
}

function generateSequencerCode(track, sampleTime) {
  const timings = track.timings.map(sampleTime)
  let code = `
  inst = ${track.instrument}(${stringifyLiteral(track.instrumentConfig)})
  inst${track.chain
    .map(c => `.connect(${c.name === 'output' ? 'Gibberish.output' : c.name}, ${c.gain})`)
    .join('')}
  `
  if (track.type == 'trigger') {
    code += `Sequencer({
      target: inst, 
      key: 'trigger',
      values: ${stringifyLiteral(timings.map((_, i) => track.accents[i]))}, 
      timings: [${timings}], 
    })
    .repeat(${track.repeats})
    .start(${sampleTime(EBA.options.startDelay + track.start)})`
  } else {
    code += `Sequencer({
      target: inst, 
      key: '${track.type}',
      values: ${stringifyLiteral(track.values)}, 
      timings: [${timings}], 
    })
    .repeat(${track.repeats})
    .start(${sampleTime(EBA.options.startDelay + track.start)})`
  }
  return code
}

// convert note to scientific pitch notation
const noteSPN = (note, octave = true) => {
  if (isNaN(note)) return null
  const name = extrapolate(note, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])
  if (octave) return name + (Math.floor(note / 12) + 4)
  return name
}
const noteFrequency = note => (isNaN(note) ? 0 : 440 * Math.pow(2, (note - 9) / 12))
const transpose = offset => notes => notes.map(v => v + offset)
const flatten = matrix => matrix.reduce((acc, cur) => [...acc, ...cur], [])
const last = array => array[array.length - 1]

// linearly project a value from its domain to a range
const project = (a, ar, br) => br[0] + ((br[1] - br[0]) / (ar[1] - ar[0])) * (a - ar[0])

function createScale(mode) {
  // mode=1 is major scale
  // 2=tone, 1=semitone
  const base = rotate([2, 2, 1, 2, 2, 2, 1], mode - 1)
  const result = [0]
  base.slice(0, base.length - 1).forEach(v => {
    result.push(last(result) + v)
  })
  return result
}

// returns a progression of degrees
function createProgression(random) {
  // base degrees with modifiers (none, 6th, 7th, 9th, 11th)
  const p1 = range(random.choose(4, 4, 4, 3, 2, 6, 5)).map(
    () => random.int(1, 6) + random.choose(0, 0, 0, 0, 0, 0, 0.6, 0.7, 0.9, 0.4)
  )

  // alter some octaves
  const p2 = p1.map((n, i) => n + (i <= 1 ? 0 : 8 * random.int(-1, 1)))

  // alter tonic
  const p3 = rotate(p2, random.int(-3, 3))

  // console.log({p0: p1, p1: p2, p2: p3})
  return p3
}

function chordBuilder(scale) {
  return degree => {
    const base = [1, 3, 5]
    // extract decimal and use it as alteration
    const alt = Math.floor(Math.abs(degree - Math.floor(degree)) * 10)
    if (alt) base.push(alt)
    const result = base.map(i => {
      const index = i + Math.floor(degree) - 1
      return extrapolate(index, scale)
    })
    return result
  }
}

function extrapolate(index, notes) {
  let note = index % notes.length
  if (note < 0) {
    note = notes.length + note
  }
  const result = notes[note]
  if (typeof result == 'string') {
    return result
  }
  const offset = Math.floor(index / notes.length) * 12
  return result + offset
}

// convert truthy array to time intervals
const timings = beat => values => {
  const result = []
  let count = 0
  values.forEach(value => {
    if (value) {
      result.push(count * beat)
      count = 0
    }
    count++
  })
  // first item is start delay
  result.push(result[0] + count * beat)
  return {
    start: result[0],
    pauses: result.slice(1),
  }
}

function range(arg1, arg2) {
  let start = 0
  let count
  if (arg2 != null) {
    start = arg1
    count = arg2 - arg1
  } else {
    count = arg1
  }
  return Array(count)
    .fill(0)
    .map((x, i) => i + start)
}

const rotate = (values, rotate = 0) => {
  const result = [...values]
  while (rotate > 0) {
    result.push(result.shift() || 0)
    rotate--
  }
  while (rotate < 0) {
    result.unshift(result.pop() || 0)
    rotate++
  }
  return result
}

function buildCoprimesMatrix(size, xOffset, yOffset) {
  const cols = []
  for (let xIndex = 0; xIndex < size; xIndex++) {
    const col = []
    const x = xOffset + xIndex
    for (let yIndex = 0; yIndex < size; yIndex++) {
      const y = yOffset + yIndex
      col.push(x > y && gcd(x, y) === 1)
    }
    cols.push(col)
  }
  return cols
}

// not too high ("ouch!") nor not too low ("huh?")
const capNote = note =>
  isNaN(note) ? NaN : note > 12 ? capNote(note - 12) : note < -3 * 12 ? capNote(note + 12) : note

const zigzag = (values, length) => {
  const result = []
  let index = 0
  let prev = 0
  let up = true
  while (result.length < length) {
    const note = values[index]
    if (isNaN(note)) {
      result.push(NaN)
    } else if (up && note > prev) {
      result.push(note)
      prev = note
      up = !up
    } else if (!up && note < prev) {
      result.push(note)
      prev = note
      up = !up
    }
    index++
    if (index > values.length - 1) {
      index = 0
      up = !up
    }
  }
  return result
}

// improvise over notes
const improvBuilder = (pulses, random) => notes => {
  let shuffled = random.shuffle([
    ...range(-3, 4),
    ...range(-6, 7),
    ...Array(random.int(0, 8)).fill(NaN),
  ])
  const repeatPhrase = random.value() > 0.5
  const zigzagPhrase = random.value() > 0.5
  if (repeatPhrase) {
    shuffled = zigzagPhrase ? zigzag(shuffled, pulses) : shuffled.slice(0, pulses)
  } else {
    shuffled = zigzagPhrase ? zigzag(shuffled, pulses * 2) : shuffled.slice(0, pulses * 2)
  }
  if (random.value() > 0.8) {
    const order = random.choose(-1, 1)
    shuffled = shuffled.sort((a, b) => (a < b ? -1 : 1) * order)
  }
  if (repeatPhrase) {
    shuffled = shuffled.concat(shuffled)
  }
  const result = shuffled.map(index => capNote(extrapolate(index, notes)))
  return result
}

const stringifyLiteral = input =>
  // stringify function outputs as literal values
  JSON.stringify(input, (_, value) =>
    typeof value == 'function' ? `@@@${value()}@@@` : value
  ).replace(/("@@@|@@@")/g, '')

class RandomContext {
  constructor(seed) {
    this.originalSeed = seed
    this.seed = seed
  }
  value() {
    // just a hack
    const x = Math.sin(this.seed++) * 10000
    return x - Math.floor(x)
  }
  float(min, max) {
    return min + this.value() * (max - min)
  }
  int(min, max) {
    return Math.floor(this.float(min, max + 1))
  }
  choose(...values) {
    return values[this.int(0, values.length - 1)]
  }
  shuffle(array) {
    // order must be generated before sort. browsers implement sort differently, affecting next random seed
    const sortable = array.map(v => ({v, o: 0.5 - this.value()}))
    return sortable.sort((a, b) => (a.o < b.o ? -1 : 1)).map(x => x.v)
  }
  use(action) {
    const oldSeed = this.seed
    this.seed = this.originalSeed
    const result = action()
    this.seed = oldSeed
    return result
  }
}
var GibberishWorkletPre = `
const global=typeof window === 'undefined' ? {} : window;
let Gibberish=null; 
let initialized=false;
`

var GibberishWorkletPost = `
class GibberishProcessor extends AudioWorkletProcessor { static get parameterDescriptors() {}
constructor(options) {
super(options)
Gibberish=global.Gibberish
Gibberish.ctx={ sampleRate }
Gibberish.genish.hasWorklet=false;
Gibberish.preventProxy=true
Gibberish.init(undefined,undefined,'processor')
Gibberish.preventProxy=false
Gibberish.debug=false 
Gibberish.processor=this
this.port.onmessage=this.handleMessage.bind(this)
this.queue=[]
Gibberish.ugens=this.ugens=new Map()
Gibberish.worklet={ ugens: this.ugens,port:this.port }
this.ugens.set(Gibberish.id,Gibberish)
this.messages=[]
}
replaceProperties(obj) {
if(Array.isArray(obj)) {
const out=[]
for(let i=0; i < obj.length; i++){
const prop=obj[ i ]
if(prop === null) continue
if(typeof prop === 'object' && prop.id !== undefined) {
let objCheck=this.ugens.get(prop.id)
if(objCheck !== undefined) {
out[ i ]=prop.prop !== undefined ? objCheck[ prop.prop ] : objCheck
if(prop.prop !== undefined) console.log('got a ssd.out',prop,objCheck)
}else{
out[ i ]= prop
}
}else{
if(prop === null) continue
if(typeof prop === 'object' && prop.action === 'wrap') {
out[ i  ]=prop.value.bind(null,...this.replaceProperties(prop.args))
}else if(Array.isArray(prop)) {
out[ i ]=this.replaceProperties(prop)
}else{
out[ i ]=prop
}}}
return out
}else{
const properties=obj
for(let key in properties) {
let prop=properties[ key ]
if(typeof prop === 'object' && prop !== null && prop.id !== undefined) {
let objCheck=this.ugens.get(prop.id)
if(objCheck !== undefined) {
properties[ key ]=objCheck
} 
}else if(Array.isArray(prop)) {
properties[ key ]=this.replaceProperties(prop)
}else{
if(typeof prop === 'object' && prop !== null && prop.action === 'wrap') {
properties[ key ]=prop.value()
}}} 
return properties
}
return obj
}

playQueue() {
this.queue.forEach(m => { m.data.delay=false; this.handleMessage(m) })
this.queue.length=0
}
handleMessage(event) {
if(event.data.delay === true) {
this.queue.push(event)
return }
if(event.data.address === 'add') {
const rep=event.data
let constructor=Gibberish
let properties=this.replaceProperties(eval('(' + rep.properties + ')'))
let ugen
if(properties.nogibberish) {
ugen=properties
}else{
for(let i=0; i < rep.name.length; i++) { constructor=constructor[ rep.name[ i ] ] }
properties.id=rep.id
ugen=properties.isop === true || properties.isPattern === true 
? constructor(...properties.inputs) 
: constructor(properties)
if(properties.isPattern) {
for(let key in properties) {
if(key !== 'input' && key !== 'isPattern') {
ugen[ key ]=properties[ key ]
}}}}
if(rep.post) {
ugen[ rep.post ]()
}
this.ugens.set(rep.id,ugen)
ugen.id=rep.id
initialized=true
}else if(event.data.address === 'method') {
const dict=event.data
const obj =this.ugens.get(dict.object)
if(obj === undefined || typeof obj[ dict.name ] !== 'function') return
if(dict.functions === true) {
obj[ dict.name ](eval('(' + dict.args + ')')) 
}else{
obj[ dict.name ](...dict.args.map(Gibberish.proxyReplace)) 
}
}else if(event.data.address === 'property') {
const dict=event.data
const obj =this.ugens.get(dict.object)
let value=dict.value
if(typeof dict.value === 'object' && dict.value !== null && dict.value.id !== undefined) {
value=this.ugens.get(dict.value.id)
}
obj[ dict.name ]=value
}else if(event.data.address === 'print') {
const dict=event.data
const obj =this.ugens.get(dict.object) 
}else if(event.data.address === 'printProperty') {
const dict=event.data
const obj =this.ugens.get(dict.object)
}else if(event.data.address === 'set') {
const dict=event.data
const obj=this.ugens.get(dict.object)
let value=dict.value
if(typeof dict.value === 'object' && dict.value !== null && dict.value.id !== undefined) {
value=this.ugens.get(dict.value.id)
}
obj[ dict.name ]=value
}else if(event.data.address === 'copy') {
const target=this.ugens.get(event.data.id)
if(target === undefined) {
this.queue.push(event)
}else{
target.data.onload(event.data.buffer)
}
}else if(event.data.address === 'copy_multi') {
const target=this.ugens.get(event.data.id)
if(target === undefined) {
this.queue.push(event)
}else{
target.samplers[ event.data.filename ].data.onload(event.data.buffer)
}
}else if(event.data.address === 'callback') {
}else if(event.data.address === 'addConstructor') {
const wrapper=eval('(' + event.data.constructorString + ')')
Gibberish[ event.data.name ]=wrapper(Gibberish,Gibberish.genish)
}else if(event.data.address === 'addMethod') {
const target=this.ugens.get(event.data.id)

if(target[ event.data.key ] === undefined) {
target[ event.data.key ]=eval('(' + event.data.function + ')')
}
}else if(event.data.address === 'monkeyPatch') {
const target=this.ugens.get(event.data.id)
if(target['___'+event.data.key] === undefined) {
target[ '___' + event.data.key ]=target[ event.data.key ]
target[ event.data.key ]=eval('(' + event.data.function + ')')
}
}else if(event.data.address === 'dirty') {
const obj=this.ugens.get(event.data.id)
Gibberish.dirty(obj)
}else if(event.data.address === 'initialize') {
initialized=true
}else if(event.data.address === 'addToProperty') {
const dict=event.data
const obj =this.ugens.get(dict.object)
obj[ dict.name ][ dict.key ]=dict.value
}else if(event.data.address === 'addObjectToProperty') {
const dict=event.data
const obj =this.ugens.get(dict.object)
obj[ dict.name ][ dict.key ]=this.ugens.get(dict.value)
}else if(event.data.address === 'messages') {
}else if(event.data.address === 'eval') {
eval(event.data.code)
}}
process(inputs,outputs,parameters) {
if(initialized === true) {
const gibberish=Gibberish
const scheduler=gibberish.scheduler
let callback =this.callback
let ugens=gibberish.callbackUgens 
this.messages.length=0
if(callback === undefined && gibberish.graphIsDirty === false) return true
let callbacklength=gibberish.blockCallbacks.length
if(callbacklength !== 0) {
for(let i=0; i< callbacklength; i++) {
gibberish.blockCallbacks[ i ]()
}
gibberish.blockCallbacks.splice(0,callbacklength)
}
const output=outputs[ 0 ]
const len=outputs[0][0].length
let phase=0
for (let i=0; i < len; ++i) {
phase=scheduler.tick()
if(gibberish.graphIsDirty) {
const oldCallback=callback
const oldUgens=ugens.slice(0)
const oldNames=gibberish.callbackNames.slice(0)
let cb
try{
cb=gibberish.generateCallback()
} catch(e) {
cb=oldCallback
gibberish.callbackUgens=oldUgens
gibberish.callbackNames=oldNames
gibberish.dirtyUgens.length=0
gibberish.graphIsDirty=false
} finally {
ugens=gibberish.callbackUgens
this.callback=callback=cb
this.port.postMessage({ address:'callback',code:cb.toString() }) 
} 
}
const out=callback.apply(null,ugens)
output[0][ i ]=out[0]
output[1][ i ]=out[1] 
}
if(ugens.length > 1) {
for(let i=1; i < ugens.length - 1; i++) {
const ugen=ugens[ i ]
if(ugen.out !== undefined) {
this.messages.push(ugen.id,'output',ugen.out[0],ugen.out[1])
}}}
if(this.messages.length > 0) {
this.port.postMessage({ 
address:'state',
messages:this.messages 
})
}
this.port.postMessage({
address:'phase',
value: phase
})
}
return true
}}
global.Gibberish.workletProcessor=GibberishProcessor 
registerProcessor('gibberish',global.Gibberish.workletProcessor);
`

var GibberishCommon=`
/*
---
genish.js & gibberish.js
Copyright (c) 2016 charlie roberts

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

___
audioworklet-polyfill
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.

Originally from:
https://github.com/GoogleChromeLabs/audioworklet-polyfill
Modified to accept variable buffer sizes
and to get rid of some strange global initialization that seems required to use it
with browserify. Also, added changes to fix a bug in Safari for the AudioWorkletProcessor
property not having a prototype (see:https://github.com/GoogleChromeLabs/audioworklet-polyfill/pull/25)

___
realm.js
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.

___
seedrandom
Copyright 2019 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

___
serialize-javascript
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.createTemplateTagFirstArg=function(h){return h.raw=h};$jscomp.createTemplateTagFirstArgWithRaw=function(h,p){h.raw=p;return h};$jscomp.arrayIteratorImpl=function(h){var p=0;return function(){return p<h.length?{done:!1,value:h[p++]}:{done:!0}}};$jscomp.arrayIterator=function(h){return{next:$jscomp.arrayIteratorImpl(h)}};$jscomp.makeIterator=function(h){var p="undefined"!=typeof Symbol&&Symbol.iterator&&h[Symbol.iterator];return p?p.call(h):$jscomp.arrayIterator(h)};
$jscomp.arrayFromIterator=function(h){for(var p,w=[];!(p=h.next()).done;)w.push(p.value);return w};$jscomp.arrayFromIterable=function(h){return h instanceof Array?h:$jscomp.arrayFromIterator($jscomp.makeIterator(h))};$jscomp.owns=function(h,p){return Object.prototype.hasOwnProperty.call(h,p)};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.SIMPLE_FROUND_POLYFILL=!1;$jscomp.ISOLATE_POLYFILLS=!1;$jscomp.FORCE_POLYFILL_PROMISE=!1;
$jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION=!1;$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(h,p,w){if(h==Array.prototype||h==Object.prototype)return h;h[p]=w.value;return h};
$jscomp.getGlobal=function(h){h=["object"==typeof globalThis&&globalThis,h,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var p=0;p<h.length;++p){var w=h[p];if(w&&w.Math==Math)return w}throw Error("Cannot find global object");};$jscomp.global=$jscomp.getGlobal(this);$jscomp.IS_SYMBOL_NATIVE="function"===typeof Symbol&&"symbol"===typeof Symbol("x");$jscomp.TRUST_ES6_POLYFILLS=!$jscomp.ISOLATE_POLYFILLS||$jscomp.IS_SYMBOL_NATIVE;$jscomp.polyfills={};
$jscomp.propertyToPolyfillSymbol={};$jscomp.POLYFILL_PREFIX="$jscp$";var $jscomp$lookupPolyfilledValue=function(h,p){var w=$jscomp.propertyToPolyfillSymbol[p];if(null==w)return h[p];w=h[w];return void 0!==w?w:h[p]};$jscomp.polyfill=function(h,p,w,a){p&&($jscomp.ISOLATE_POLYFILLS?$jscomp.polyfillIsolated(h,p,w,a):$jscomp.polyfillUnisolated(h,p,w,a))};
$jscomp.polyfillUnisolated=function(h,p,w,a){w=$jscomp.global;h=h.split(".");for(a=0;a<h.length-1;a++){var l=h[a];if(!(l in w))return;w=w[l]}h=h[h.length-1];a=w[h];p=p(a);p!=a&&null!=p&&$jscomp.defineProperty(w,h,{configurable:!0,writable:!0,value:p})};
$jscomp.polyfillIsolated=function(h,p,w,a){var l=h.split(".");h=1===l.length;a=l[0];a=!h&&a in $jscomp.polyfills?$jscomp.polyfills:$jscomp.global;for(var b=0;b<l.length-1;b++){var c=l[b];if(!(c in a))return;a=a[c]}l=l[l.length-1];w=$jscomp.IS_SYMBOL_NATIVE&&"es6"===w?a[l]:null;p=p(w);null!=p&&(h?$jscomp.defineProperty($jscomp.polyfills,l,{configurable:!0,writable:!0,value:p}):p!==w&&(void 0===$jscomp.propertyToPolyfillSymbol[l]&&($jscomp.propertyToPolyfillSymbol[l]=$jscomp.IS_SYMBOL_NATIVE?$jscomp.global.Symbol(l):
$jscomp.POLYFILL_PREFIX+l),l=$jscomp.propertyToPolyfillSymbol[l],$jscomp.defineProperty(a,l,{configurable:!0,writable:!0,value:p})))};$jscomp.assign=$jscomp.TRUST_ES6_POLYFILLS&&"function"==typeof Object.assign?Object.assign:function(h,p){for(var w=1;w<arguments.length;w++){var a=arguments[w];if(a)for(var l in a)$jscomp.owns(a,l)&&(h[l]=a[l])}return h};$jscomp.polyfill("Object.assign",function(h){return h||$jscomp.assign},"es6","es3");
$jscomp.polyfill("Promise",function(h){function p(){this.batch_=null}function w(c){return c instanceof l?c:new l(function(g,f){g(c)})}if(h&&(!($jscomp.FORCE_POLYFILL_PROMISE||$jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION&&"undefined"===typeof $jscomp.global.PromiseRejectionEvent)||!$jscomp.global.Promise||-1===$jscomp.global.Promise.toString().indexOf("[native code]")))return h;p.prototype.asyncExecute=function(c){if(null==this.batch_){this.batch_=[];var g=this;this.asyncExecuteFunction(function(){g.executeBatch_()})}this.batch_.push(c)};
var a=$jscomp.global.setTimeout;p.prototype.asyncExecuteFunction=function(c){a(c,0)};p.prototype.executeBatch_=function(){for(;this.batch_&&this.batch_.length;){var c=this.batch_;this.batch_=[];for(var g=0;g<c.length;++g){var f=c[g];c[g]=null;try{f()}catch(d){this.asyncThrow_(d)}}}this.batch_=null};p.prototype.asyncThrow_=function(c){this.asyncExecuteFunction(function(){throw c;})};var l=function(c){this.state_=0;this.result_=void 0;this.onSettledCallbacks_=[];this.isRejectionHandled_=!1;var g=this.createResolveAndReject_();
try{c(g.resolve,g.reject)}catch(f){g.reject(f)}};l.prototype.createResolveAndReject_=function(){function c(d){return function(e){f||(f=!0,d.call(g,e))}}var g=this,f=!1;return{resolve:c(this.resolveTo_),reject:c(this.reject_)}};l.prototype.resolveTo_=function(c){if(c===this)this.reject_(new TypeError("A Promise cannot resolve to itself"));else if(c instanceof l)this.settleSameAsPromise_(c);else{a:switch(typeof c){case "object":var g=null!=c;break a;case "function":g=!0;break a;default:g=!1}g?this.resolveToNonPromiseObj_(c):
this.fulfill_(c)}};l.prototype.resolveToNonPromiseObj_=function(c){var g=void 0;try{g=c.then}catch(f){this.reject_(f);return}"function"==typeof g?this.settleSameAsThenable_(g,c):this.fulfill_(c)};l.prototype.reject_=function(c){this.settle_(2,c)};l.prototype.fulfill_=function(c){this.settle_(1,c)};l.prototype.settle_=function(c,g){if(0!=this.state_)throw Error("Cannot settle("+c+","+g+"): Promise already settled in state"+this.state_);this.state_=c;this.result_=g;2===this.state_&&this.scheduleUnhandledRejectionCheck_();
this.executeOnSettledCallbacks_()};l.prototype.scheduleUnhandledRejectionCheck_=function(){var c=this;a(function(){if(c.notifyUnhandledRejection_()){var g=$jscomp.global.console;"undefined"!==typeof g&&g.error(c.result_)}},1)};l.prototype.notifyUnhandledRejection_=function(){if(this.isRejectionHandled_)return!1;var c=$jscomp.global.CustomEvent,g=$jscomp.global.Event,f=$jscomp.global.dispatchEvent;if("undefined"===typeof f)return!0;"function"===typeof c?c=new c("unhandledrejection",{cancelable:!0}):
"function"===typeof g?c=new g("unhandledrejection",{cancelable:!0}):(c=$jscomp.global.document.createEvent("CustomEvent"),c.initCustomEvent("unhandledrejection",!1,!0,c));c.promise=this;c.reason=this.result_;return f(c)};l.prototype.executeOnSettledCallbacks_=function(){if(null!=this.onSettledCallbacks_){for(var c=0;c<this.onSettledCallbacks_.length;++c)b.asyncExecute(this.onSettledCallbacks_[c]);this.onSettledCallbacks_=null}};var b=new p;l.prototype.settleSameAsPromise_=function(c){var g=this.createResolveAndReject_();
c.callWhenSettled_(g.resolve,g.reject)};l.prototype.settleSameAsThenable_=function(c,g){var f=this.createResolveAndReject_();try{c.call(g,f.resolve,f.reject)}catch(d){f.reject(d)}};l.prototype.then=function(c,g){function f(m,n){return"function"==typeof m?function(q){try{d(m(q))}catch(t){e(t)}}:n}var d,e,k=new l(function(m,n){d=m;e=n});this.callWhenSettled_(f(c,d),f(g,e));return k};l.prototype.catch=function(c){return this.then(void 0,c)};l.prototype.callWhenSettled_=function(c,g){function f(){switch(d.state_){case 1:c(d.result_);
break;case 2:g(d.result_);break;default:throw Error("Unexpected state: "+d.state_);}}var d=this;null==this.onSettledCallbacks_?b.asyncExecute(f):this.onSettledCallbacks_.push(f);this.isRejectionHandled_=!0};l.resolve=w;l.reject=function(c){return new l(function(g,f){f(c)})};l.race=function(c){return new l(function(g,f){for(var d=$jscomp.makeIterator(c),e=d.next();!e.done;e=d.next())w(e.value).callWhenSettled_(g,f)})};l.all=function(c){var g=$jscomp.makeIterator(c),f=g.next();return f.done?w([]):new l(function(d,
e){function k(q){return function(t){m[q]=t;n--;0==n&&d(m)}}var m=[],n=0;do m.push(void 0),n++,w(f.value).callWhenSettled_(k(m.length-1),e),f=g.next();while(!f.done)})};return l},"es6","es3");$jscomp.initSymbol=function(){};
$jscomp.polyfill("Symbol",function(h){if(h)return h;var p=function(l,b){this.$jscomp$symbol$id_=l;$jscomp.defineProperty(this,"description",{configurable:!0,writable:!0,value:b})};p.prototype.toString=function(){return this.$jscomp$symbol$id_};var w=0,a=function(l){if(this instanceof a)throw new TypeError("Symbol is not a constructor");return new p("jscomp_symbol_"+(l||"")+"_"+w++,l)};return a},"es6","es3");
$jscomp.polyfill("Symbol.iterator",function(h){if(h)return h;h=Symbol("Symbol.iterator");for(var p="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),w=0;w<p.length;w++){var a=$jscomp.global[p[w]];"function"===typeof a&&"function"!=typeof a.prototype[h]&&$jscomp.defineProperty(a.prototype,h,{configurable:!0,writable:!0,value:function(){return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this))}})}return h},"es6",
"es3");$jscomp.iteratorPrototype=function(h){h={next:h};h[Symbol.iterator]=function(){return this};return h};$jscomp.iteratorFromArray=function(h,p){h instanceof String&&(h+="");var w=0,a=!1,l={next:function(){if(!a&&w<h.length){var b=w++;return{value:p(b,h[b]),done:!1}}a=!0;return{done:!0,value:void 0}}};l[Symbol.iterator]=function(){return l};return l};
$jscomp.polyfill("Array.prototype.values",function(h){return h?h:function(){return $jscomp.iteratorFromArray(this,function(p,w){return w})}},"es8","es3");$jscomp.checkEs6ConformanceViaProxy=function(){try{var h={},p=Object.create(new $jscomp.global.Proxy(h,{get:function(w,a,l){return w==h&&"q"==a&&l==p}}));return!0===p.q}catch(w){return!1}};$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS=!1;$jscomp.ES6_CONFORMANCE=$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS&&$jscomp.checkEs6ConformanceViaProxy();
$jscomp.polyfill("WeakMap",function(h){function p(){if(!h||!Object.seal)return!1;try{var d=Object.seal({}),e=Object.seal({}),k=new h([[d,2],[e,3]]);if(2!=k.get(d)||3!=k.get(e))return!1;k.delete(d);k.set(e,4);return!k.has(d)&&4==k.get(e)}catch(m){return!1}}function w(){}function a(d){var e=typeof d;return"object"===e&&null!==d||"function"===e}function l(d){if(!$jscomp.owns(d,c)){var e=new w;$jscomp.defineProperty(d,c,{value:e})}}function b(d){if(!$jscomp.ISOLATE_POLYFILLS){var e=Object[d];e&&(Object[d]=
function(k){if(k instanceof w)return k;Object.isExtensible(k)&&l(k);return e(k)})}}if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(h&&$jscomp.ES6_CONFORMANCE)return h}else if(p())return h;var c="$jscomp_hidden_"+Math.random();b("freeze");b("preventExtensions");b("seal");var g=0,f=function(d){this.id_=(g+=Math.random()+1).toString();if(d){d=$jscomp.makeIterator(d);for(var e;!(e=d.next()).done;)e=e.value,this.set(e[0],e[1])}};f.prototype.set=function(d,e){if(!a(d))throw Error("Invalid WeakMap key");
l(d);if(!$jscomp.owns(d,c))throw Error("WeakMap key fail: "+d);d[c][this.id_]=e;return this};f.prototype.get=function(d){return a(d)&&$jscomp.owns(d,c)?d[c][this.id_]:void 0};f.prototype.has=function(d){return a(d)&&$jscomp.owns(d,c)&&$jscomp.owns(d[c],this.id_)};f.prototype.delete=function(d){return a(d)&&$jscomp.owns(d,c)&&$jscomp.owns(d[c],this.id_)?delete d[c][this.id_]:!1};return f},"es6","es3");$jscomp.MapEntry=function(){};
$jscomp.polyfill("Map",function(h){function p(){if($jscomp.ASSUME_NO_NATIVE_MAP||!h||"function"!=typeof h||!h.prototype.entries||"function"!=typeof Object.seal)return!1;try{var f=Object.seal({x:4}),d=new h($jscomp.makeIterator([[f,"s"]]));if("s"!=d.get(f)||1!=d.size||d.get({x:4})||d.set({x:4},"t")!=d||2!=d.size)return!1;var e=d.entries(),k=e.next();if(k.done||k.value[0]!=f||"s"!=k.value[1])return!1;k=e.next();return k.done||4!=k.value[0].x||"t"!=k.value[1]||!e.next().done?!1:!0}catch(m){return!1}}
if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(h&&$jscomp.ES6_CONFORMANCE)return h}else if(p())return h;var w=new WeakMap,a=function(f){this.data_={};this.head_=c();this.size=0;if(f){f=$jscomp.makeIterator(f);for(var d;!(d=f.next()).done;)d=d.value,this.set(d[0],d[1])}};a.prototype.set=function(f,d){f=0===f?0:f;var e=l(this,f);e.list||(e.list=this.data_[e.id]=[]);e.entry?e.entry.value=d:(e.entry={next:this.head_,previous:this.head_.previous,head:this.head_,key:f,value:d},e.list.push(e.entry),
this.head_.previous.next=e.entry,this.head_.previous=e.entry,this.size++);return this};a.prototype.delete=function(f){f=l(this,f);return f.entry&&f.list?(f.list.splice(f.index,1),f.list.length||delete this.data_[f.id],f.entry.previous.next=f.entry.next,f.entry.next.previous=f.entry.previous,f.entry.head=null,this.size--,!0):!1};a.prototype.clear=function(){this.data_={};this.head_=this.head_.previous=c();this.size=0};a.prototype.has=function(f){return!!l(this,f).entry};a.prototype.get=function(f){return(f=
l(this,f).entry)&&f.value};a.prototype.entries=function(){return b(this,function(f){return[f.key,f.value]})};a.prototype.keys=function(){return b(this,function(f){return f.key})};a.prototype.values=function(){return b(this,function(f){return f.value})};a.prototype.forEach=function(f,d){for(var e=this.entries(),k;!(k=e.next()).done;)k=k.value,f.call(d,k[1],k[0],this)};a.prototype[Symbol.iterator]=a.prototype.entries;var l=function(f,d){var e=d&&typeof d;"object"==e||"function"==e?w.has(d)?e=w.get(d):
(e=""+ ++g,w.set(d,e)):e="p_"+d;var k=f.data_[e];if(k&&$jscomp.owns(f.data_,e))for(f=0;f<k.length;f++){var m=k[f];if(d!==d&&m.key!==m.key||d===m.key)return{id:e,list:k,index:f,entry:m}}return{id:e,list:k,index:-1,entry:void 0}},b=function(f,d){var e=f.head_;return $jscomp.iteratorPrototype(function(){if(e){for(;e.head!=f.head_;)e=e.previous;for(;e.next!=e.head;)return e=e.next,{done:!1,value:d(e)};e=null}return{done:!0,value:void 0}})},c=function(){var f={};return f.previous=f.next=f.head=f},g=0;
return a},"es6","es3");$jscomp.polyfill("Array.prototype.fill",function(h){return h?h:function(p,w,a){var l=this.length||0;0>w&&(w=Math.max(0,l+w));if(null==a||a>l)a=l;a=Number(a);0>a&&(a=Math.max(0,l+a));for(w=Number(w||0);w<a;w++)this[w]=p;return this}},"es6","es3");$jscomp.typedArrayFill=function(h){return h?h:Array.prototype.fill};$jscomp.polyfill("Int8Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");$jscomp.polyfill("Uint8Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");
$jscomp.polyfill("Uint8ClampedArray.prototype.fill",$jscomp.typedArrayFill,"es6","es5");$jscomp.polyfill("Int16Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");$jscomp.polyfill("Uint16Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");$jscomp.polyfill("Int32Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");$jscomp.polyfill("Uint32Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");$jscomp.polyfill("Float32Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");
$jscomp.polyfill("Float64Array.prototype.fill",$jscomp.typedArrayFill,"es6","es5");
$jscomp.polyfill("Set",function(h){function p(){if($jscomp.ASSUME_NO_NATIVE_SET||!h||"function"!=typeof h||!h.prototype.entries||"function"!=typeof Object.seal)return!1;try{var a=Object.seal({x:4}),l=new h($jscomp.makeIterator([a]));if(!l.has(a)||1!=l.size||l.add(a)!=l||1!=l.size||l.add({x:4})!=l||2!=l.size)return!1;var b=l.entries(),c=b.next();if(c.done||c.value[0]!=a||c.value[1]!=a)return!1;c=b.next();return c.done||c.value[0]==a||4!=c.value[0].x||c.value[1]!=c.value[0]?!1:b.next().done}catch(g){return!1}}
if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(h&&$jscomp.ES6_CONFORMANCE)return h}else if(p())return h;var w=function(a){this.map_=new Map;if(a){a=$jscomp.makeIterator(a);for(var l;!(l=a.next()).done;)this.add(l.value)}this.size=this.map_.size};w.prototype.add=function(a){a=0===a?0:a;this.map_.set(a,a);this.size=this.map_.size;return this};w.prototype.delete=function(a){a=this.map_.delete(a);this.size=this.map_.size;return a};w.prototype.clear=function(){this.map_.clear();this.size=0};w.prototype.has=
function(a){return this.map_.has(a)};w.prototype.entries=function(){return this.map_.entries()};w.prototype.values=function(){return this.map_.values()};w.prototype.keys=w.prototype.values;w.prototype[Symbol.iterator]=w.prototype.values;w.prototype.forEach=function(a,l){var b=this;this.map_.forEach(function(c){return a.call(l,c,c,b)})};return w},"es6","es3");
$jscomp.polyfill("Array.from",function(h){return h?h:function(p,w,a){w=null!=w?w:function(g){return g};var l=[],b="undefined"!=typeof Symbol&&Symbol.iterator&&p[Symbol.iterator];if("function"==typeof b){p=b.call(p);for(var c=0;!(b=p.next()).done;)l.push(w.call(a,b.value,c++))}else for(b=p.length,c=0;c<b;c++)l.push(w.call(a,p[c],c));return l}},"es6","es3");
$jscomp.polyfill("Array.prototype.keys",function(h){return h?h:function(){return $jscomp.iteratorFromArray(this,function(p){return p})}},"es6","es3");$jscomp.polyfill("Math.log2",function(h){return h?h:function(p){return Math.log(p)/Math.LN2}},"es6","es3");$jscomp.polyfill("Math.sign",function(h){return h?h:function(p){p=Number(p);return 0===p||isNaN(p)?p:0<p?1:-1}},"es6","es3");
$jscomp.polyfill("Math.tanh",function(h){return h?h:function(p){p=Number(p);if(0===p)return p;var w=Math.exp(-2*Math.abs(p));w=(1-w)/(1+w);return 0>p?-w:w}},"es6","es3");$jscomp.findInternal=function(h,p,w){h instanceof String&&(h=String(h));for(var a=h.length,l=0;l<a;l++){var b=h[l];if(p.call(w,b,l,h))return{i:l,v:b}}return{i:-1,v:void 0}};$jscomp.polyfill("Array.prototype.find",function(h){return h?h:function(p,w){return $jscomp.findInternal(this,p,w).v}},"es6","es3");
$jscomp.polyfill("Reflect",function(h){return h?h:{}},"es6","es3");$jscomp.polyfill("Object.getOwnPropertySymbols",function(h){return h?h:function(){return[]}},"es6","es5");$jscomp.polyfill("Reflect.ownKeys",function(h){return h?h:function(p){var w=[],a=Object.getOwnPropertyNames(p);p=Object.getOwnPropertySymbols(p);for(var l=0;l<a.length;l++)("jscomp_symbol_"==a[l].substring(0,14)?p:w).push(a[l]);return w.concat(p)}},"es6","es5");
$jscomp.polyfill("Array.prototype.entries",function(h){return h?h:function(){return $jscomp.iteratorFromArray(this,function(p,w){return[p,w]})}},"es6","es3");
(function(h){"object"===typeof exports&&"undefined"!==typeof module?module.exports=h():"function"===typeof define&&define.amd?define([],h):("undefined"!==typeof window?window:"undefined"!==typeof global?global:"undefined"!==typeof self?self:this).Gibberish=h()})(function(){return function(){function h(p,w,a){function l(g,f){if(!w[g]){if(!p[g]){var d="function"==typeof require&&require;if(!f&&d)return d(g,!0);if(b)return b(g,!0);f=Error("Cannot find module '"+g+"'");throw f.code="MODULE_NOT_FOUND",f;}f=w[g]=
{exports:{}};p[g][0].call(f.exports,function(e){return l(p[g][1][e]||e)},f,f.exports,h,p,w,a)}return w[g].exports}for(var b="function"==typeof require&&require,c=0;c<a.length;c++)l(a[c]);return l}return h}()({1:[function(h,p,w){var a=h("./gen.js"),l={name:"abs",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])){var f={};a.closures.add((f[this.name]=c?"Math.abs":Math.abs,f));b=g+"abs("+b[0]+")"}else b=Math.abs(parseFloat(b[0]));return b}};p.exports=function(b){var c=
Object.create(l);c.inputs=[b];return c}},{"./gen.js":32}],2:[function(h,p,w){var a=h("./gen.js"),l={basename:"accum",gen:function(){var b=a.getInputs(this),c="gen."+this.name;a.requestMemory(this.memory);a.memory.heap[this.memory.value.idx]=this.initialValue;b=this.callback(c,b[0],b[1],"memory["+this.memory.value.idx+"]");a.memo[this.name]=this.name+"_value";return[this.name+"_value",b]},callback:function(b,c,g,f){b=this.max-this.min;var d="",e="";"number"===typeof this.inputs[1]&&1>this.inputs[1]||
(d=this.resetValue!==this.min?d+(" if("+g+" >=1) "+f+"="+this.resetValue+"\\n\\n"):d+(" if("+g+" >=1) "+f+"="+this.min+"\\n\\n"));d+=" var "+this.name+"_value="+f+"\\n";d=!1===this.shouldWrap&&!0===this.shouldClamp?d+(" if("+f+" < "+this.max+") "+f+" += "+c+"\\n"):d+(" "+f+" += "+c+"\\n");Infinity!==this.max&&this.shouldWrapMax&&(e+=" if("+f+" >= "+this.max+") "+f+" -= "+b+"\\n");-Infinity!==this.min&&this.shouldWrapMin&&(e+=" if("+f+" < "+this.min+") "+f+" += "+b+"\\n");return d+e+
"\\n"},defaults:{min:0,max:1,resetValue:0,initialValue:0,shouldWrap:!0,shouldWrapMax:!0,shouldWrapMin:!0,shouldClamp:!1}};p.exports=function(b,c,g){c=void 0===c?0:c;var f=Object.create(l);Object.assign(f,{uid:a.getUID(),inputs:[b,c],memory:{value:{length:1,idx:null}}},l.defaults,g);void 0!==g&&void 0===g.shouldWrapMax&&void 0===g.shouldWrapMin&&void 0!==g.shouldWrap&&(f.shouldWrapMin=f.shouldWrapMax=g.shouldWrap);void 0!==g&&void 0===g.resetValue&&(f.resetValue=f.min);void 0===f.initialValue&&(f.initialValue=
f.min);Object.defineProperty(f,"value",{get:function(){return a.memory.heap[this.memory.value.idx]},set:function(d){a.memory.heap[this.memory.value.idx]=d}});f.name=""+f.basename+f.uid;return f}},{"./gen.js":32}],3:[function(h,p,w){var a=h("./gen.js"),l={basename:"acos",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({acos:c?"Math.acos":Math.acos}),b=g+"acos("+b[0]+")"):b=Math.acos(parseFloat(b[0]));return b}};p.exports=function(b){var c=
Object.create(l);c.inputs=[b];c.id=a.getUID();c.name=c.basename+"{acos.id}";return c}},{"./gen.js":32}],4:[function(h,p,w){var a=h("./gen.js");h("./mul.js");var l=h("./sub.js"),b=h("./div.js"),c=h("./data.js"),g=h("./peek.js"),f=h("./accum.js"),d=h("./ifelseif.js"),e=h("./lt.js"),k=h("./bang.js"),m=h("./env.js"),n=h("./add.js"),q=h("./poke.js"),t=h("./neq.js"),y=h("./and.js"),v=h("./gte.js");h("./memo.js");var r=h("./utilities.js");p.exports=function(u,x,z){u=void 0===u?44100:u;x=void 0===x?44100:
x;var A=Object.assign({},{shape:"exponential",alpha:5,trigger:null},z),B=null!==A.trigger?A.trigger:k();z=f(1,B,{min:0,max:Infinity,initialValue:-Infinity,shouldWrap:!1});var C=c([0]);if("linear"===A.shape)var D=d(y(v(z,0),e(z,u)),b(z,u),y(v(z,0),e(z,n(u,x))),l(1,b(l(z,u),x)),t(z,-Infinity),q(C,1,0,{inline:0}),0);else{var E=m({length:1024,type:A.shape,alpha:A.alpha});A=m({length:1024,type:A.shape,alpha:A.alpha,reverse:!0});D=d(y(v(z,0),e(z,u)),g(E,b(z,u),{boundmode:"clamp"}),y(v(z,0),e(z,n(u,x))),
g(A,b(l(z,u),x),{boundmode:"clamp"}),t(z,-Infinity),q(C,1,0,{inline:0}),0)}var F="worklet"===a.mode;!0===F&&(D.node=null,r.register(D));D.isComplete=function(){return!0===F&&null!==D.node?new Promise(function(G){D.node.getMemoryValue(C.memory.values.idx,G)}):a.memory.heap[C.memory.values.idx]};D.trigger=function(){!0===F&&null!==D.node&&D.node.port.postMessage({key:"set",idx:C.memory.values.idx,value:0});B.trigger()};return D}},{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":18,
"./div.js":23,"./env.js":24,"./gen.js":32,"./gte.js":34,"./ifelseif.js":37,"./lt.js":40,"./memo.js":44,"./mul.js":50,"./neq.js":51,"./peek.js":56,"./poke.js":59,"./sub.js":70,"./utilities.js":76}],5:[function(h,p,w){var a=h("./gen.js"),l={basename:"add",gen:function(){var b=a.getInputs(this),c="",g=0,f=0,d=!1,e=!0;if(0===b.length)return 0;c=" var "+this.name+"=";b.forEach(function(k,m){isNaN(k)?(c+=k,m<b.length-1&&(d=!0,c+=" + "),e=!1):(g+=parseFloat(k),f++)});0<f&&(c+=d||e?g:" + "+g);c+="\\n";
a.memo[this.name]=this.name;return[this.name,c]}};p.exports=function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-0]=arguments[g];g=Object.create(l);g.id=a.getUID();g.name=g.basename+g.id;g.inputs=c;return g}},{"./gen.js":32}],6:[function(h,p,w){var a=h("./gen.js"),l=h("./mul.js"),b=h("./sub.js"),c=h("./div.js"),g=h("./data.js"),f=h("./peek.js"),d=h("./accum.js"),e=h("./ifelseif.js"),k=h("./lt.js"),m=h("./bang.js"),n=h("./env.js"),q=h("./param.js"),t=h("./add.js"),y=h("./gtp.js"),v=h("./not.js"),
r=h("./and.js"),u=h("./neq.js"),x=h("./poke.js");p.exports=function(z,A,B,C,D,E){z=void 0===z?44:z;A=void 0===A?22050:A;B=void 0===B?44100:B;C=void 0===C?.6:C;D=void 0===D?44100:D;var F=m(),G=d(1,F,{max:Infinity,shouldWrap:!1,initialValue:Infinity}),H=q(1),I=Object.assign({},{shape:"exponential",alpha:5,triggerRelease:!1},E),K=g([0]);E=n({length:1024,alpha:I.alpha,shift:0,type:I.shape});var M=I.triggerRelease?H:k(G,t(z,A,B));var L=I.triggerRelease?y(b(C,d(c(C,D),0,{shouldWrap:!1})),0):b(C,l(c(b(G,
t(z,A,B)),D),C));B=I.triggerRelease?v(H):k(G,t(z,A,B,D));var J=e(k(G,z),f(E,c(G,z),{boundmode:"clamp"}),k(G,t(z,A)),f(E,b(1,l(c(b(G,z),A),b(1,C))),{boundmode:"clamp"}),r(M,u(G,Infinity)),f(E,C),B,f(E,L,{boundmode:"clamp"}),u(G,Infinity),x(K,1,0,{inline:0}),0);var N="worklet"===a.mode;!0===N&&(J.node=null,utilities.register(J));J.trigger=function(){H.value=1;F.trigger()};J.isComplete=function(){return!0===N&&null!==J.node?new Promise(function(O){J.node.getMemoryValue(K.memory.values.idx,O)}):a.memory.heap[K.memory.values.idx]};
J.release=function(){H.value=0;N&&null!==J.node?J.node.port.postMessage({key:"set",idx:L.inputs[0].inputs[1].memory.value.idx,value:0}):a.memory.heap[L.inputs[0].inputs[1].memory.value.idx]=0};return J}},{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":18,"./div.js":23,"./env.js":24,"./gen.js":32,"./gtp.js":35,"./ifelseif.js":37,"./lt.js":40,"./mul.js":50,"./neq.js":51,"./not.js":53,"./param.js":55,"./peek.js":56,"./poke.js":59,"./sub.js":70}],7:[function(h,p,w){var a=h("./gen.js"),
l={basename:"and",gen:function(){var b=a.getInputs(this);b=" var "+this.name+"=("+b[0]+" !== 0 && "+b[1]+" !== 0) | 0\\n\\n";a.memo[this.name]=""+this.name;return[""+this.name,b]}};p.exports=function(b,c){var g=Object.create(l);Object.assign(g,{uid:a.getUID(),inputs:[b,c]});g.name=""+g.basename+g.uid;return g}},{"./gen.js":32}],8:[function(h,p,w){var a=h("./gen.js"),l={basename:"asin",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({asin:c?
"Math.sin":Math.asin}),b=g+"asin("+b[0]+")"):b=Math.asin(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.id=a.getUID();c.name=c.basename+"{asin.id}";return c}},{"./gen.js":32}],9:[function(h,p,w){var a=h("./gen.js"),l={basename:"atan",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({atan:c?"Math.atan":Math.atan}),b=g+"atan("+b[0]+")"):b=Math.atan(parseFloat(b[0]));return b}};p.exports=function(b){var c=
Object.create(l);c.inputs=[b];c.id=a.getUID();c.name=c.basename+"{atan.id}";return c}},{"./gen.js":32}],10:[function(h,p,w){h("./gen.js");var a=h("./history.js"),l=h("./mul.js"),b=h("./sub.js");p.exports=function(c){c=void 0===c?44100:c;var g=a(1);g.in(l(g.out,Math.exp(-6.907755278921/c)));g.out.trigger=function(){g.value=1};return b(1,g.out)}},{"./gen.js":32,"./history.js":36,"./mul.js":50,"./sub.js":70}],11:[function(h,p,w){var a=h("./gen.js"),l={gen:function(){a.requestMemory(this.memory);var b=
" var "+this.name+"=memory["+this.memory.value.idx+"]\\nif("+this.name+" === 1) memory["+this.memory.value.idx+"]=0\\n";a.memo[this.name]=this.name;return[this.name,b]}};p.exports=function(b){var c=Object.create(l);b=Object.assign({},{min:0,max:1},b);c.name="bang"+a.getUID();c.min=b.min;c.max=b.max;var g="worklet"===a.mode;!0===g&&(c.node=null,utilities.register(c));c.trigger=function(){!0===g&&null!==c.node?c.node.port.postMessage({key:"set",idx:c.memory.value.idx,value:c.max}):a.memory.heap[c.memory.value.idx]=
c.max};c.memory={value:{length:1,idx:null}};return c}},{"./gen.js":32}],12:[function(h,p,w){var a=h("./gen.js"),l={basename:"bool",gen:function(){return a.getInputs(this)[0]+" === 0 ? 0 : 1"}};p.exports=function(b){var c=Object.create(l);Object.assign(c,{uid:a.getUID(),inputs:[b]});c.name=""+c.basename+c.uid;return c}},{"./gen.js":32}],13:[function(h,p,w){var a=h("./gen.js"),l={name:"ceil",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])){var f={};a.closures.add((f[this.name]=
c?"Math.ceil":Math.ceil,f));b=g+"ceil("+b[0]+")"}else b=Math.ceil(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];return c}},{"./gen.js":32}],14:[function(h,p,w){var a=h("./gen.js");h("./floor.js");h("./sub.js");h("./memo.js");var l={basename:"clip",gen:function(){var b=a.getInputs(this);b=" var "+this.name+"="+b[0]+"\\nif("+this.name+" > "+b[2]+") "+this.name+"="+b[2]+"\\nelse if("+this.name+" < "+b[1]+") "+this.name+"="+b[1]+"\\n";a.memo[this.name]=
this.name;return[this.name," "+b]}};p.exports=function(b,c,g){c=void 0===c?-1:c;g=void 0===g?1:g;var f=Object.create(l);Object.assign(f,{min:c,max:g,uid:a.getUID(),inputs:[b,c,g]});f.name=""+f.basename+f.uid;return f}},{"./floor.js":29,"./gen.js":32,"./memo.js":44,"./sub.js":70}],15:[function(h,p,w){var a=h("./gen.js"),l={basename:"cos",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({cos:c?"Math.cos":Math.cos}),b=g+"cos("+b[0]+")"):b=Math.cos(parseFloat(b[0]));
return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.id=a.getUID();c.name=c.basename+"{cos.id}";return c}},{"./gen.js":32}],16:[function(h,p,w){var a=h("./gen.js"),l={basename:"counter",gen:function(){var b=a.getInputs(this),c="gen."+this.name;null===this.memory.value.idx&&a.requestMemory(this.memory);a.memory.heap[this.memory.value.idx]=this.initialValue;b=this.callback(c,b[0],b[1],b[2],b[3],b[4],"memory["+this.memory.value.idx+"]","memory["+this.memory.wrap.idx+"]");a.memo[this.name]=
this.name+"_value";void 0===a.memo[this.wrap.name]&&this.wrap.gen();return[this.name+"_value",b]},callback:function(b,c,g,f,d,e,k,m){b=this.max-this.min;var n="",q="";"number"===typeof this.inputs[3]&&1>this.inputs[3]||(n+=" if("+d+" >= 1) "+k+"="+g+"\\n");n+=" var "+this.name+"_value="+k+";\\n "+k+" += "+c+"\\n";"number"===typeof this.max&&Infinity!==this.max&&"number"!==typeof this.min?q=" if("+k+" >= "+this.max+" && "+e+" > 0) {\\n"+k+" -= "+b+"\\n"+m+"=1\\n}else{\\n"+m+"=0\\n}\\n":Infinity!==
this.max&&Infinity!==this.min?q=" if("+k+" >= "+f+" && "+e+" > 0) {\\n"+k+" -= "+f+" - "+g+"\\n"+m+"=1\\n}else if("+k+"<"+g+"&&"+e+">0) {\\n"+k+" += "+f+" - "+g+"\\n"+m+"=1\\n}else{\\n"+m+"=0\\n}\\n":n+="\\n";return n+q}};p.exports=function(b,c,g,f,d,e){b=void 0===b?1:b;c=void 0===c?0:c;g=void 0===g?Infinity:g;f=void 0===f?0:f;d=void 0===d?1:d;var k=Object.create(l);e=Object.assign({initialValue:0,shouldWrap:!0},e);Object.assign(k,{min:c,max:g,initialValue:e.initialValue,value:e.initialValue,
uid:a.getUID(),inputs:[b,c,g,f,d],memory:{value:{length:1,idx:null},wrap:{length:1,idx:null}},wrap:{gen:function(){null===k.memory.wrap.idx&&a.requestMemory(k.memory);a.getInputs(this);a.memo[this.name]="memory[ "+k.memory.wrap.idx+" ]";return"memory[ "+k.memory.wrap.idx+" ]"}}},e);Object.defineProperty(k,"value",{get:function(){if(null!==this.memory.value.idx)return a.memory.heap[this.memory.value.idx]},set:function(m){null!==this.memory.value.idx&&(a.memory.heap[this.memory.value.idx]=m)}});k.wrap.inputs=
[k];k.name=""+k.basename+k.uid;k.wrap.name=k.name+"_wrap";return k}},{"./gen.js":32}],17:[function(h,p,w){var a=h("./gen.js");h("./phasor.js");var l=h("./data.js"),b=h("./peek.js");h("./mul.js");var c=h("./phasor.js"),g={basename:"cycle",initTable:function(){for(var f=new Float32Array(1024),d=0,e=f.length;d<e;d++)f[d]=Math.sin(d/e*2*Math.PI);a.globals.cycle=l(f,1,{immutable:!0})}};p.exports=function(f,d,e){f=void 0===f?1:f;d=void 0===d?0:d;"undefined"===typeof a.globals.cycle&&g.initTable();e=Object.assign({},
{min:0},e);f=b(a.globals.cycle,c(f,d,e));f.name="cycle"+a.getUID();return f}},{"./data.js":18,"./gen.js":32,"./mul.js":50,"./peek.js":56,"./phasor.js":58}],18:[function(h,p,w){var a=h("./gen.js"),l=h("./utilities.js"),b=h("./peek.js"),c=h("./poke.js"),g={basename:"data",globals:{},memo:{},gen:function(){if(void 0===a.memo[this.name]){a.requestMemory(this.memory,this.immutable);var f=this.memory.values.idx;if(void 0!==this.buffer)try{a.memory.heap.set(this.buffer,f)}catch(d){throw console.log(d),Error("error with request. asking for "+
this.buffer.length+". current index: "+a.memoryIndex+" of "+a.memory.heap.length);}-1===this.name.indexOf("data")?g.memo[this.name]=f:a.memo[this.name]=f}else f=a.memo[this.name];return f}};p.exports=function(f,d,e){d=void 0===d?1:d;var k=!1;if(void 0!==e&&void 0!==e.global&&a.globals[e.global])return a.globals[e.global];if("number"===typeof f)if(1!==d){var m=[];for(var n=0;n<d;n++)m[n]=new Float32Array(f)}else m=new Float32Array(f);else if(Array.isArray(f))for(m=new Float32Array(f.length),d=0;d<
f.length;d++)m[d]=f[d];else"string"===typeof f?(m={length:1<d?d:1},k=!0):f instanceof Float32Array&&(m=f);var q=Object.create(g);Object.assign(q,{buffer:m,name:g.basename+a.getUID(),dim:void 0!==m?m.length:1,channels:1,onload:void 0!==e?e.onload||null:null,immutable:void 0!==e&&!0===e.immutable?!0:!1,load:function(t,y){l.loadSample(t,q).then(function(v){g.memo[f]=v;q.name=t;q.memory.values.length=q.dim=v.length;a.requestMemory(q.memory,q.immutable);a.memory.heap.set(v,q.memory.values.idx);if("function"===
typeof q.onload)q.onload(v);y(q)})},memory:{values:{length:void 0!==m?m.length:1,idx:null}}},e);if(void 0!==e&&(void 0!==e.global&&(a.globals[e.global]=q),!0===e.meta))for(e={$jscomp$loop$prop$i$36$81:0},m=q.buffer.length;e.$jscomp$loop$prop$i$36$81<m;e={$jscomp$loop$prop$i$36$81:e.$jscomp$loop$prop$i$36$81},e.$jscomp$loop$prop$i$36$81++)Object.defineProperty(q,e.$jscomp$loop$prop$i$36$81,{get:function(t){return function(){return b(q,t.$jscomp$loop$prop$i$36$81,{mode:"simple",interp:"none"})}}(e),
set:function(t){return function(y){return c(q,y,t.$jscomp$loop$prop$i$36$81)}}(e)});if(!0===k)k=new Promise(function(t,y){l.loadSample(f,q).then(function(v){g.memo[f]=v;q.memory.values.length=q.dim=v.length;q.buffer=v;t(q)})});else{if(void 0!==g.memo[f])a.once("memory init",function(){a.requestMemory(q.memory,q.immutable);a.memory.heap.set(q.buffer,q.memory.values.idx);if("function"===typeof q.onload)q.onload(q.buffer)});k=q}return k}},{"./gen.js":32,"./peek.js":56,"./poke.js":59,"./utilities.js":76}],
19:[function(h,p,w){h("./gen.js");var a=h("./history.js"),l=h("./sub.js"),b=h("./add.js"),c=h("./mul.js"),g=h("./memo.js");p.exports=function(f){var d=a(),e=a();var k=g(b(l(f,d.out),c(e.out,.9997)));d.in(f);e.in(k);return k}},{"./add.js":5,"./gen.js":32,"./history.js":36,"./memo.js":44,"./mul.js":50,"./sub.js":70}],20:[function(h,p,w){h("./gen.js");var a=h("./history.js"),l=h("./mul.js"),b=h("./t60.js");p.exports=function(c,g){c=void 0===c?44100:c;g=Object.assign({},{initValue:1},g);var f=a(g.initValue);
f.in(l(f.out,b(c)));f.out.trigger=function(){f.value=1};return f.out}},{"./gen.js":32,"./history.js":36,"./mul.js":50,"./t60.js":72}],21:[function(h,p,w){var a=h("./gen.js"),l=h("./data.js"),b=h("./poke.js"),c=h("./peek.js"),g=h("./sub.js"),f=h("./wrap.js"),d=h("./accum.js");h("./memo.js");var e={basename:"delay",gen:function(){var m=a.getInputs(this);a.memo[this.name]=m[0];return m[0]}},k={size:512,interp:"none"};p.exports=function(m,n,q){var t=Object.create(e);!1===Array.isArray(n)&&(n=[n]);q=Object.assign({},
k,q);var y=Math.max.apply(Math,$jscomp.arrayFromIterable(n));q.size<y&&(q.size=y);var v=l(q.size);t.inputs=[];y=d(1,0,{max:q.size,min:0});for(var r=0;r<n.length;r++)t.inputs[r]=c(v,f(g(y,n[r]),0,q.size),{mode:"samples",interp:q.interp});t.outputs=t.inputs;b(v,m,y);t.name=""+t.basename+a.getUID();return t}},{"./accum.js":2,"./data.js":18,"./gen.js":32,"./memo.js":44,"./peek.js":56,"./poke.js":59,"./sub.js":70,"./wrap.js":78}],22:[function(h,p,w){var a=h("./gen.js"),l=h("./history.js"),b=h("./sub.js");
p.exports=function(c){var g=l();g.in(c);c=b(c,g.out);c.name="delta"+a.getUID();return c}},{"./gen.js":32,"./history.js":36,"./sub.js":70}],23:[function(h,p,w){var a=h("./gen.js"),l={basename:"div",gen:function(){var b=a.getInputs(this),c=" var "+this.name+"=",g=b[0],f=isNaN(g);b.forEach(function(d,e){if(0!==e){var k=isNaN(d);e=e===b.length-1;f||k?c+=g+" / "+d:(g/=d,c+=g);e||(c+=" / ")}});c+="\\n";a.memo[this.name]=this.name;return[this.name,c]}};p.exports=function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-
0]=arguments[g];g=Object.create(l);Object.assign(g,{id:a.getUID(),inputs:c});g.name=g.basename+g.id;return g}},{"./gen.js":32}],24:[function(h,p,w){var a=h("./gen"),l=h("./windows"),b=h("./data");h("./peek");h("./phasor");var c={type:"triangular",length:1024,alpha:.15,shift:0,reverse:!1};p.exports=function(g){g=Object.assign({},c,g);var f=new Float32Array(g.length),d=g.type+"_"+g.length+"_"+g.shift+"_"+g.reverse+"_"+g.alpha;if("undefined"===typeof a.globals.windows[d]){for(var e=0;e<g.length;e++)f[e]=
l[g.type](g.length,e,g.alpha,g.shift);!0===g.reverse&&f.reverse();a.globals.windows[d]=b(f)}g=a.globals.windows[d];g.name="env"+a.getUID();return g}},{"./data":18,"./gen":32,"./peek":56,"./phasor":58,"./windows":77}],25:[function(h,p,w){var a=h("./gen.js"),l={basename:"eq",gen:function(){var b=a.getInputs(this);b=this.inputs[0]===this.inputs[1]?1:" var "+this.name+"=("+b[0]+" === "+b[1]+") | 0\\n\\n";a.memo[this.name]=""+this.name;return[""+this.name,b]}};p.exports=function(b,c){var g=Object.create(l);
Object.assign(g,{uid:a.getUID(),inputs:[b,c]});g.name=""+g.basename+g.uid;return g}},{"./gen.js":32}],26:[function(h,p,w){var a=h("./gen.js"),l={name:"exp",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])){var f={};a.closures.add((f[this.name]=c?"Math.exp":Math.exp,f));b=g+"exp("+b[0]+")"}else b=Math.exp(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];return c}},{"./gen.js":32}],27:[function(h,p,w){var a=h("./realm.js");
p.exports=function(l,b){function c(m){var n=this,q={},t=-1;this.parameters.forEach(function(v,r){var u=f[++t]||(f[t]=new Float32Array(n.bufferSize));u.fill(v.value);q[r]=u});this.processor.realm.exec("self.sampleRate=sampleRate="+this.context.sampleRate+";self.currentTime=currentTime="+this.context.currentTime);var y=g(m.inputBuffer);m=g(m.outputBuffer);this.instance.process([y],[m],q)}function g(m){for(var n=[],q=0;q<m.numberOfChannels;q++)n[q]=m.getChannelData(q);return n}l=void 0===l?window:l;
b=void 0===b?4096:b;var f=[],d;if("function"!==typeof AudioWorkletNode||!("audioWorklet"in AudioContext.prototype)){l.AudioWorkletNode=function(m,n,q){n=(m.$$processors||(m.$$processors={}))[n];var t=m.createScriptProcessor(b,2,q&&q.outputChannelCount?q.outputChannelCount[0]:2);t.parameters=new Map;if(n.properties)for(var y=0;y<n.properties.length;y++){var v=n.properties[y],r=m.createGain().gain;r.value=v.defaultValue;t.parameters.set(v.name,r)}m=new MessageChannel;d=m.port2;q=new n.Processor(q||
{});d=null;t.port=m.port1;t.processor=n;t.instance=q;t.onaudioprocess=c;return t};Object.defineProperty((l.AudioContext||l.webkitAudioContext).prototype,"audioWorklet",{get:function(){return this.$$audioWorklet||(this.$$audioWorklet=new l.AudioWorklet(this))}});var e=function(){this.port=d};e.prototype={};var k=function(m){this.$$context=m};k.prototype.addModule=function(m,n){var q=this;return fetch(m).then(function(t){if(!t.ok)throw Error(t.status);return t.text()}).then(function(t){var y={sampleRate:q.$$context.sampleRate,
currentTime:q.$$context.currentTime,AudioWorkletProcessor:e,registerProcessor:function(r,u){var x=q.$$context;(x.$$processors||(x.$$processors={}))[r]={realm:v,context:y,Processor:u,properties:u.parameterDescriptors||[]}}};y.self=y;var v=new a(y,document.documentElement);v.exec((n&&n.transpile||String)(t));return null})};l.AudioWorklet=k}}},{"./realm.js":28}],28:[function(h,p,w){p.exports=function(a,l){var b=document.createElement("iframe");b.style.cssText="position:absolute;left:0;top:-999px;width:1px;height:1px;";
l.appendChild(b);l=b.contentWindow;b=l.document;var c="var window,$hook";for(f in l)f in a||"eval"===f||(c+=",",c+=f);for(var g in a)c+=",",c+=g,c+="=self.",c+=g;var f=b.createElement("script");f.appendChild(b.createTextNode('function $hook(self,console) {"use strict";\\n'+c+";return function() {return eval(arguments[0])}}"));b.body.appendChild(f);this.exec=l.$hook.call(a,a,console)}},{}],29:[function(h,p,w){var a=h("./gen.js"),l={name:"floor",gen:function(){var b=a.getInputs(this);return isNaN(b[0])?
"("+b[0]+" | 0 )":b[0]|0}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];return c}},{"./gen.js":32}],30:[function(h,p,w){var a=h("./gen.js"),l={basename:"fold",gen:function(){var b=a.getInputs(this);b=this.createCallback(b[0],this.min,this.max);a.memo[this.name]=this.name+"_value";return[this.name+"_value",b]},createCallback:function(b,c,g){return" var "+(this.name+"_value="+b+",\\n"+this.name+"_range="+g+" - "+c+",\\n"+this.name+"_numWraps=0\\n\\nif("+this.name+"_value >= "+g+"){\\n"+
this.name+"_value -= "+this.name+"_range\\nif("+this.name+"_value >= "+g+"){\\n"+this.name+"_numWraps=(("+this.name+"_value-"+c+")/"+this.name+"_range) | 0\\n"+this.name+"_value -= "+this.name+"_range * "+this.name+"_numWraps\\n}\\n"+this.name+"_numWraps++\\n} else if("+this.name+"_value < "+c+"){\\n"+this.name+"_value += "+this.name+"_range\\nif("+this.name+"_value < "+c+"){\\n"+this.name+"_numWraps=(("+this.name+"_value - "+c+") / "+this.name+"_range- 1) | 0\\n"+this.name+"_value -= "+this.name+"_range * "+
this.name+"_numWraps\\n}\\n"+this.name+"_numWraps--\\n}\\nif("+this.name+"_numWraps & 1) "+this.name+"_value="+g+" + "+c+"-"+this.name+"_value\\n")}};p.exports=function(b,c,g){c=void 0===c?0:c;g=void 0===g?1:g;var f=Object.create(l);Object.assign(f,{min:c,max:g,uid:a.getUID(),inputs:[b]});f.name=""+f.basename+f.uid;return f}},{"./gen.js":32}],31:[function(h,p,w){var a=h("./gen.js"),l={basename:"gate",controlString:null,gen:function(){var b=a.getInputs(this);a.requestMemory(this.memory);var c="memory[ "+
this.memory.lastInput.idx+" ]";var g=this.memory.lastInput.idx+1,f=b[1];c=" if("+f+" !== "+c+" ) {\\nmemory[ "+c+" + "+g+"]=0 \\n"+c+"="+f+"\\n}\\nmemory[ "+g+" + "+f+" ]="+b[0]+"\\n";this.controlString=b[1];this.initialized=!0;a.memo[this.name]=this.name;this.outputs.forEach(function(d){return d.gen()});return[null," "+c]},childgen:function(){!1===this.parent.initialized&&a.getInputs(this);void 0===a.memo[this.name]&&(a.requestMemory(this.memory),a.memo[this.name]="memory[ "+this.memory.value.idx+
" ]");return"memory[ "+this.memory.value.idx+" ]"}};p.exports=function(b,c,g){var f=Object.create(l),d={count:2};Object.assign(d,g);Object.assign(f,{outputs:[],uid:a.getUID(),inputs:[c,b],memory:{lastInput:{length:1,idx:null}},initialized:!1},d);f.name=""+f.basename+a.getUID();for(b=0;b<f.count;b++)f.outputs.push({index:b,gen:l.childgen,parent:f,inputs:[f],memory:{value:{length:1,idx:null}},initialized:!1,name:f.name+"_out"+a.getUID()});return f}},{"./gen.js":32}],32:[function(h,p,w){var a=h("memory-helper");
h=h("events").EventEmitter;var l={accum:0,getUID:function(){return this.accum++},debug:!1,samplerate:44100,shouldLocalize:!1,graph:null,globals:{windows:{}},mode:"worklet",closures:new Set,params:new Set,inputs:new Set,parameters:new Set,endBlock:new Set,histories:new Map,memo:{},export:function(b){},addToEndBlock:function(b){this.endBlock.add("  "+b)},requestMemory:function(b,c){c=void 0===c?!1:c;for(var g in b){var f=b[g];void 0===f.length?console.log("undefined length for:",g):f.idx=l.memory.alloc(f.length,
c)}},createMemory:function(b,c){return a.create(void 0===b?4096:b,c)},createCallback:function(b,c,g,f,d){g=void 0===g?!1:g;f=void 0===f?!1:f;d=void 0===d?Float64Array:d;var e=Array.isArray(b)&&1<b.length;this.memory="number"===typeof c||void 0===c?this.createMemory(c,d):c;this.outputIdx=this.memory.alloc(2,!0);this.emit("memory init");this.graph=b;this.memo={};this.endBlock.clear();this.closures.clear();this.inputs.clear();this.params.clear();this.globals={windows:{}};this.parameters.clear();this.functionBody=
"  'use strict'\\n";!1===f&&(this.functionBody+="worklet"===this.mode?"  var memory=this.memory\\n\\n":"  var memory=gen.memory\\n\\n");for(c=0;c<1+e;c++)if("number"!==typeof b[c]){var k=e?this.getInput(b[c]):this.getInput(b);d="";d+=Array.isArray(k)?k[1]+"\\n"+k[0]:k;d=d.split("\\n");-1<d[d.length-1].trim().indexOf("let")&&d.push("\\n");k=d.length-1;d[k]="  memory["+(this.outputIdx+c)+"] ="+d[k]+"\\n";this.functionBody+=d.join("\\n")}this.histories.forEach(function(m){null!==m&&m.gen()});b=e?"  return [ memory["+
this.outputIdx+"],memory["+(this.outputIdx+1)+"] ]":"  return memory["+this.outputIdx+"]";this.functionBody=this.functionBody.split("\\n");this.endBlock.size&&(this.functionBody=this.functionBody.concat(Array.from(this.endBlock)));this.functionBody.push(b);this.functionBody=this.functionBody.join("\\n");!0===f&&this.parameters.add("memory");f="";if("worklet"===this.mode){b=$jscomp.makeIterator(this.parameters.values());for(c=b.next();!c.done;c=b.next())f+=c.value+",";f=f.slice(0,-1)}b=0!==this.parameters.size&&
0<this.inputs.size?",":"";c="";if("worklet"===this.mode){d=$jscomp.makeIterator(this.inputs.values());for(k=d.next();!k.done;k=d.next())c+=k.value.name+",";c=c.slice(0,-1)}f="worklet"===this.mode?"return function("+c+" "+b+" "+f+" ){ \\n"+this.functionBody+"\\n}":"return function gen( "+[].concat($jscomp.arrayFromIterable(this.parameters)).join(",")+" ){ \\n"+this.functionBody+"\\n}";(this.debug||g)&&console.log(f);g=(new Function(f))();f=$jscomp.makeIterator(this.closures.values());for(c=f.next();!c.done;c=
f.next())b=c.value,c=Object.keys(b)[0],g[c]=b[c];f={};b=$jscomp.makeIterator(this.params.values());for(c=b.next();!c.done;f={$jscomp$loop$prop$ugen$43$84:f.$jscomp$loop$prop$ugen$43$84},c=b.next())c=c.value,d=Object.keys(c)[0],f.$jscomp$loop$prop$ugen$43$84=c[d],Object.defineProperty(g,d,{configurable:!0,get:function(m){return function(){return m.$jscomp$loop$prop$ugen$43$84.value}}(f),set:function(m){return function(n){m.$jscomp$loop$prop$ugen$43$84.value=n}}(f)});g.members=this.closures;g.data=
this.data;g.params=this.params;g.inputs=this.inputs;g.parameters=this.parameters;g.out=this.memory.heap.subarray(this.outputIdx,this.outputIdx+2);g.isStereo=e;g.memory=this.memory.heap;this.histories.clear();return g},getInputs:function(b){return b.inputs.map(l.getInput)},getInput:function(b){if("object"===typeof b)if(l.memo[b.name])var c=l.memo[b.name];else Array.isArray(b)?(l.getInput(b[0]),l.getInput(b[1])):("function"!==typeof b.gen&&(console.log("no gen found:",b,b.gen),b=b.graph),b=b.gen(),
Array.isArray(b)?(l.shouldLocalize?(l.codeName=b[0],l.localizedCode.push(b[1])):l.functionBody+=b[1],c=b[0]):c=b);else c=b;return c},startLocalize:function(){this.localizedCode=[];this.shouldLocalize=!0},endLocalize:function(){this.shouldLocalize=!1;return[this.codeName,this.localizedCode.slice(0)]},free:function(b){if(Array.isArray(b)){b=$jscomp.makeIterator(b);for(var c=b.next();!c.done;c=b.next())this.free(c.value)}else if("object"===typeof b){if(void 0!==b.memory)for(c in b.memory)this.memory.free(b.memory[c].idx);
if(Array.isArray(b.inputs))for(b=$jscomp.makeIterator(b.inputs),c=b.next();!c.done;c=b.next())this.free(c.value)}}};l.__proto__=new h;p.exports=l},{events:154,"memory-helper":79}],33:[function(h,p,w){var a=h("./gen.js"),l={basename:"gt",gen:function(){var b=a.getInputs(this);var c="  var "+this.name+"=";c=isNaN(this.inputs[0])||isNaN(this.inputs[1])?c+("(( "+b[0]+" > "+b[1]+") | 0 )"):c+(b[0]>b[1]?1:0);a.memo[this.name]=this.name;return[this.name,c+"\\n\\n"]}};p.exports=function(b,c){var g=Object.create(l);
g.inputs=[b,c];g.name=g.basename+a.getUID();return g}},{"./gen.js":32}],34:[function(h,p,w){var a=h("./gen.js"),l={name:"gte",gen:function(){var b=a.getInputs(this);var c="  var "+this.name+"=";c=isNaN(this.inputs[0])||isNaN(this.inputs[1])?c+("( "+b[0]+" >= "+b[1]+" | 0 )"):c+(b[0]>=b[1]?1:0);a.memo[this.name]=this.name;return[this.name,c+"\\n\\n"]}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];g.name="gte"+a.getUID();return g}},{"./gen.js":32}],35:[function(h,p,w){var a=h("./gen.js"),
l={name:"gtp",gen:function(){var b=a.getInputs(this);return isNaN(this.inputs[0])||isNaN(this.inputs[1])?"("+b[0]+" * ( ( "+b[0]+" > "+b[1]+" ) | 0 ) )":b[0]*(b[0]>b[1]|0)}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];return g}},{"./gen.js":32}],36:[function(h,p,w){var a=h("./gen.js");p.exports=function(l){l=void 0===l?0:l;var b={inputs:[l],memory:{value:{length:1,idx:null}},recorder:null,in:function(c){if(a.histories.has(c)){var g=a.histories.get(c);b.name=g.name;return g}var f=
{gen:function(){var d=a.getInputs(b);null===b.memory.value.idx&&(a.requestMemory(b.memory),a.memory.heap[b.memory.value.idx]=l);a.addToEndBlock("memory[ "+b.memory.value.idx+" ]="+d[0]);a.histories.set(c,f);return d[0]},name:b.name+"_in"+a.getUID(),memory:b.memory};this.inputs[0]=c;return b.recorder=f},out:{gen:function(){null===b.memory.value.idx&&(void 0===a.histories.get(b.inputs[0])&&a.histories.set(b.inputs[0],b.recorder),a.requestMemory(b.memory),a.memory.heap[b.memory.value.idx]=parseFloat(l));
return"memory[ "+b.memory.value.idx+" ] "}},uid:a.getUID()};b.out.memory=b.memory;b.name="history"+b.uid;b.out.name=b.name+"_out";b.in._name=b.name="_in";Object.defineProperty(b,"value",{get:function(){if(null!==this.memory.value.idx)return a.memory.heap[this.memory.value.idx]},set:function(c){null!==this.memory.value.idx&&(a.memory.heap[this.memory.value.idx]=c)}});return b}},{"./gen.js":32}],37:[function(h,p,w){var a=h("./gen.js"),l={basename:"ifelse",gen:function(){var b=this.inputs[0],c=a.getInput(b[b.length-
1]);c="  var "+this.name+"_out="+c+"\\n";for(var g=0;g<b.length-2;g+=2){var f=g===b.length-3,d=a.getInput(b[g]),e=b[g+1];if("number"===typeof e){var k=e;e=null}else void 0===a.memo[e.name]?(a.startLocalize(),a.getInput(e),k=a.endLocalize(),e=k[0],k=k[1].join(""),k="  "+k.replace(/\\n/gi,"\\n  ")):(k="",e=a.memo[e.name]);k=null===e?"  "+this.name+"_out="+k:k+"  "+this.name+"_out="+e;0===g&&(c+=" ");c+=" if( "+d+" === 1 ) {\\n"+k+"\\n}";c=f?c+"\\n":c+" else"}a.memo[this.name]=this.name+"_out";return[this.name+
"_out",c]}};p.exports=function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-0]=arguments[g];g=Object.create(l);c=Array.isArray(c[0])?c[0]:c;Object.assign(g,{uid:a.getUID(),inputs:[c]});g.name=""+g.basename+g.uid;return g}},{"./gen.js":32}],38:[function(h,p,w){var a=h("./gen.js"),l={basename:"in",gen:function(){var b="worklet"===a.mode;b?a.inputs.add(this):a.parameters.add(this.name);a.memo[this.name]=!0===b?this.name+"[i]":this.name;return a.memo[this.name]}};p.exports=function(b,c,g,f,d,e){c=void 0===
c?0:c;g=void 0===g?0:g;f=void 0===f?0:f;d=void 0===d?0:d;e=void 0===e?1:e;var k=Object.create(l);k.id=a.getUID();k.name=void 0!==b?b:""+k.basename+k.id;Object.assign(k,{defaultValue:f,min:d,max:e,inputNumber:c,channelNumber:g});k[0]={gen:function(){a.parameters.has(k.name)||a.parameters.add(k.name);return k.name+"[0]"}};k[1]={gen:function(){a.parameters.has(k.name)||a.parameters.add(k.name);return k.name+"[1]"}};return k}},{"./gen.js":32}],39:[function(h,p,w){var a={export:function(l){l===window&&
(l.ssd=a.history,l.input=a.in,l.ternary=a.switch,delete a.history,delete a.in,delete a.switch);Object.assign(l,a);Object.defineProperty(a,"samplerate",{get:function(){return a.gen.samplerate},set:function(b){}});a.in=l.input;a.history=l.ssd;a.switch=l.ternary;l.clip=a.clamp},gen:h("./gen.js"),abs:h("./abs.js"),round:h("./round.js"),param:h("./param.js"),add:h("./add.js"),sub:h("./sub.js"),mul:h("./mul.js"),div:h("./div.js"),accum:h("./accum.js"),counter:h("./counter.js"),sin:h("./sin.js"),cos:h("./cos.js"),
tan:h("./tan.js"),tanh:h("./tanh.js"),asin:h("./asin.js"),acos:h("./acos.js"),atan:h("./atan.js"),phasor:h("./phasor.js"),data:h("./data.js"),peek:h("./peek.js"),peekDyn:h("./peekDyn.js"),cycle:h("./cycle.js"),history:h("./history.js"),delta:h("./delta.js"),floor:h("./floor.js"),ceil:h("./ceil.js"),min:h("./min.js"),max:h("./max.js"),sign:h("./sign.js"),dcblock:h("./dcblock.js"),memo:h("./memo.js"),rate:h("./rate.js"),wrap:h("./wrap.js"),mix:h("./mix.js"),clamp:h("./clamp.js"),poke:h("./poke.js"),
delay:h("./delay.js"),fold:h("./fold.js"),mod:h("./mod.js"),sah:h("./sah.js"),noise:h("./noise.js"),not:h("./not.js"),gt:h("./gt.js"),gte:h("./gte.js"),lt:h("./lt.js"),lte:h("./lte.js"),bool:h("./bool.js"),gate:h("./gate.js"),train:h("./train.js"),slide:h("./slide.js"),in:h("./in.js"),t60:h("./t60.js"),mtof:h("./mtof.js"),ltp:h("./ltp.js"),gtp:h("./gtp.js"),switch:h("./switch.js"),mstosamps:h("./mstosamps.js"),selector:h("./selector.js"),utilities:h("./utilities.js"),pow:h("./pow.js"),attack:h("./attack.js"),
decay:h("./decay.js"),windows:h("./windows.js"),env:h("./env.js"),ad:h("./ad.js"),adsr:h("./adsr.js"),ifelse:h("./ifelseif.js"),bang:h("./bang.js"),and:h("./and.js"),pan:h("./pan.js"),eq:h("./eq.js"),neq:h("./neq.js"),exp:h("./exp.js"),process:h("./process.js"),seq:h("./seq.js")};a.gen.lib=a;p.exports=a},{"./abs.js":1,"./accum.js":2,"./acos.js":3,"./ad.js":4,"./add.js":5,"./adsr.js":6,"./and.js":7,"./asin.js":8,"./atan.js":9,"./attack.js":10,"./bang.js":11,"./bool.js":12,"./ceil.js":13,"./clamp.js":14,
"./cos.js":15,"./counter.js":16,"./cycle.js":17,"./data.js":18,"./dcblock.js":19,"./decay.js":20,"./delay.js":21,"./delta.js":22,"./div.js":23,"./env.js":24,"./eq.js":25,"./exp.js":26,"./floor.js":29,"./fold.js":30,"./gate.js":31,"./gen.js":32,"./gt.js":33,"./gte.js":34,"./gtp.js":35,"./history.js":36,"./ifelseif.js":37,"./in.js":38,"./lt.js":40,"./lte.js":41,"./ltp.js":42,"./max.js":43,"./memo.js":44,"./min.js":45,"./mix.js":46,"./mod.js":47,"./mstosamps.js":48,"./mtof.js":49,"./mul.js":50,"./neq.js":51,
"./noise.js":52,"./not.js":53,"./pan.js":54,"./param.js":55,"./peek.js":56,"./peekDyn.js":57,"./phasor.js":58,"./poke.js":59,"./pow.js":60,"./process.js":61,"./rate.js":62,"./round.js":63,"./sah.js":64,"./selector.js":65,"./seq.js":66,"./sign.js":67,"./sin.js":68,"./slide.js":69,"./sub.js":70,"./switch.js":71,"./t60.js":72,"./tan.js":73,"./tanh.js":74,"./train.js":75,"./utilities.js":76,"./windows.js":77,"./wrap.js":78}],40:[function(h,p,w){var a=h("./gen.js"),l={basename:"lt",gen:function(){var b=
a.getInputs(this);var c="  var "+this.name+"=";c=isNaN(this.inputs[0])||isNaN(this.inputs[1])?c+("(( "+b[0]+" < "+b[1]+") | 0  )"):c+(b[0]<b[1]?1:0);a.memo[this.name]=this.name;return[this.name,c+"\\n"]}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];g.name=g.basename+a.getUID();return g}},{"./gen.js":32}],41:[function(h,p,w){var a=h("./gen.js"),l={name:"lte",gen:function(){var b=a.getInputs(this);var c="  var "+this.name+"=";c=isNaN(this.inputs[0])||isNaN(this.inputs[1])?c+("( "+
b[0]+" <= "+b[1]+" | 0  )"):c+(b[0]<=b[1]?1:0);a.memo[this.name]=this.name;return[this.name,c+"\\n"]}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];g.name="lte"+a.getUID();return g}},{"./gen.js":32}],42:[function(h,p,w){var a=h("./gen.js"),l={name:"ltp",gen:function(){var b=a.getInputs(this);return isNaN(this.inputs[0])||isNaN(this.inputs[1])?"("+b[0]+" * (( "+b[0]+" < "+b[1]+" ) | 0 ) )":b[0]*(b[0]<b[1]|0)}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];return g}},
{"./gen.js":32}],43:[function(h,p,w){var a=h("./gen.js"),l={name:"max",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])||isNaN(b[1])){var f={};a.closures.add((f[this.name]=c?"Math.max":Math.max,f));b=g+"max( "+b[0]+","+b[1]+" )"}else b=Math.max(parseFloat(b[0]),parseFloat(b[1]));return b}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];return g}},{"./gen.js":32}],44:[function(h,p,w){var a=h("./gen.js"),l={basename:"memo",gen:function(){var b=
a.getInputs(this);b="  var "+this.name+"="+b[0]+"\\n";a.memo[this.name]=this.name;return[this.name,b]}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b];g.id=a.getUID();g.name=void 0!==c?c+"_"+a.getUID():""+g.basename+g.id;return g}},{"./gen.js":32}],45:[function(h,p,w){var a=h("./gen.js"),l={name:"min",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])||isNaN(b[1])){var f={};a.closures.add((f[this.name]=c?"Math.min":Math.min,f));b=g+"min( "+b[0]+
","+b[1]+" )"}else b=Math.min(parseFloat(b[0]),parseFloat(b[1]));return b}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];return g}},{"./gen.js":32}],46:[function(h,p,w){var a=h("./gen.js"),l=h("./add.js"),b=h("./mul.js"),c=h("./sub.js"),g=h("./memo.js");p.exports=function(f,d,e){e=void 0===e?.5:e;f=g(l(b(f,c(1,e)),b(d,e)));f.name="mix"+a.getUID();return f}},{"./add.js":5,"./gen.js":32,"./memo.js":44,"./mul.js":50,"./sub.js":70}],47:[function(h,p,w){var a=h("./gen.js");p.exports=
function(l){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];return{id:a.getUID(),inputs:b,gen:function(){var g=a.getInputs(this),f="(",d=g[0],e=isNaN(d);g.forEach(function(k,m){if(0!==m){var n=isNaN(k);m=m===g.length-1;e||n?f+=d+" % "+k:(d%=k,f+=d);m||(f+=" % ")}});return f+=")"}}}},{"./gen.js":32}],48:[function(h,p,w){var a=h("./gen.js"),l={basename:"mstosamps",gen:function(){var b=a.getInputs(this);isNaN(b[0])?(b="  var "+this.name+"="+a.samplerate+" / 1000 * "+b[0]+" \\n\\n",a.memo[this.name]=
b,b=[this.name,b]):b=a.samplerate/1E3*this.inputs[0];return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.name=l.basename+a.getUID();return c}},{"./gen.js":32}],49:[function(h,p,w){var a=h("./gen.js"),l={name:"mtof",gen:function(){var b=a.getInputs(this);if(isNaN(b[0])){var c={};a.closures.add((c[this.name]=Math.exp,c));b="( "+this.tuning+" * gen.exp( .057762265 * ("+b[0]+" - 69) ) )"}else b=this.tuning*Math.exp(.057762265*(b[0]-69));return b}};p.exports=function(b,c){var g=Object.create(l);
void 0!==c&&Object.assign(c.defaults);Object.assign(g,{tuning:440});g.inputs=[b];return g}},{"./gen.js":32}],50:[function(h,p,w){var a=h("./gen.js"),l={basename:"mul",gen:function(){var b=a.getInputs(this),c="  var "+this.name+"=",g=1,f=0,d=!1,e=!0;b.forEach(function(k,m){isNaN(k)?(c+=k,m<b.length-1&&(d=!0,c+=" * "),e=!1):(g=0===m?k:g*parseFloat(k),f++)});0<f&&(c+=d||e?g:" * "+g);c+="\\n";a.memo[this.name]=this.name;return[this.name,c]}};p.exports=function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-
0]=arguments[g];g=Object.create(l);Object.assign(g,{id:a.getUID(),inputs:c});g.name=g.basename+g.id;return g}},{"./gen.js":32}],51:[function(h,p,w){var a=h("./gen.js"),l={basename:"neq",gen:function(){var b=a.getInputs(this);b="  var "+this.name+"=("+b[0]+" !== "+b[1]+") | 0\\n\\n";a.memo[this.name]=this.name;return[this.name,b]}};p.exports=function(b,c){var g=Object.create(l);Object.assign(g,{uid:a.getUID(),inputs:[b,c]});g.name=""+g.basename+g.uid;return g}},{"./gen.js":32}],52:[function(h,p,w){var a=
h("./gen.js"),l={name:"noise",gen:function(){var b,c=(b="worklet"===a.mode)?"":"gen.";a.closures.add({noise:b?"Math.random":Math.random});b="  var "+this.name+"="+c+"noise()\\n";a.memo[this.name]=this.name;return[this.name,b]}};p.exports=function(b){b=Object.create(l);b.name=l.name+a.getUID();return b}},{"./gen.js":32}],53:[function(h,p,w){var a=h("./gen.js"),l={name:"not",gen:function(){var b=a.getInputs(this);return isNaN(this.inputs[0])?"( "+b[0]+" === 0 ? 1 : 0 )":0}};p.exports=function(b){var c=
Object.create(l);c.inputs=[b];return c}},{"./gen.js":32}],54:[function(h,p,w){var a=h("./gen.js"),l=h("./data.js"),b=h("./peek.js"),c=h("./mul.js"),g={basename:"pan",initTable:function(){for(var f=new Float32Array(1024),d=new Float32Array(1024),e=Math.PI/180,k=0;1024>k;k++){var m=.087890625*k;f[k]=Math.cos(m*e);d[k]=Math.sin(m*e)}a.globals.panL=l(f,1,{immutable:!0});a.globals.panR=l(d,1,{immutable:!0})}};p.exports=function(f,d,e,k){e=void 0===e?.5:e;void 0===a.globals.panL&&g.initTable();k=Object.create(g);
Object.assign(k,{uid:a.getUID(),inputs:[f,d],left:c(f,b(a.globals.panL,e,{boundmode:"clamp"})),right:c(d,b(a.globals.panR,e,{boundmode:"clamp"}))});k.name=""+k.basename+k.uid;return k}},{"./data.js":18,"./gen.js":32,"./mul.js":50,"./peek.js":56}],55:[function(h,p,w){var a=h("./gen.js"),l={basename:"param",gen:function(){a.requestMemory(this.memory);a.params.add(this);var b="worklet"===a.mode;b&&a.parameters.add(this.name);this.value=this.initialValue;a.memo[this.name]=b?this.name:"memory["+this.memory.value.idx+
"]";return a.memo[this.name]}};p.exports=function(b,c,g,f){b=void 0===b?0:b;c=void 0===c?0:c;g=void 0===g?0:g;f=void 0===f?1:f;var d=Object.create(l);"string"!==typeof b?(d.name=d.basename+a.getUID(),d.initialValue=b):(d.name=b,d.initialValue=c);d.min=g;d.max=f;d.defaultValue=d.initialValue;d.waapi=null;d.isWorklet="worklet"===a.mode;Object.defineProperty(d,"value",{get:function(){return null!==this.memory.value.idx?a.memory.heap[this.memory.value.idx]:this.initialValue},set:function(e){null!==this.memory.value.idx&&
(this.isWorklet&&null!==this.waapi?this.waapi.value=e:a.memory.heap[this.memory.value.idx]=e)}});d.memory={value:{length:1,idx:null}};return d}},{"./gen.js":32}],56:[function(h,p,w){var a=h("./gen.js");h("./data.js");var l={basename:"peek",gen:function(){var b=a.getInputs(this);var c=b[1];var g=(Math.log2(this.data.buffer.length)|0)===Math.log2(this.data.buffer.length);if("simple"!==this.mode)b="  var "+this.name+"_dataIdx ="+c+",\\n"+this.name+"_phase="+("samples"===this.mode?b[0]:b[0]+" * "+
this.data.buffer.length)+", \\n"+this.name+"_index="+this.name+"_phase | 0,\\n",g="wrap"===this.boundmode?g?"( "+this.name+"_index + 1 ) & ("+this.data.buffer.length+" - 1)":this.name+"_index + 1 >= "+this.data.buffer.length+" ? "+this.name+"_index + 1 - "+this.data.buffer.length+" : "+this.name+"_index + 1":"clamp"===this.boundmode?this.name+"_index + 1 >= "+(this.data.buffer.length-1)+" ? "+(this.data.buffer.length-1)+" : "+this.name+"_index + 1":"fold"===this.boundmode||"mirror"===this.boundmode?
this.name+"_index + 1 >= "+(this.data.buffer.length-1)+" ? "+this.name+"_index - "+(this.data.buffer.length-1)+" : "+this.name+"_index + 1":this.name+"_index + 1","linear"===this.interp?(b+=" "+this.name+"_frac ="+this.name+"_phase - "+this.name+"_index,\\n"+this.name+"_base =memory[ "+this.name+"_dataIdx +  "+this.name+"_index ],\\n"+this.name+"_next ="+g+",",b="ignore"===this.boundmode?b+("\\n"+this.name+"_out  ="+this.name+"_index >= "+(this.data.buffer.length-1)+" || "+this.name+"_index < 0 ? 0 : "+
this.name+"_base + "+this.name+"_frac * ( memory[ "+this.name+"_dataIdx + "+this.name+"_next ] - "+this.name+"_base )\\n\\n"):b+("\\n"+this.name+"_out  ="+this.name+"_base + "+this.name+"_frac * ( memory[ "+this.name+"_dataIdx + "+this.name+"_next ] - "+this.name+"_base )\\n\\n")):b+=" "+this.name+"_out=memory[ "+this.name+"_dataIdx + "+this.name+"_index ]\\n\\n";else return b="memory[ "+c+" + "+b[0]+" ]";a.memo[this.name]=this.name+"_out";return[this.name+"_out",b]},defaults:{channels:1,mode:"phase",
interp:"linear",boundmode:"wrap"}};p.exports=function(b,c,g){c=void 0===c?0:c;var f=Object.create(l);b="undefined"===typeof b.basename?a.lib.data(b):b;Object.assign(f,{data:b,dataName:b.name,uid:a.getUID(),inputs:[c,b]},l.defaults,g);f.name=f.basename+f.uid;return f}},{"./data.js":18,"./gen.js":32}],57:[function(h,p,w){var a=h("./gen.js");h("./data.js");var l={basename:"peek",gen:function(){var b=a.getInputs(this);var c=b[0];var g=b[1];b=b[2];if("simple"!==this.mode)c="  var "+this.name+"_dataIdx ="+
c+",\\n"+this.name+"_phase="+("samples"===this.mode?b:b+" * "+g)+",\\n"+this.name+"_index="+this.name+"_phase | 0,\\n",b="wrap"===this.boundmode?this.name+"_index + 1 >= "+g+" ? "+this.name+"_index + 1 - "+g+" : "+this.name+"_index + 1":"clamp"===this.boundmode?this.name+"_index + 1 >= "+g+" -1 ? "+g+" - 1 : "+this.name+"_index + 1":"fold"===this.boundmode||"mirror"===this.boundmode?this.name+"_index + 1 >= "+g+" - 1 ? "+this.name+"_index - "+g+" - 1 : "+this.name+"_index + 1":this.name+"_index + 1",
"linear"===this.interp?(c+=" "+this.name+"_frac ="+this.name+"_phase - "+this.name+"_index,\\n"+this.name+"_base =memory[ "+this.name+"_dataIdx +  "+this.name+"_index ],\\n"+this.name+"_next ="+b+",",c="ignore"===this.boundmode?c+("\\n"+this.name+"_out  ="+this.name+"_index >= "+g+" - 1 || "+this.name+"_index < 0 ? 0 : "+this.name+"_base + "+this.name+"_frac * ( memory[ "+this.name+"_dataIdx + "+this.name+"_next ] - "+this.name+"_base )\\n\\n"):c+("\\n"+this.name+"_out  ="+this.name+"_base + "+
this.name+"_frac * ( memory[ "+this.name+"_dataIdx + "+this.name+"_next ] - "+this.name+"_base )\\n\\n")):c+=" "+this.name+"_out=memory[ "+this.name+"_dataIdx + "+this.name+"_index ]\\n\\n";else return"memory[ "+c+" + "+b+" ]";a.memo[this.name]=this.name+"_out";return[this.name+"_out",c]},defaults:{channels:1,mode:"phase",interp:"linear",boundmode:"wrap"}};p.exports=function(b,c,g,f){g=void 0===g?0:g;var d=Object.create(l),e="undefined"===typeof b.basename?a.lib.data(b):b;Object.assign(d,{data:e,
dataName:e.name,uid:a.getUID(),inputs:[b,c,g,e]},l.defaults,f);d.name=d.basename+d.uid;return d}},{"./data.js":18,"./gen.js":32}],58:[function(h,p,w){var a=h("./gen.js"),l=h("./accum.js"),b=h("./mul.js"),c=h("./div.js"),g={min:-1,max:1};p.exports=function(f,d,e){f=void 0===f?1:f;d=void 0===d?0:d;e=Object.assign({},g,e);var k=e.max-e.min;f="number"===typeof f?l(f*k/a.samplerate,d,e):l(c(b(f,k),a.samplerate),d,e);f.name="phasor"+a.getUID();return f}},{"./accum.js":2,"./div.js":23,"./gen.js":32,"./mul.js":50}],
59:[function(h,p,w){var a=h("./gen.js");h("./mul.js");h("./wrap.js");var l={basename:"poke",gen:function(){var b=a.getInputs(this);var c=this.data.gen();b=0===this.inputs[1]?"  memory[ "+c+" ]="+b[0]+"\\n":"  memory[ "+c+" + "+b[1]+" ]="+b[0]+"\\n";if(void 0===this.inline)a.functionBody+=b;else return[this.inline,b]}};p.exports=function(b,c,g,f){var d=Object.create(l),e={channels:1};void 0!==f&&Object.assign(e,f);Object.assign(d,{data:b,dataName:b.name,dataLength:b.buffer.length,uid:a.getUID(),
inputs:[c,g]},e);d.name=d.basename+d.uid;a.histories.set(d.name,d);return d}},{"./gen.js":32,"./mul.js":50,"./wrap.js":78}],60:[function(h,p,w){var a=h("./gen.js"),l={basename:"pow",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])||isNaN(b[1])?(a.closures.add({pow:c?"Math.pow":Math.pow}),b=g+"pow( "+b[0]+","+b[1]+" )"):("string"===typeof b[0]&&"("===b[0][0]&&(b[0]=b[0].slice(1,-1)),"string"===typeof b[1]&&"("===b[1][0]&&(b[1]=b[1].slice(1,-1)),b=Math.pow(parseFloat(b[0]),
parseFloat(b[1])));return b}};p.exports=function(b,c){var g=Object.create(l);g.inputs=[b,c];g.id=a.getUID();g.name=g.basename+"{pow.id}";return g}},{"./gen.js":32}],61:[function(h,p,w){var a=h("./gen.js"),l={basename:"process",gen:function(){var b=a.getInputs(this),c={};a.closures.add((c[""+this.funcname]=this.func,c));var g="  var "+this.name+"=gen['"+this.funcname+"'](";b.forEach(function(f,d,e){g+=e[d];d<e.length-1&&(g+=",")});g+=")\\n";a.memo[this.name]=this.name;return[this.name,g]}};p.exports=
function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-0]=arguments[g];var f={},d=a.getUID();f.name="process"+d;f.func=new (Function.prototype.bind.apply(Function,[null].concat($jscomp.arrayFromIterable(c))));f.call=function(e){for(var k=[],m=0;m<arguments.length;++m)k[m-0]=arguments[m];m=Object.create(l);m.funcname=f.name;m.func=f.func;m.name="process_out_"+d;m.process=f;m.inputs=k;return m};return f}},{"./gen.js":32}],62:[function(h,p,w){var a=h("./gen.js"),l=h("./history.js");h("./sub.js");h("./add.js");
h("./mul.js");h("./memo.js");h("./delta.js");h("./wrap.js");var b={basename:"rate",gen:function(){var c=a.getInputs(this);l();l();var g="gen."+this.name,f={};a.closures.add((f[this.name]=this,f));return[g+".phase","  var "+(this.name+"_diff="+c[0]+" - "+g+".lastSample\\nif( "+this.name+"_diff < -.5 ) "+this.name+"_diff += 1\\n"+g+".phase += "+this.name+"_diff * "+c[1]+"\\nif( "+g+".phase > 1 ) "+g+".phase -= 1\\n"+g+".lastSample="+c[0]+"\\n")]}};p.exports=function(c,g){var f=Object.create(b);Object.assign(f,
{phase:0,lastSample:0,uid:a.getUID(),inputs:[c,g]});f.name=""+f.basename+f.uid;return f}},{"./add.js":5,"./delta.js":22,"./gen.js":32,"./history.js":36,"./memo.js":44,"./mul.js":50,"./sub.js":70,"./wrap.js":78}],63:[function(h,p,w){var a=h("./gen.js"),l={name:"round",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])){var f={};a.closures.add((f[this.name]=c?"Math.round":Math.round,f));b=g+"round( "+b[0]+" )"}else b=Math.round(parseFloat(b[0]));return b}};
p.exports=function(b){var c=Object.create(l);c.inputs=[b];return c}},{"./gen.js":32}],64:[function(h,p,w){var a=h("./gen.js"),l={basename:"sah",gen:function(){var b=a.getInputs(this);a.requestMemory(this.memory);b=" var "+this.name+"_control=memory["+this.memory.control.idx+"],\\n"+this.name+"_trigger="+b[1]+" > "+b[2]+" ? 1 : 0\\n\\nif( "+this.name+"_trigger !== "+this.name+"_control  ) {\\nif( "+this.name+"_trigger === 1 ) \\nmemory["+this.memory.value.idx+"]="+b[0]+"\\n\\nmemory["+this.memory.control.idx+
"]="+this.name+"_trigger\\n}\\n";a.memo[this.name]="memory["+this.memory.value.idx+"]";return["memory["+this.memory.value.idx+"]"," "+b]}};p.exports=function(b,c,g,f){g=void 0===g?0:g;var d=Object.create(l),e={init:0};void 0!==f&&Object.assign(e,f);Object.assign(d,{lastSample:0,uid:a.getUID(),inputs:[b,c,g],memory:{control:{idx:null,length:1},value:{idx:null,length:1}}},e);d.name=""+d.basename+d.uid;return d}},{"./gen.js":32}],65:[function(h,p,w){var a=h("./gen.js"),l={basename:"selector",gen:function(){var b=
a.getInputs(this);switch(b.length){case 2:b=b[1];break;case 3:var c="  var "+this.name+"_out="+b[0]+" === 1 ? "+b[1]+" : "+b[2]+"\\n\\n";b=[this.name+"_out",c];break;default:c=" var "+this.name+"_out=0\\nswitch( "+b[0]+" + 1 ) {\\n";for(var g=1;g<b.length;g++)c+=" case "+g+": "+this.name+"_out="+b[g]+"; break;\\n";b=[this.name+"_out"," "+(c+"  }\\n\\n")]}a.memo[this.name]=this.name+"_out";return b}};p.exports=function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-0]=arguments[g];g=Object.create(l);
Object.assign(g,{uid:a.getUID(),inputs:c});g.name=""+g.basename+g.uid;return g}},{"./gen.js":32}],66:[function(h,p,w){var a=h("./gen.js"),l=h("./accum.js"),b=h("./counter.js"),c=h("./peek.js"),g=h("./history.js"),f=h("./data.js");p.exports=function(d,e,k){d=void 0===d?11025:d;e=void 0===e?[0,1]:e;k=void 0===k?1:k;if(Array.isArray(d)){var m=b(0,0,d.length);d=c(f(d),m,{mode:"simple"});k=b(k,0,d);d=g();d.in(k.wrap);m.inputs[0]=d.out}else k=b(k,0,d);m=l(k.wrap,0,{min:0,max:e.length});e=c(f(e),m,{mode:"simple"});
e.name="seq"+a.getUID();e.trigger=k.wrap;return e}},{"./accum.js":2,"./counter.js":16,"./data.js":18,"./gen.js":32,"./history.js":36,"./peek.js":56}],67:[function(h,p,w){var a=h("./gen.js"),l={name:"sign",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])){var f={};a.closures.add((f[this.name]=c?"Math.sign":Math.sign,f));b=g+"sign( "+b[0]+" )"}else b=Math.sign(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];return c}},
{"./gen.js":32}],68:[function(h,p,w){var a=h("./gen.js"),l={basename:"sin",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({sin:c?"Math.sin":Math.sin}),b=g+"sin( "+b[0]+" )"):b=Math.sin(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.id=a.getUID();c.name=c.basename+"{sin.id}";return c}},{"./gen.js":32}],69:[function(h,p,w){h("./gen.js");var a=h("./history.js"),l=h("./sub.js"),b=h("./add.js");h("./mul.js");
var c=h("./memo.js"),g=h("./gt.js"),f=h("./div.js"),d=h("./switch.js");p.exports=function(e,k,m){k=void 0===k?1:k;m=void 0===m?1:m;var n=a(0);k=d(g(e,n.out),k,m);e=c(b(n.out,f(l(e,n.out),k)));n.in(e);return e}},{"./add.js":5,"./div.js":23,"./gen.js":32,"./gt.js":33,"./history.js":36,"./memo.js":44,"./mul.js":50,"./sub.js":70,"./switch.js":71}],70:[function(h,p,w){var a=h("./gen.js"),l={basename:"sub",gen:function(){var b=a.getInputs(this),c=0,g=b[0],f=isNaN(g),d=0;this.inputs.forEach(function(e){isNaN(e)});
c="  var "+this.name+"=";b.forEach(function(e,k){if(0!==k){var m=isNaN(e);k=k===b.length-1;f||m?(c+=g+" - "+e,k||(c+=" - ")):(g-=e,c+=g)}});c+="\\n";d=[this.name,c];a.memo[this.name]=this.name;return d}};p.exports=function(b){for(var c=[],g=0;g<arguments.length;++g)c[g-0]=arguments[g];g=Object.create(l);Object.assign(g,{id:a.getUID(),inputs:c});g.name="sub"+g.id;return g}},{"./gen.js":32}],71:[function(h,p,w){var a=h("./gen.js"),l={basename:"switch",gen:function(){var b=a.getInputs(this);if(b[1]===
b[2])return b[1];b="  var "+this.name+"_out="+b[0]+" === 1 ? "+b[1]+" : "+b[2]+"\\n";a.memo[this.name]=this.name+"_out";return[this.name+"_out",b]}};p.exports=function(b,c,g){c=void 0===c?1:c;g=void 0===g?0:g;var f=Object.create(l);Object.assign(f,{uid:a.getUID(),inputs:[b,c,g]});f.name=""+f.basename+f.uid;return f}},{"./gen.js":32}],72:[function(h,p,w){var a=h("./gen.js"),l={basename:"t60",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";if(isNaN(b[0])){var f={};a.closures.add((f.exp=
c?"Math.exp":Math.exp,f));b="  var "+this.name+"="+g+"exp( -6.907755278921 / "+b[0]+" )\\n\\n";a.memo[this.name]=b;b=[this.name,b]}else b=Math.exp(-6.907755278921/b[0]);return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.name=l.basename+a.getUID();return c}},{"./gen.js":32}],73:[function(h,p,w){var a=h("./gen.js"),l={basename:"tan",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({tan:c?"Math.tan":Math.tan}),b=g+"tan( "+b[0]+
" )"):b=Math.tan(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.id=a.getUID();c.name=c.basename+"{tan.id}";return c}},{"./gen.js":32}],74:[function(h,p,w){var a=h("./gen.js"),l={basename:"tanh",gen:function(){var b=a.getInputs(this);var c="worklet"===a.mode,g=c?"":"gen.";isNaN(b[0])?(a.closures.add({tanh:c?"Math.tan":Math.tanh}),b=g+"tanh( "+b[0]+" )"):b=Math.tanh(parseFloat(b[0]));return b}};p.exports=function(b){var c=Object.create(l);c.inputs=[b];c.id=
a.getUID();c.name=c.basename+"{tanh.id}";return c}},{"./gen.js":32}],75:[function(h,p,w){var a=h("./gen.js"),l=h("./lt.js"),b=h("./accum.js"),c=h("./div.js");p.exports=function(g,f){f=void 0===f?.5:f;g=l(b(c(void 0===g?440:g,44100)),f);g.name="train"+a.getUID();return g}},{"./accum.js":2,"./div.js":23,"./gen.js":32,"./lt.js":40}],76:[function(h,p,w){var a=h("./external/audioworklet-polyfill.js"),l=h("./gen.js");h("./data.js");var b={ctx:null,buffers:{},isStereo:!1,clear:function(){void 0!==this.workletNode?
this.workletNode.disconnect():this.callback=function(){return 0};this.clear.callbacks.forEach(function(c){return c()});this.clear.callbacks.length=0;this.isStereo=!1;null!==l.graph&&l.free(l.graph)},createContext:function(c){var g=this,f="undefined"===typeof AudioContext?webkitAudioContext:AudioContext;a(window,void 0===c?2048:c);var d=function(){if("undefined"!==typeof f){g.ctx=new f(Gibberish.audioContextOptions);l.samplerate=g.ctx.sampleRate;document&&document.documentElement&&"ontouchstart"in document.documentElement?
window.removeEventListener("touchstart",d):(window.removeEventListener("mousedown",d),window.removeEventListener("keydown",d));var e=b.ctx.createBufferSource();e.connect(b.ctx.destination);e.start()}};document&&document.documentElement&&"ontouchstart"in document.documentElement?window.addEventListener("touchstart",d):(window.addEventListener("mousedown",d),window.addEventListener("keydown",d));return this},createScriptProcessor:function(){this.node=this.ctx.createScriptProcessor(1024,0,2);this.clearFunction=
function(){return 0};"undefined"===typeof this.callback&&(this.callback=this.clearFunction);this.node.onaudioprocess=function(c){var g=c.outputBuffer;c=g.getChannelData(0);g=g.getChannelData(1);for(var f=b.isStereo,d=0;d<c.length;d++){var e=b.callback();!1===f?c[d]=g[d]=e:(c[d]=e[0],g[d]=e[1])}};this.node.connect(this.ctx.destination);return this},prettyPrintCallback:function(c){return c.toString().split("\\n").slice(3,-2).map(function(g){return" "+g}).join("\\n")},createParameterDescriptors:function(c){var g=
"";c=$jscomp.makeIterator(c.params.values());for(var f=c.next();!f.done;f=c.next())f=f.value,g+="{ name:'"+f.name+"',automationRate:'k-rate',defaultValue:"+f.defaultValue+",minValue:"+f.min+",maxValue:"+f.max+"},\\n";return g},createParameterDereferences:function(c){var g=0<c.params.size?"\\n":"";c=$jscomp.makeIterator(c.params.values());for(var f=c.next();!f.done;f=c.next())f=f.value,g+="const "+f.name+"=parameters."+f.name+"[0]\\n";return g},createParameterArguments:function(c){var g=
"";c=$jscomp.makeIterator(c.params.values());for(var f=c.next();!f.done;f=c.next())g+=f.value.name+"[i],";return g=g.slice(0,-1)},createInputDereferences:function(c){var g=0<c.inputs.size?"\\n":"";c=$jscomp.makeIterator(c.inputs.values());for(var f=c.next();!f.done;f=c.next())f=f.value,g+="const "+f.name+"=inputs[ "+f.inputNumber+" ][ "+f.channelNumber+" ]\\n";return g},createInputArguments:function(c){var g="";c=$jscomp.makeIterator(c.inputs.values());for(var f=c.next();!f.done;f=c.next())g+=
f.value.name+"[i],";return g=g.slice(0,-1)},createFunctionDereferences:function(c){var g=0<c.members.size?"\\n":"",f={};c=$jscomp.makeIterator(c.members.values());for(var d=c.next();!d.done;d=c.next()){var e=d.value;d=Object.keys(e)[0];e=e[d];void 0===f[d]&&(f[d]=!0,g+="const "+d+"="+e+"\\n")}return g},createWorkletProcessor:function(c,g,f,d){c=l.createCallback(c,void 0===d?441E3:d,f);d=c.inputs;var e=this.createParameterDescriptors(c),k=this.createParameterDereferences(c);this.createParameterArguments(c);
var m=this.createInputDereferences(c);this.createInputArguments(c);var n=this.createFunctionDereferences(c),q=!1===c.isStereo?"left[ i ]=memory[0]":"left[ i ]=memory[0];\\n\\t\\tright[i]=memory[1]\\n",t=this.prettyPrintCallback(c);g="\\nclass "+g+"Processor extends AudioWorkletProcessor {\\n\\nstatic get parameterDescriptors() {\\nconst params = [\\n"+e+"\\n]\\nreturn params\\n}\\n\\nconstructor( options ) {\\nsuper( options )\\nthis.port.onmessage = this.handleMessage.bind( this )\\nthis.initialized = false\\n}\\n\\nhandleMessage( event ) {\\nif( event.data.key === 'init' ) {\\nthis.memory = event.data.memory\\nthis.initialized = true\\n}else if( event.data.key === 'set' ) {\\nthis.memory[ event.data.idx ] = event.data.value\\n}else if( event.data.key === 'get' ) {\\nthis.port.postMessage({ key:'return',idx:event.data.idx,value:this.memory[event.data.idx] })\\n}\\n}\\n\\nprocess( inputs,outputs,parameters ) {\\nif( this.initialized === true ) {\\nconst output = outputs[0]\\nconst left=output[ 0 ]\\nconst right  = output[ 1 ]\\nconst len= left.length\\nconst memory = this.memory "+
k+m+n+"\\n\\nfor( let i = 0; i < len; ++i ) {\\n"+t+"\\n"+q+"\\n}\\n}\\nreturn true\\n}\\n}\\n\\nregisterProcessor( '"+g+"',"+g+"Processor)";!0===f&&console.log(g);return[window.URL.createObjectURL(new Blob([g],{type:"text/javascript"})),g,d,c.params,c.isStereo]},registeredForNodeAssignment:[],register:function(c){-1===this.registeredForNodeAssignment.indexOf(c)&&this.registeredForNodeAssignment.push(c)},playWorklet:function(c,g,f,d){f=void 0===f?!1:f;d=void 0===d?2646E3:d;b.clear();c=$jscomp.makeIterator(b.createWorkletProcessor(c,
g,f,d));var e=c.next().value,k=c.next().value,m=c.next().value,n=c.next().value,q=c.next().value;return new Promise(function(t,y){b.ctx.audioWorklet.addModule(e).then(function(){var v=new AudioWorkletNode(b.ctx,g,{outputChannelCount:[q?2:1]});v.callbacks={};v.onmessage=function(A){"return"===A.data.message&&(v.callbacks[A.data.idx](A.data.value),delete v.callbacks[A.data.idx])};v.getMemoryValue=function(A,B){this.workletCallbacks[A]=B;this.workletNode.port.postMessage({key:"get",idx:A})};v.port.postMessage({key:"init",
memory:l.memory.heap});b.workletNode=v;b.registeredForNodeAssignment.forEach(function(A){return A.node=v});b.registeredForNodeAssignment.length=0;for(var r={},u=$jscomp.makeIterator(m.values()),x=u.next();!x.done;r={$jscomp$loop$prop$param$87:r.$jscomp$loop$prop$param$87},x=u.next())x=Object.keys(x.value)[0],r.$jscomp$loop$prop$param$87=v.parameters.get(x),Object.defineProperty(v,x,{set:function(A){return function(B){A.$jscomp$loop$prop$param$87.value=B}}(r),get:function(A){return function(){return A.$jscomp$loop$prop$param$87.value}}(r)});
r={};u=$jscomp.makeIterator(n.values());for(x=u.next();!x.done;r={$jscomp$loop$prop$param$54$90:r.$jscomp$loop$prop$param$54$90},x=u.next()){x=x.value;var z=x.name;r.$jscomp$loop$prop$param$54$90=v.parameters.get(z);x.waapi=r.$jscomp$loop$prop$param$54$90;r.$jscomp$loop$prop$param$54$90.value=x.defaultValue;Object.defineProperty(v,z,{set:function(A){return function(B){A.$jscomp$loop$prop$param$54$90.value=B}}(r),get:function(A){return function(){return A.$jscomp$loop$prop$param$54$90.value}}(r)})}b.console&&
b.console.setValue(k);v.connect(b.ctx.destination);t(v)})})},playGraph:function(c,g,f,d){f=void 0===f?441E3:f;d=void 0===d?Float32Array:d;b.clear();void 0===g&&(g=!1);this.isStereo=Array.isArray(c);b.callback=l.createCallback(c,f,g,!1,d);b.console&&b.console.setValue(b.callback.toString());return b.callback},loadSample:function(c,g){var f=void 0!==b.buffers[c],d=new XMLHttpRequest;d.open("GET",c,!0);d.responseType="arraybuffer";var e=new Promise(function(k,m){f?setTimeout(function(){return k(b.buffers[c])},
0):d.onload=function(){b.ctx.decodeAudioData(d.response,function(n){g.buffer=n.getChannelData(0);b.buffers[c]=g.buffer;k(g.buffer)})}});f||d.send();return e}};b.clear.callbacks=[];p.exports=b},{"./data.js":18,"./external/audioworklet-polyfill.js":27,"./gen.js":32}],77:[function(h,p,w){var a=p.exports={bartlett:function(l,b){return 2/(l-1)*((l-1)/2-Math.abs(b-(l-1)/2))},bartlettHann:function(l,b){return.62-.48*Math.abs(b/(l-1)-.5)-.38*Math.cos(2*Math.PI*b/(l-1))},blackman:function(l,b,c){return(1-
c)/2-.5*Math.cos(2*Math.PI*b/(l-1))+c/2*Math.cos(4*Math.PI*b/(l-1))},cosine:function(l,b){return Math.cos(Math.PI*b/(l-1)-Math.PI/2)},gauss:function(l,b,c){return Math.pow(Math.E,-.5*Math.pow((b-(l-1)/2)/(c*(l-1)/2),2))},hamming:function(l,b){return.54-.46*Math.cos(2*Math.PI*b/(l-1))},hann:function(l,b){return.5*(1-Math.cos(2*Math.PI*b/(l-1)))},lanczos:function(l,b){l=2*b/(l-1)-1;return Math.sin(Math.PI*l)/(Math.PI*l)},rectangular:function(l,b){return 1},triangular:function(l,b){return 2/l*(l/2-Math.abs(b-
(l-1)/2))},welch:function(l,b,c,g){g=void 0===g?0:g;c=(l-1)/2;return 1-Math.pow(((0===g?b:(b+Math.floor(g*l))%l)-c)/c,2)},inversewelch:function(l,b,c,g){g=void 0===g?0:g;c=(l-1)/2;return Math.pow(((0===g?b:(b+Math.floor(g*l))%l)-c)/c,2)},parabola:function(l,b){return b<=l/2?a.inversewelch(l/2,b)-1:1-a.inversewelch(l/2,b-l/2)},exponential:function(l,b,c){return Math.pow(b/l,c)},linear:function(l,b){return b/l}}},{}],78:[function(h,p,w){var a=h("./gen.js");h("./floor.js");h("./sub.js");h("./memo.js");
var l={basename:"wrap",gen:function(){var b=a.getInputs(this),c=b[1],g=b[2];c=0===this.min?g:isNaN(g)||isNaN(c)?g+" - "+c:g-c;return[this.name,"  var "+(this.name+" = "+b[0]+"\\nif( "+this.name+" < "+this.min+" ) "+this.name+" += "+c+"\\nelse if( "+this.name+" > "+this.max+" ) "+this.name+" -= "+c+"\\n")]}};p.exports=function(b,c,g){c=void 0===c?0:c;g=void 0===g?1:g;var f=Object.create(l);Object.assign(f,{min:c,max:g,uid:a.getUID(),inputs:[b,c,g]});f.name=""+f.basename+f.uid;return f}},{"./floor.js":29,
"./gen.js":32,"./memo.js":44,"./sub.js":70}],79:[function(h,p,w){p.exports={create:function(){var a=0>=arguments.length||void 0===arguments[0]?4096:arguments[0],l=1>=arguments.length||void 0===arguments[1]?Float32Array:arguments[1],b=Object.create(this);Object.assign(b,{heap:new l(a),list:{},freeList:{}});return b},alloc:function(a){var l=-1;if(a>this.heap.length)throw Error("Allocation request is larger than heap size of "+this.heap.length);for(var b in this.freeList){var c=this.freeList[b];if(c>=
a){l=b;this.list[l]=a;if(c!==a){b=l+a;for(var g in this.list)g>b&&(c=g-b,this.freeList[b]=c)}break}}-1!==l&&delete this.freeList[l];-1===l&&(l=Object.keys(this.list),l.length?(l=parseInt(l[l.length-1]),l+=this.list[l]):l=0,this.list[l]=a);if(l+a>=this.heap.length)throw Error("No available blocks remain sufficient for allocation request.");return l},free:function(a){if("number"!==typeof this.list[a])console.warn("calling free() on non-existing block:",a,this.list);else{var l=this.list[a]=0,b;for(b in this.list)if(b>
a){l=b-a;break}this.freeList[a]=l}}}},{}],80:[function(h,p,w){h=h("../ugen.js");h=Object.create(h);Object.assign(h,{__type__:"analyzer",priority:0});p.exports=h},{"../ugen.js":149}],81:[function(h,p,w){p.exports=function(a){var l=h("./singlesampledelay.js")(a),b={SSD:l.SSD,SSD_In:l.In,SSD_Out:l.Out,Follow:h("./follow.dsp.js")(a)};b.Follow_out=b.Follow.out;b.Follow_in=b.Follow.in;b.export=function(c){for(var g in b)"export"!==g&&(c[g]=b[g])};return b}},{"./follow.dsp.js":82,"./singlesampledelay.js":83}],
82:[function(h,p,w){var a=h("genish.js"),l=h("./analyzer.js"),b=h("../ugen.js");p.exports=function(c){var g=function(f){var d=Object.assign({},g.defaults,f),e="undefined"!==typeof d.input.isStereo?d.input.isStereo:!1;if("worklet"===c.mode){d.input={id:d.input.id};d.isStereo=e;c.utilities.getUID();d.overrideid=c.utilities.getUID();d.id=d.overrideid;c.worklet.port.postMessage({address:"add",properties:JSON.stringify(d),name:["analysis","Follow"]});c.worklet.ugens.set(d.overrideid,d);var k=d.multiplier;
Object.defineProperty(d,"multiplier",{get:function(){return k},set:function(B){k=B;c.worklet.port.postMessage({address:"set",object:d.overrideid,name:"multiplier",value:k})}});var m=d.offset;Object.defineProperty(d,"offset",{get:function(){return m},set:function(B){m=B;c.worklet.port.postMessage({address:"set",object:d.overrideid,name:"offset",value:m})}})}else{var n=a.data(d.bufferSize,1),q=a.in("input"),t=a.in("multiplier"),y=a.in("offset"),v=Object.create(l);v.id=d.id=f.overrideid;var r=a.data(1,
1,{meta:!0});c.utilities.getUID();var u=Object.create(b);if(!0===e)if(!1===d.outputStereo)e=a.accum(1,0,{max:d.bufferSize,min:0}),r=a.data(1,1,{meta:!0}),q=!0===d.abs?a.abs(a.add(q[0],q[1])):a.add(q[0],q[1]),r[0]=a.sub(a.add(r[0],q),a.peek(n,e,{mode:"simple"})),a.poke(n,a.abs(q),e),r=a.add(a.mul(a.div(r[0],d.bufferSize),t),y);else{e=a.data(d.bufferSize,1);r=a.accum(1,0,{max:d.bufferSize,min:0});var x=a.data(1,1,{meta:!0}),z=a.data(1,1,{meta:!0}),A=!0===d.abs?a.abs(q[0]):q[0];q=!0===d.abs?a.abs(q[1]):
q[1];x[0]=a.sub(a.add(x[0],A),a.peek(n,r,{mode:"simple"}));z[0]=a.sub(a.add(z[0],q),a.peek(e,r,{mode:"simple"}));a.poke(n,a.abs(A),r);a.poke(e,a.abs(q),r);r=[a.add(a.mul(a.div(x[0],d.bufferSize),t),y),a.add(a.mul(a.div(z[0],d.bufferSize),t),y)]}else e=a.accum(1,0,{max:d.bufferSize,min:0}),r=a.data(1,1,{meta:!0}),x=!0===d.abs?a.abs(q):q,r[0]=a.sub(a.add(r[0],x),a.peek(n,e,{mode:"simple"})),a.poke(n,a.abs(q),e),r=a.add(a.mul(a.div(r[0],d.bufferSize),t),y);c.utilities.getUID();d.isStereo=!1;n=c.factory(u,
r,["analysis","follow_in"],d);n.callback.ugenName=n.ugenName="follow_in_"+v.id;-1===c.analyzers.indexOf(n)&&c.analyzers.push(n);c.dirty(c.analyzers);c.ugens.set(f.overrideid,n)}return d};g.defaults={input:0,bufferSize:1024,multiplier:1,abs:!0,outputStereo:!1,offset:0};return g}},{"../ugen.js":149,"./analyzer.js":80,"genish.js":39}],83:[function(h,p,w){var a=h("genish.js"),l=h("./analyzer.js");h("../workletProxy.js");var b=h("../ugen.js");p.exports=function(c){var g=function(e){var k=Object.create(l);
e=Object.assign({},g.defaults,e);a.in("input");var m=a.history(0),n=a.history(0);k.out=f([m,n],e);k.in=d([m,n],e);k.listen=k.in.listen;return k},f=function(e,k){if("processor"===c.mode){var m=Array.isArray(e)?e[0].id:e.id;e=c.ugens.get(m);void 0===e&&(e=a.history(0),c.ugens.set(m,e));void 0===k&&(k={id:m})}else e=e[0];return c.factory(Object.create(b),e.out,["analysis","SSD_Out"],k,null)},d=function(e){var k=a.in("input");if("processor"===c.mode){var m=c.ugens.get(e.id-1);c.ugens.get(e.id)}else m=
e[0];var n=Object.create(b);n.listen=function(t){n.input=t;c.dirty(c.analyzers);var y=t.isStereo;void 0===t.isStereo&&!0===t.isop&&(y=!0===t.inputs[0].isStereo||!0===t.inputs[1].isStereo);if(!0===y&&"processor"===c.mode){var v=m.graph.memory.value.idx;n.callback=function(r,u){u[v]=r[0];u[v+1]=r[1];return 0};n.callback.ugenName=n.ugenName}};n=c.factory(n,k,["analysis","SSD_In"],{input:0});if("processor"===c.mode){var q=m.graph.memory.value.idx;n.callback=function(t,y){y[q]=t;return 0};n.callback.ugenName=
n.ugenName}n.type="analysis";c.analyzers.push(n);return n};g.defaults={input:0,isStereo:!1};return{In:d,Out:f,SSD:g}}},{"../ugen.js":149,"../workletProxy.js":151,"./analyzer.js":80,"genish.js":39}],84:[function(h,p,w){var a=h("../ugen.js"),l=h("genish.js");p.exports=function(b){var AD=function(g){var f=Object.create(a),d=l.in("attack"),e=l.in("decay");g=Object.assign({},AD.defaults,g);d=l.ad(d,e,{shape:g.shape,alpha:g.alpha});f.trigger=d.trigger;return b.factory(f,d,["envelopes","AD"],
g)};AD.defaults={attack:44100,decay:44100,shape:"exponential",alpha:5};return AD}},{"../ugen.js":149,"genish.js":39}],85:[function(h,p,w){var a=h("../ugen.js"),l=h("genish.js");p.exports=function(b){;var ADSR=function(g){var f=Object.create(a),d=l.in("attack"),e=l.in("decay"),k=l.in("sustain"),m=l.in("release"),n=l.in("sustainLevel");g=Object.assign({},ADSR.defaults,g);Object.assign(f,g);d=l.adsr(d,e,k,n,m,{triggerRelease:g.triggerRelease,shape:g.shape,alpha:g.alpha});f.trigger=d.trigger;
f.advance=d.release;return b.factory(f,d,["envelopes","ADSR"],g)};ADSR.defaults={attack:22050,decay:22050,sustain:44100,sustainLevel:.6,release:44100,triggerRelease:!1,shape:"exponential",alpha:5};return ADSR}},{"../ugen.js":149,"genish.js":39}],86:[function(h,p,w){var a=h("genish.js");p.exports=function(l){var b={AD:h("./ad.js")(l),ADSR:h("./adsr.js")(l),Ramp:h("./ramp.js")(l),export:function(c){for(var g in b)"export"!==g&&"factory"!==g&&(c[g]=b[g])},factory:function(c,g,f,d,e,k,m,n){n=void 0===n?!1:
n;1!=c?c=a.ad(f,d,{shape:g}):(c=a.adsr(f,d,e,k,m,{shape:g,triggerRelease:n}),c.advance=c.release);return c}};return b}},{"./ad.js":84,"./adsr.js":85,"./ramp.js":87,"genish.js":39}],87:[function(h,p,w){var a=h("../ugen.js"),l=h("genish.js");p.exports=function(b){var Ramp=function(g){var f=Object.create(a),d=l.in("length"),e=l.in("from"),k=l.in("to");g=Object.assign({},Ramp.defaults,g);var m=l.bang();d=l.accum(l.div(1,d),m,{shouldWrap:g.shouldLoop,shouldClamp:!0});k=l.sub(k,e);e=l.add(e,
l.mul(d,k));f.trigger=m.trigger;return b.factory(f,e,["envelopes","ramp"],g)};Ramp.defaults={from:0,to:1,length:l.gen.samplerate,shouldLoop:!1};return Ramp}},{"../ugen.js":149,"genish.js":39}],89:[function(h,p,w){h=function(a){this.cmp=a||function(l,b){return l-b};this.length=0;this.data=[]};h.prototype.peek=function(){return this.data[0]};h.prototype.push=function(a){this.data.push(a);a=this.data.length-1;for(var l,b;0<a;)if(l=a-1>>>1,0>this.cmp(this.data[a],this.data[l]))b=this.data[l],this.data[l]=this.data[a],
this.data[a]=b,a=l;else break;return this.length++};h.prototype.pop=function(){var a=this.data.pop(),l=this.data[0];if(0<this.data.length){this.data[0]=a;a=0;for(var b=this.data.length-1,c,g,f;;)if(c=(a<<1)+1,g=c+1,f=a,c<=b&&0>this.cmp(this.data[c],this.data[f])&&(f=c),g<=b&&0>this.cmp(this.data[g],this.data[f])&&(f=g),f!==a)c=this.data[f],this.data[f]=this.data[a],this.data[a]=c,a=f;else break}else l=a;this.length--;return l};p.exports=h},{}],91:[function(h,p,w){var a=h("./workletProxy.js"),l=h("./fx/effect.js");
p.exports=function(b){var c=a(b),g=function(f,d,e,k,m,n){m=void 0===m?null:m;n=void 0===n?!0:n;f.callback="processor"===b.mode?null===m?b.genish.gen.createCallback(d,b.memory,!1,!0):m:{out:[]};m=Array.isArray(e)?e[e.length-1]:e;Object.assign(f,{id:k.id||b.utilities.getUID(),ugenName:m+"_",graph:d,inputNames:f.inputNames||new Set(b.genish.gen.parameters),isStereo:Array.isArray(d),dirty:!0,__properties__:k,__addresses__:{}});f.ugenName+=f.id;"processor"===b.mode&&(f.callback.ugenName=f.ugenName,f.callback.id=
f.id);d={};m=$jscomp.makeIterator(f.inputNames);for(var q=m.next();!q.done;d={$jscomp$loop$prop$isNumber$98:d.$jscomp$loop$prop$isNumber$98,$jscomp$loop$prop$idx$97:d.$jscomp$loop$prop$idx$97,$jscomp$loop$prop$value$95:d.$jscomp$loop$prop$value$95,$jscomp$loop$prop$setter$96:d.$jscomp$loop$prop$setter$96},q=m.next())if(q=q.value,"memory"!==q){d.$jscomp$loop$prop$value$95=k[q];d.$jscomp$loop$prop$isNumber$98="object"===typeof d.$jscomp$loop$prop$value$95||isNaN(d.$jscomp$loop$prop$value$95)?!1:!0;
d.$jscomp$loop$prop$idx$97=void 0;d.$jscomp$loop$prop$isNumber$98&&(d.$jscomp$loop$prop$idx$97=b.memory.alloc(1),b.memory.heap[d.$jscomp$loop$prop$idx$97]=d.$jscomp$loop$prop$value$95,f.__addresses__[q]=d.$jscomp$loop$prop$idx$97);var t=Object.getOwnPropertyDescriptor(f,q);d.$jscomp$loop$prop$setter$96=void 0;void 0!==t&&(d.$jscomp$loop$prop$setter$96=t.set);Object.defineProperty(f,q,{configurable:!0,get:function(v){return function(){return v.$jscomp$loop$prop$isNumber$98?b.memory.heap[v.$jscomp$loop$prop$idx$97]:
v.$jscomp$loop$prop$value$95}}(d),set:function(v){return function(r){v.$jscomp$loop$prop$value$95!==r&&(void 0!==v.$jscomp$loop$prop$setter$96&&v.$jscomp$loop$prop$setter$96(r),"number"===typeof r?(b.memory.heap[v.$jscomp$loop$prop$idx$97]=v.$jscomp$loop$prop$value$95=r,!1===v.$jscomp$loop$prop$isNumber$98&&b.dirty(f),v.$jscomp$loop$prop$isNumber$98=!0):(v.$jscomp$loop$prop$value$95=r,b.dirty(f),v.$jscomp$loop$prop$isNumber$98=!1))}}(d)})}if(l.isPrototypeOf(f)){var y=f.bypass;Object.defineProperty(f,
"bypass",{configurable:!0,get:function(){return y},set:function(v){y!==v&&(b.dirty(f),y=v)}})}void 0!==f.__requiresRecompilation&&f.__requiresRecompilation.forEach(function(v){var r=k[v],u=!isNaN(r);Object.defineProperty(f,v,{configurable:!0,get:function(){return u?b.memory.heap[f.__addresses__[v]]:r},set:function(x){if(r!==x){if("number"===typeof x){var z=f.__addresses__[v];void 0===z&&(z=b.memory.alloc(1),f.__addresses__[v]=z);r=k[v]=b.memory.heap[z]=x;u=!0}else r=k[v]=x,u=!1,b.dirty(f);this.__redoGraph()}}})});
!0===k.shouldAddToUgen&&Object.assign(f,k);return n?c(e,k,f):f};g.getUID=function(){return b.utilities.getUID()};return g}},{"./fx/effect.js":106,"./workletProxy.js":151}],92:[function(h,p,w){var a=h("genish.js");p.exports=function(l,b,c){b=void 0===b?500:b;c=void 0===c?.5:c;var g=a.counter(1,0,b);b=a.data(b);var f=a.peek(b,g,{interp:"none",mode:"samples"}),d=a.memo(a.add(a.mul(-1,l),f));a.poke(b,a.add(l,a.mul(f,c)),g);return d}},{"genish.js":39}],93:[function(h,p,w){var a=h("genish.js"),l=h("./filter.js");
p.exports=function(b){b.genish.biquad=function(g,f,d,e,k){var m=a.data([0,0],1,{meta:!0}),n=a.data([0,0],1,{meta:!0});var q=a.data([0,0,0],1,{meta:!0});var t=a.data([0,0],1,{meta:!0});d=a.min(a.add(.5,a.mul(d,22)),22.5);f=a.div(a.mul(a.max(.005,a.min(f,.995)),a.gen.samplerate),4);f=a.mul(a.mul(2,Math.PI),a.div(f,a.gen.samplerate));var y=a.sin(f);f=a.cos(f);y=a.div(y,a.mul(2,d));var v=a.sub(1,f);switch(e){case 1:q[0]=a.div(a.add(1,f),2);q[1]=a.mul(a.add(1,f),-1);q[2]=q[0];e=a.add(1,y);t[0]=a.mul(-2,
f);t[1]=a.sub(1,y);break;case 2:q[0]=a.mul(d,y);q[1]=0;q[2]=a.mul(q[0],-1);e=a.add(1,y);t[0]=a.mul(-2,f);t[1]=a.sub(1,y);break;default:q[0]=a.div(v,2),q[1]=v,q[2]=q[0],e=a.add(1,y),t[0]=a.mul(-2,f),t[1]=a.sub(1,y)}q[0]=a.div(q[0],e);q[1]=a.div(q[1],e);q[2]=a.div(q[2],e);t[0]=a.div(t[0],e);t[1]=a.div(t[1],e);y=!0===k?g[0]:g;e=a.mul(y,q[0]);d=a.mul(m[0],q[1]);f=a.mul(m[1],q[2]);m[1]=m[0];m[0]=y;m=a.add(a.add(e,d),f);e=a.mul(n[0],t[0]);d=a.mul(n[1],t[1]);n[1]=n[0];e=a.add(e,d);m=a.sub(m,e);n[0]=m;k?
(n=a.data([0,0],1,{meta:!0}),k=a.data([0,0],1,{meta:!0}),d=g[1],g=a.mul(d,q[0]),e=a.mul(n[0],q[1]),q=a.mul(n[1],q[2]),n[1]=n[0],n[0]=d,q=a.add(a.add(g,e),q),g=a.mul(k[0],t[0]),t=a.mul(k[1],t[1]),k[1]=k[0],t=a.add(g,t),t=a.sub(q,t),k[0]=t,t=[m,t]):t=m;return t};var Biquad=function(g){var f=Object.create(l),d=Object.assign({},Biquad.defaults,g),e;Object.assign(f,d);f.__createGraph=function(){if(void 0===e)var k=void 0!==d.input&&void 0!==d.input.isStereo?d.input.isStereo:!1;else k=e.input.isStereo,
e.isStereo=k;f.graph=b.genish.biquad(a.in("input"),a.in("cutoff"),a.in("Q"),f.mode,k)};f.__createGraph();f.__requiresRecompilation=["mode","input"];return e=b.factory(f,f.graph,["filters","Filter12Biquad"],d)};Biquad.defaults={input:0,Q:.15,cutoff:.05,mode:0};return Biquad}},{"./filter.js":96,"genish.js":39}],94:[function(h,p,w){var a=h("genish.js");p.exports=function(l,b,c,g){c=void 0===c?.2:c;g=void 0===g?.84:g;var f=a.history(),d=a.counter(1,0,b);b=a.data(b);var e=a.peek(b,d,{interp:"none",mode:"samples"});
c=a.memo(a.add(a.mul(e,a.sub(1,c)),a.mul(f.out,c)));f.in(c);a.poke(b,a.add(l,a.mul(c,g)),d);return e}},{"genish.js":39}],95:[function(h,p,w){var a=h("genish.js"),l=h("./filter.js");p.exports=function(b){b.genish.diodeZDF=function(g,f,d,e,k){k=void 0===k?!1:k;var m=1/a.gen.samplerate,n=a.history(0),q=a.history(0),t=a.history(0),y=a.history(0);d=a.mul(a.max(.005,a.min(d,.995)),a.gen.samplerate/2);f=a.memo(a.add(.5,a.mul(f,a.add(5,a.sub(5,a.mul(a.div(d,2E4),5))))));d=a.memo(a.mul(2*Math.PI,d));d=a.memo(a.mul(2/
m,a.tan(a.mul(d,m/2))));var v=a.memo(a.mul(d,m/2));m=a.memo(a.mul(.5,a.div(v,a.add(1,v))));d=a.memo(a.mul(.5,a.div(v,a.sub(a.add(1,v),a.mul(a.mul(.5,v),m)))));var r=a.memo(a.mul(.5,a.div(v,a.sub(a.add(1,v),a.mul(a.mul(.5,v),d))))),u=a.memo(a.div(v,a.sub(a.add(1,v),a.mul(v,r)))),x=a.memo(a.mul(a.mul(m,d),a.mul(r,u))),z=a.memo(a.mul(a.mul(m,d),r)),A=a.memo(a.mul(m,d)),B=a.memo(a.div(v,a.add(1,v))),C=a.memo(a.div(1,a.sub(a.add(1,v),a.mul(v,r)))),D=a.memo(a.div(1,a.sub(a.add(1,v),a.mul(a.mul(.5,v),d)))),
E=a.memo(a.div(1,a.sub(a.add(1,v),a.mul(a.mul(.5,v),m)))),F=a.memo(a.div(1,a.add(1,v))),G=a.memo(a.add(1,a.mul(u,r)));u=a.memo(a.add(1,a.mul(r,d)));var H=a.memo(a.add(1,a.mul(d,m))),I=a.memo(a.mul(.5,v)),K=a.memo(a.mul(.5,v));F=a.memo(a.mul(F,y.out));var M=a.memo(a.mul(E,a.add(t.out,a.mul(F,K)))),L=a.memo(a.mul(D,a.add(q.out,a.mul(M,I))));v=a.memo(a.mul(C,a.add(n.out,a.mul(L,v))));D=a.memo(a.mul(D,a.add(q.out,a.mul(M,I))));E=a.memo(a.mul(E,a.add(t.out,a.mul(F,K))));z=a.memo(a.add(a.add(a.mul(z,v),
a.mul(A,D)),a.add(a.mul(m,E),a.mul(1,F))));g=!0===k?a.add(g[0],g[1]):g;g=a.tanh(a.mul(e,g));e=a.div(a.sub(g,a.mul(f,z)),a.add(1,a.mul(f,x)));e=a.memo(a.add(a.add(a.mul(e,G),L),a.mul(r,v)));g=a.memo(a.mul(a.sub(a.mul(1,e),n.out),B));k=a.add(g,n.out);n.in(a.add(k,g));e=a.memo(a.add(a.add(a.mul(k,u),M),a.mul(d,D)));g=a.memo(a.mul(a.sub(a.mul(.5,e),q.out),B));k=a.add(g,q.out);q.in(a.add(k,g));e=a.memo(a.add(a.add(a.mul(k,H),F),a.mul(m,E)));g=a.memo(a.mul(a.sub(a.mul(.5,e),t.out),B));k=a.add(g,t.out);
t.in(a.add(k,g));g=a.memo(a.mul(a.sub(a.mul(.5,e),y.out),B));k=a.add(g,y.out);y.in(a.add(k,g));return k};var DiodeZDF=function(g){var f=Object.create(l);g=Object.assign({},DiodeZDF.defaults,l.defaults,g);var d=g.input.isStereo;Object.assign(f,g);return b.factory(f,b.genish.diodeZDF(a.in("input"),a.in("Q"),a.in("cutoff"),a.in("saturation"),d),["filters","Filter24TB303"],g)};DiodeZDF.defaults={input:0,Q:.65,saturation:1,cutoff:.5};return DiodeZDF}},{"./filter.js":96,"genish.js":39}],96:[function(h,p,w){h=
h("../ugen.js")();h=Object.create(h);Object.assign(h,{defaults:{bypass:!1}});p.exports=h},{"../ugen.js":149}],97:[function(h,p,w){var a=h("genish.js"),l=h("./filter.js");p.exports=function(b){b.genish.filter24=function(g,f,d,e,k){k=void 0===k?!1:k;var m=a.data([0,0,0,0],1,{meta:!0});f=a.memo(a.mul(f,5));d=a.memo(a.div(d,11025));var n=a.clamp(a.mul(m[3],f));n=a.sub(k?g[0]:g,n);m[0]=a.add(m[0],a.mul(a.add(a.mul(-1,m[0]),n),d));m[1]=a.add(m[1],a.mul(a.add(a.mul(-1,m[1]),m[0]),d));m[2]=a.add(m[2],a.mul(a.add(a.mul(-1,
m[2]),m[1]),d));m[3]=a.add(m[3],a.mul(a.add(a.mul(-1,m[3]),m[2]),d));m=a.switch(e,m[3],a.sub(n,m[3]));k?(k=a.data([0,0,0,0],1,{meta:!0}),f=a.clamp(a.mul(k[3],f)),g=a.sub(g[1],f),k[0]=a.add(k[0],a.mul(a.add(a.mul(-1,k[0]),g),d)),k[1]=a.add(k[1],a.mul(a.add(a.mul(-1,k[1]),k[0]),d)),k[2]=a.add(k[2],a.mul(a.add(a.mul(-1,k[2]),k[1]),d)),k[3]=a.add(k[3],a.mul(a.add(a.mul(-1,k[3]),k[2]),d)),e=a.switch(e,k[3],a.sub(g,k[3])),e=[m,e]):e=m;return e};var Filter24=function(g){var f=Object.create(l);
g=Object.assign({},Filter24.defaults,l.defaults,g);var d=g.input.isStereo;return b.factory(f,b.genish.filter24(a.in("input"),a.in("Q"),a.in("cutoff"),a.in("isLowPass"),d),["filters","Filter24Classic"],g)};Filter24.defaults={input:0,Q:.25,cutoff:880,isLowPass:1};return Filter24}},{"./filter.js":96,"genish.js":39}],98:[function(h,p,w){p.exports=function(a){var l=a.genish,b={Filter24Classic:h("./filter24.js")(a),Filter24Moog:h("./ladder.dsp.js")(a),Filter24TB303:h("./diodeFilterZDF.js")(a),Filter12Biquad:h("./biquad.dsp.js")(a),
Filter12SVF:h("./svf.js")(a),genish:{Comb:h("./combfilter.js"),AllPass:h("./allpass.js")},factory:function(c,g,f,d,e){e=void 0===e?!1:e;d=Object.assign({},b.defaults,d);switch(d.filterType){case 1:c=l.zd24(c,l.min(l.in("Q"),.9999),g,0);break;case 2:c=l.diodeZDF(c,l.min(l.in("Q"),.9999),g,f,e);break;case 3:c=l.svf(c,g,l.sub(1,l.in("Q")),d.filterMode,e,!0);break;case 4:c=l.biquad(c,g,l.in("Q"),d.filterMode,e);break;case 5:c=l.filter24(c,l.in("Q"),g,d.filterMode,e)}return c},defaults:{filterMode:0,filterType:0},
export:function(c){for(var g in b)"export"!==g&&"genish"!==g&&(c[g]=b[g])}};return b}},{"./allpass.js":92,"./biquad.dsp.js":93,"./combfilter.js":94,"./diodeFilterZDF.js":95,"./filter24.js":97,"./ladder.dsp.js":99,"./svf.js":100}],99:[function(h,p,w){var a=h("genish.js"),l=h("./filter.js");p.exports=function(b){var c=function(f,d,e){var k=a.div(1,a.gen.samplerate),m=a.data([0,0,0,0],1,{meta:!0});e=a.max(.005,a.min(e,1));d=a.add(.5,a.mul(d,23));e=a.div(a.mul(a.mul(a.mul(Math.PI,2),e),a.gen.samplerate),
2);e=a.mul(a.div(2,k),a.tan(a.div(a.mul(e,k),2)));k=a.div(a.mul(e,k),2);d=a.div(a.mul(4,a.sub(d,.5)),24.5);var n=a.add(1,k);k=a.div(k,n);var q=a.mul(k,k),t=a.mul(q,k);e=a.mul(q,q);var y=a.div(m[0],n),v=a.div(m[1],n),r=a.div(m[2],n);n=a.div(m[3],n);n=a.add(a.add(a.add(a.mul(t,y),a.mul(q,v)),a.mul(k,r)),n);f=a.div(a.sub(f,a.mul(d,n)),a.add(1,a.mul(d,e)));f=a.mul(a.sub(f,m[0]),k);d=a.add(f,m[0]);m[0]=a.add(d,f);f=a.mul(a.sub(d,m[1]),k);d=a.add(f,m[1]);m[1]=a.add(d,f);f=a.mul(a.sub(d,m[2]),k);d=a.add(f,
m[2]);m[2]=a.add(d,f);f=a.mul(a.sub(d,m[3]),k);d=a.add(f,m[3]);m[3]=a.add(d,f);return d};b.genish.zd24=function(f,d,e,k){k=void 0===k?!1:k;var m=c(!0===k?f[0]:f,d,e);!0===k&&(f=c(f[1],d,e),m=[m,f]);return m};var g=function(f){var d=Object.create(l),e=Object.assign({},g.defaults,d.defaults,f),k;d.__requiresRecompilation=["input"];d.__createGraph=function(){if(void 0===k)var m=void 0!==e.input&&void 0!==e.input.isStereo?e.input.isStereo:!1;else m=k.input.isStereo,k.isStereo=m;d.graph=b.genish.zd24(a.in("input"),
a.in("Q"),a.in("cutoff"),m)};d.__createGraph();return k=b.factory(d,d.graph,["filters","Filter24Moog"],e)};g.defaults={input:0,Q:.75,cutoff:.25};return g}},{"./filter.js":96,"genish.js":39}],100:[function(h,p,w){var a=h("genish.js"),l=h("./filter.js");p.exports=function(b){b.genish.svf=function(g,f,d,e,k,m){k=void 0===k?!1:k;m=void 0===m?!1:m;var n=a.data([0,0],1,{meta:!0}),q=a.data([0,0],1,{meta:!0});!0===m&&(f=a.mul(a.max(.005,a.min(f,.995)),a.div(a.gen.samplerate,4)));f=a.memo(a.mul(2*Math.PI,
a.div(f,a.gen.samplerate)));a.memo(a.div(1,d));m=a.memo(a.add(q[0],a.mul(f,n[0])));var t=a.memo(a.sub(a.sub(k?g[0]:g,m),a.mul(d,n[0]))),y=a.memo(a.add(a.mul(f,t),n[0])),v=a.memo(a.add(t,m));n[0]=y;q[0]=m;n=a.selector(e,m,t,y,v);k?(k=a.data([0,0],1,{meta:!0}),q=a.data([0,0],1,{meta:!0}),m=a.memo(a.add(q[0],a.mul(f,k[0]))),g=a.memo(a.sub(a.sub(g[1],m),a.mul(d,k[0]))),d=a.memo(a.add(a.mul(f,g),k[0])),f=a.memo(a.add(g,m)),k[0]=d,q[0]=m,e=a.selector(e,m,g,d,f),e=[n,e]):e=n;return e};var SVF=
function(g){var f=Object.create(l);g=Object.assign({},SVF.defaults,l.defaults,g);var d=g.input.isStereo;return b.factory(f,b.genish.svf(a.in("input"),a.mul(a.in("cutoff"),a.gen.samplerate/5),a.sub(1,a.in("Q")),a.in("mode"),d,!0),["filters","Filter12SVF"],g)};SVF.defaults={input:0,Q:.65,cutoff:.25,mode:0};return SVF}},{"./filter.js":96,"genish.js":39}],101:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var BitCrusher=function(g){var f=Object.assign({bitCrusherLength:44100},
BitCrusher.defaults,l.defaults,g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else k=e.input.isStereo,e.isStereo=k;var m=a.in("input"),n=a.in("inputGain"),q=a.in("bitDepth"),t=a.in("sampleRate"),y=k?m[0]:m,v=k?m[1]:null;m=a.history(0);t=a.counter(t,0,1);q=a.pow(a.mul(q,16),2);y=a.div(a.floor(a.mul(a.mul(y,n),q)),q);y=a.switch(t.wrap,y,m.out);k?(a.history(0),k=a.div(a.floor(a.mul(a.mul(v,n),q)),q),k=a.switch(t.wrap,k,m.out),d.graph=
[y,k]):d.graph=y};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","bitCrusher"],f)};BitCrusher.defaults={input:0,bitDepth:.5,sampleRate:.5};return BitCrusher}},{"./effect.js":106,"genish.js":39}],102:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var c=Object.create(l),g=function(f){var d=Object.create(c),e=Object.assign({},g.defaults,l.defaults,f),k;d.__createGraph=function(){var m=void 0===k?"undefined"!==typeof e.input.isStereo?e.input.isStereo:
!0:k.input.isStereo;var n=a.accum(1,0,{shouldWrap:!1}),q=a.in("input"),t=a.in("inputGain"),y=m?q[1]:null;q=a.mul(m?q[0]:q,t);a.mul(y,t);t=a.in("rate");y=a.in("chance");var v=a.in("reverseChance"),r=a.in("repitchChance"),u=a.in("repitchMin"),x=a.in("repitchMax"),z=a.history(1),A=a.eq(a.mod(n,t),0);y=a.memo(a.sah(a.lt(a.noise(),y),A,0));A=a.memo(a.and(A,y));v=a.lt(a.noise(),v);v=a.switch(v,-1,1);r=a.ifelse(a.and(A,a.lt(a.noise(),r)),a.memo(a.mul(a.add(u,a.mul(a.sub(x,u),a.noise())),v)),v);z.in(a.switch(A,
r,z.out));u=a.memo(a.div(t,100));a.memo(a.div(1,u));r=a.data(88200);m&&a.data(88200);z=a.accum(z.out,0,{shouldWrap:!1});x=a.wrap(a.sub(a.mod(z,88200),22050),0,88200);m=a.peek(r,a.accum(1,0,{max:88200}),{mode:"simple"});z=a.switch(y,x,a.mod(z,88200));z=a.memo(a.peek(r,z,{mode:"samples"}));a.and(A,y);A=a.accum(1,A,{shouldWrap:!1});x=a.memo(a.div(A,u));v=a.div(a.sub(t,A),a.sub(t,u));t=a.ifelse(a.lt(A,u),a.memo(a.mul(a.switch(a.lt(x,1),x,1),z)),a.gt(A,a.sub(t,u)),a.memo(a.mul(a.gtp(v,0),z)),z);t=a.mix(m,
t,y);a.poke(r,q,a.mod(a.add(n,44100),88200));n=a.pan(t,t,a.in("pan"));d.graph=[n.left,n.right]};d.__createGraph();d.__requiresRecompilation=["input"];return k=b.factory(d,d.graph,["fx","shuffler"],e)};g.defaults={input:0,rate:22050,chance:.25,reverseChance:.5,repitchChance:.5,repitchMin:.5,repitchMax:2,pan:.5,mix:.5};return g}},{"./effect.js":106,"genish.js":39}],103:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var __Chorus=function(g){var f=Object.assign({},
__Chorus.defaults,l.defaults,g),d,e=Object.create(l);e.__createGraph=function(){var k=a.in("input"),m=a.in("inputGain"),n=a.in("slowFrequency"),q=a.in("fastFrequency"),t=a.in("slowGain"),y=a.in("fastGain");if(void 0===d)var v="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else v=d.input.isStereo,d.isStereo=v;var r=v?a.mul(k[0],m):a.mul(k,m),u=a.env("inversewelch",1024),x=a.env("inversewelch",1024,0,.333),z=a.env("inversewelch",1024,0,.666),A=a.phasor(n,0,{min:0}),B=a.mul(a.peek(u,A),t);n=a.mul(a.peek(x,
A),t);t=a.mul(a.peek(z,A),t);q=a.phasor(q,0,{min:0});u=a.mul(a.peek(u,q),y);x=a.mul(a.peek(x,q),y);z=a.mul(a.peek(z,q),y);q=b.ctx.sampleRate/1E3;y=1E3*q;B=a.mul(a.add(B,u,5),q);n=a.mul(a.add(n,x,5),q);x=a.mul(a.add(t,z,5),q);t=a.delay(r,B,{size:y});z=a.delay(r,n,{size:y});r=a.delay(r,x,{size:y});u=a.add(t,z,r);v?(k=a.mul(k[1],m),m=a.delay(k,B,{size:y}),v=a.delay(k,n,{size:y}),k=a.delay(k,x,{size:y}),k=a.add(m,z,k),e.graph=[a.add(t,v,r),k]):e.graph=u};e.__createGraph();e.__requiresRecompilation=["input"];
return d=b.factory(e,e.graph,["fx","chorus"],f)};__Chorus.defaults={input:0,slowFrequency:.18,slowGain:3,fastFrequency:6,fastGain:1,inputGain:1};return __Chorus}},{"./effect.js":106,"genish.js":39}],104:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var Delay=function(g){var f=Object.assign({delayLength:88200},l.defaults,Delay.defaults,g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else k=
e.input.isStereo,e.isStereo=k;var m=a.in("input"),n=a.in("inputGain"),q=a.in("time"),t=a.in("wetdry"),y=k?a.mul(m[0],n):a.mul(m,n);m=k?a.mul(m[1],n):null;n=a.in("feedback");var v=a.history(),r=a.delay(a.add(y,a.mul(v.out,n)),q,{size:f.delayLength});v.in(r);y=a.mix(y,r,t);k?(k=a.history(),q=a.delay(a.add(m,a.mul(k.out,n)),q,{size:f.delayLength}),k.in(q),t=a.mix(m,q,t),d.graph=[y,t]):d.graph=y};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","delay"],f)};Delay.defaults=
{input:0,feedback:.5,time:11025,wetdry:.5};return Delay}},{"./effect.js":106,"genish.js":39}],105:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var Distortion=function(g){var f=Object.assign({},l.defaults,Distortion.defaults,g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else k=e.input.isStereo,e.isStereo=k;var m=a.in("input"),n=a.in("inputGain"),q=a.in("shape1"),t=a.in("shape2"),y=
a.in("pregain"),v=a.in("postgain"),r=k?a.mul(m[0],n):a.mul(m,n);var u=a.sub(a.exp(a.mul(r,a.add(q,y))),a.exp(a.mul(r,a.sub(t,y))));r=a.add(a.exp(a.mul(r,y)),a.exp(a.mul(a.mul(-1,r),y)));u=a.mul(a.div(u,r),v);k?(k=k?a.mul(m[1],n):a.mul(m,n),q=a.sub(a.exp(a.mul(k,a.add(q,y))),a.exp(a.mul(k,a.sub(t,y)))),y=a.add(a.exp(a.mul(k,y)),a.exp(a.mul(a.mul(-1,k),y))),v=a.mul(a.div(q,y),v),d.graph=[u,v]):d.graph=u};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","distortion"],
f)};Distortion.defaults={input:0,shape1:.1,shape2:.1,pregain:5,postgain:.5};return Distortion}},{"./effect.js":106,"genish.js":39}],106:[function(h,p,w){h=h("../ugen.js")();h=Object.create(h);Object.assign(h,{defaults:{bypass:!1,inputGain:1},type:"effect"});p.exports=h},{"../ugen.js":149}],107:[function(h,p,w){p.exports=function(a){var l={Freeverb:h("./freeverb.js")(a),Flanger:h("./flanger.js")(a),Vibrato:h("./vibrato.js")(a),Delay:h("./delay.js")(a),BitCrusher:h("./bitCrusher.js")(a),Distortion:h("./distortion.dsp.js")(a),
RingMod:h("./ringMod.js")(a),Tremolo:h("./tremolo.js")(a),Chorus:h("./chorus.js")(a),Wavefolder:h("./wavefolder.dsp.js")(a)[0],Shuffler:h("./bufferShuffler.js")(a),export:function(b){for(var c in l)"export"!==c&&(b[c]=l[c])}};return l}},{"./bitCrusher.js":101,"./bufferShuffler.js":102,"./chorus.js":103,"./delay.js":104,"./distortion.dsp.js":105,"./flanger.js":108,"./freeverb.js":109,"./ringMod.js":110,"./tremolo.js":111,"./vibrato.js":112,"./wavefolder.dsp.js":113}],108:[function(h,p,w){var a=h("genish.js"),
l=h("./effect.js");p.exports=function(b){var Flanger=function(g){var f=Object.assign({delayLength:44100},Flanger.defaults,l.defaults,g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else k=e.input.isStereo,e.isStereo=k;var m=a.in("input");a.in("inputGain");var n=f.delayLength,q=a.in("feedback"),t=a.in("offset"),y=a.in("frequency"),v=a.data(n),r=a.accum(1,0,{min:0,max:n,interp:"none",mode:"samples"});t=a.mul(t,
500);y=void 0===f.mod?a.cycle(y):f.mod;y=a.wrap(a.add(a.sub(r,t),y),0,n);t=k?m[0]:m;var u=a.peek(v,y,{interp:"linear",mode:"samples"});a.poke(v,a.add(t,a.mul(u,q)),r);v=a.add(t,u);!0===k?(k=m[1],n=a.data(n),m=a.peek(n,y,{interp:"linear",mode:"samples"}),a.poke(n,a.add(k,a.mul(m,q)),r),q=a.add(k,m),d.graph=[v,q]):d.graph=v};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","flanger"],f)};Flanger.defaults={input:0,feedback:.81,offset:.125,frequency:1};return Flanger}},{"./effect.js":106,
"genish.js":39}],109:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var c=b.filters.genish.AllPass,g=b.filters.genish.Comb,f=[1116,1188,1277,1356,1422,1491,1557,1617],d=[225,556,441,341],e=function(k){var m=Object.assign({},l.defaults,e.defaults,k),n=Object.create(l),q;n.__createGraph=function(){var t=void 0===q?"undefined"!==typeof m.input.isStereo?m.input.isStereo:!1:q.input.isStereo;var y=[],v=[],r=a.in("input"),u=a.in("inputGain"),x=a.in("wet1"),z=a.in("wet2"),
A=a.in("dry"),B=a.in("roomSize"),C=a.in("damping"),D=!0===t?a.add(r[0],r[1]):r;u=a.mul(D,u);u=a.memo(a.mul(u,.015));for(D=0;8>D;D++)y.push(g(u,f[D],a.mul(C,.4),a.mul(.98,B))),v.push(g(u,f[D]+23,a.mul(C,.4),a.mul(.98,B)));y=a.add.apply(a,[u].concat($jscomp.arrayFromIterable(y)));v=a.add.apply(a,[u].concat($jscomp.arrayFromIterable(v)));for(B=0;4>B;B++)y=c(y,d[B]+23),v=c(v,d[B]+23);B=a.add(a.mul(y,x),a.mul(v,z),a.mul(!0===t?r[0]:r,A));t=a.add(a.mul(v,x),a.mul(y,z),a.mul(!0===t?r[1]:r,A));n.graph=[B,
t]};n.__createGraph();n.__requiresRecompilation=["input"];return q=b.factory(n,n.graph,["fx","freeverb"],m)};e.defaults={input:0,wet1:1,wet2:0,dry:.5,roomSize:.925,damping:.5};return e}},{"./effect.js":106,"genish.js":39}],110:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var RingMod=function(g){var f=Object.assign({},RingMod.defaults,l.defaults,g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:
!1;else k=e.input.isStereo,e.isStereo=k;var m=a.in("input"),n=a.in("inputGain"),q=a.in("frequency"),t=a.in("gain"),y=a.in("mix"),v=k?a.mul(m[0],n):a.mul(m,n);q=a.mul(a.cycle(q),t);v=a.add(a.mul(v,a.sub(1,y)),a.mul(a.mul(v,q),y));!0===k?(k=a.mul(m[1],n),y=a.add(a.mul(k,a.sub(1,y)),a.mul(a.mul(k,q),y)),d.graph=[v,y]):d.graph=v};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","ringMod"],f)};RingMod.defaults={input:0,frequency:220,gain:1,mix:1};return RingMod}},{"./effect.js":106,
"genish.js":39}],111:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var Tremolo=function(g){var f=Object.assign({},Tremolo.defaults,l.defaults,g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else k=e.input.isStereo,e.isStereo=k;var m=a.in("input"),n=a.in("inputGain"),q=a.in("frequency"),t=a.in("amount"),y=k?a.mul(m[0],n):a.mul(m,n);q="square"===f.shape?a.gt(a.phasor(q),0):"saw"===
f.shape?a.gtp(a.phasor(q),0):a.cycle(q);t=a.mul(q,t);y=a.sub(y,a.mul(y,t));!0===k?(k=a.mul(m[1],n),k=a.mul(k,t),d.graph=[y,k]):d.graph=y};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","tremolo"],f)};Tremolo.defaults={input:0,frequency:2,amount:1,shape:"sine"};return Tremolo}},{"./effect.js":106,"genish.js":39}],112:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js");p.exports=function(b){var Vibrato=function(g){var f=Object.assign({},Vibrato.defaults,l.defaults,
g),d=Object.create(l),e;d.__createGraph=function(){if(void 0===e)var k="undefined"!==typeof f.input.isStereo?f.input.isStereo:!1;else k=e.input.isStereo,e.isStereo=k;var m=a.in("input"),n=a.in("inputGain"),q=a.in("feedback"),t=a.in("amount"),y=a.in("frequency"),v=a.data(44100),r=a.accum(1,0,{min:0,max:44100,interp:"none",mode:"samples"});t=a.mul(t,500);t=a.wrap(a.add(a.sub(r,t),a.mul(a.cycle(y),a.sub(t,1))),0,44100);var u=k?a.mul(m[0],n):a.mul(m,n);y=a.peek(v,t,{interp:"linear",mode:"samples"});a.poke(v,
a.add(u,a.mul(y,q)),r);!0===k?(k=a.mul(m[1],n),m=a.data(44100),n=a.peek(m,t,{interp:"linear",mode:"samples"}),a.poke(m,a.add(k,mul(n,q)),r),d.graph=[y,n]):d.graph=y};d.__createGraph();d.__requiresRecompilation=["input"];return e=b.factory(d,d.graph,["fx","vibrato"],f)};Vibrato.defaults={input:0,feedback:.01,amount:.5,frequency:4};return Vibrato}},{"./effect.js":106,"genish.js":39}],113:[function(h,p,w){var a=h("genish.js"),l=h("./effect.js"),b=3E4/390,c=7.5E-12/.026,g=function(f){var d=a.process("x","Ln1","  const thresh = 10e-10;\\n\\nlet w = Ln1;\\nlet expw,p, r, s;\\n\\nconst e = Math.E\\nconst pow = Math.pow\\nconst abs = Math.abs\\nfor(let i=0; i<1000; i++) {\\nexpw = pow(e,w);\\n\\np = w*expw - x;\\nr = (w+1)*expw;\\ns = (w+2)/(2*(w+1));\\nerr = (p/(r-(p*s)));\\n\\nif (abs(err)<thresh) {\\nbreak;\\n}\\n\\nw = w - err;\\n}\\n\\nreturn w;"),
e=a.history(0),k=a.history(0),m=a.history(0),n=a.sign(f),q=a.mul(c,a.pow(Math.E,a.mul(a.mul(n,b),f)));q=d.call(q,e.out);var t=a.sub(a.mul(a.div(a.mul(.5,.026),b),a.mul(q,a.add(q,2))),a.mul(a.mul(a.mul(.5,1),f),f)),y=a.mul(.5,a.add(f,m.out));q=a.mul(c,a.pow(Math.E,a.mul(a.mul(n,b),y)));q=d.call(q,e.out);d=a.ifelse(a.lt(a.abs(a.sub(f,m.out)),1E-9),a.sub(a.mul(a.mul(n,.026),q),a.mul(1,y)),a.div(a.sub(t,k.out),a.sub(f,m.out)));e.in(q);k.in(t);m.in(f);return d};p.exports=function(f){var d=function(e){var k=
Object.assign({},l.defaults,d.defaults,e),m=Object.create(l),n;m.__createGraph=function(){if(void 0===n)var q="undefined"!==typeof k.input.isStereo?k.input.isStereo:!1;else q=n.input.isStereo,n.isStereo=q;var t=a.in("input"),y=a.in("gain"),v=a.in("postgain");var r=q?a.mul(t[0],y):a.mul(t,y);r=a.mul(r,.333);r=g(g(g(g(r))));r=a.mul(r,.6);r=a.mul(a.tanh(r),v);m.graph=r;q&&(q=q?a.mul(t[1],y):a.mul(t,y),q=a.mul(q,.333),q=g(g(g(g(q)))),q=a.mul(q,.6),q=a.mul(a.tanh(q),v),m.graph=[r,q])};m.__createGraph();
m.__requiresRecompilation=["input"];return n=f.factory(m,m.graph,["fx","wavefolder"],k)};d.defaults={input:0,gain:2,postgain:1};return[d,g]}},{"./effect.js":106,"genish.js":39}],114:[function(h,p,w){var a=h("memory-helper"),l={blockCallbacks:[],dirtyUgens:[],callbackUgens:[],callbackNames:[],analyzers:[],graphIsDirty:!1,ugens:{},debug:!1,id:-1,preventProxy:!1,proxyEnabled:!0,output:null,memory:null,factory:null,genish:h("genish.js"),scheduler:h("./scheduling/scheduler.js"),workletProcessor:null,memoed:{},
mode:"scriptProcessor",prototypes:{ugen:null,instrument:h("./instruments/instrument.js"),effect:h("./fx/effect.js"),analyzer:h("./analysis/analyzer.js")},mixins:{polyinstrument:h("./instruments/polyMixin.js")},workletPath:null,init:function(b,c,g){var f=this;g=void 0===g?"worklet":g;b=isNaN(b)?5292E4:b;this.genish.gen.mode="scriptProcessor";this.memory=a.create(b,Float64Array);this.mode=g;var d=this.utilities.createWorklet;this.scheduler.init(this);this.analyzers.dirty=!1;if("worklet"===
this.mode)return new Promise(function(e,k){(new Promise(function(m,n){f.utilities.createContext(c,d.bind(f.utilities),m,Gibberish.bufferSize)})).then(function(){l.preventProxy=!0;l.load();l.preventProxy=!1;l.output=f.Bus2();l.worklet.port.postMessage({address:"eval",code:"Gibberish.output = this.ugens.get("+l.output.id+");"});e()})});"processor"===this.mode&&l.load()},load:function(){this.factory=h("./factory.js")(this);this.Panner=h("./misc/panner.js")(this);this.PolyTemplate=h("./instruments/polytemplate.js")(this);this.oscillators=
h("./oscillators/oscillators.js")(this);this.filters=h("./filters/filters.js")(this);this.binops=h("./misc/binops.js")(this);this.monops=h("./misc/monops.js")(this);this.Bus=h("./misc/bus.js")(this);this.Bus2=h("./misc/bus2.js")(this);this.instruments=h("./instruments/instruments.js")(this);this.fx=h("./fx/effects.js")(this);this.Sequencer=h("./scheduling/sequencer.js")(this);this.Sequencer2=h("./scheduling/seq2.js")(this);this.envelopes=h("./envelopes/envelopes.js")(this);this.analysis=h("./analysis/analyzers.js")(this);
this.time=h("./misc/time.js")(this);this.Proxy=h("./workletProxy.js")(this)},export:function(b,c){if(void 0===b)throw Error("You must define a target object for Gibberish to export variables to.");(void 0===c?0:c)&&this.genish.export(b);this.instruments.export(b);this.fx.export(b);this.filters.export(b);this.oscillators.export(b);this.binops.export(b);this.monops.export(b);this.envelopes.export(b);this.analysis.export(b);b.Sequencer=this.Sequencer;b.Sequencer2=this.Sequencer2;b.Bus=this.Bus;b.Bus2=this.Bus2;
b.Scheduler=this.scheduler;this.time.export(b);this.utilities.export(b)},printcb:function(){l.worklet.port.postMessage({address:"callback"})},printobj:function(b){l.worklet.port.postMessage({address:"print",object:b.id})},send:function(b){l.worklet.port.postMessage(b)},dirty:function(b){b===this.analyzers?(this.graphIsDirty=!0,this.analyzers.dirty=!0):(this.dirtyUgens.push(b),this.graphIsDirty=!0,this.memoed[b.ugenName]&&delete this.memoed[b.ugenName])},clear:function(){this.output.inputs.splice(0,
this.output.inputs.length-2);this.analyzers.length=0;this.scheduler.clear();this.dirty(this.output);"worklet"===this.mode&&this.worklet.port.postMessage({address:"method",object:this.id,name:"clear",args:[]});l.genish.gen.removeAllListeners("memory init");l.genish.gen.histories.clear()},analysisCompare:function(b,c){return(isNaN(c.priority)?0:c.priority)-(isNaN(b.priority)?0:b.priority)},generateCallback:function(){var b=this;if("worklet"===this.mode)return l.callback=function(){return 0},l.callback.out=
[],l.callback;this.memoed={};var c=this.processGraph(this.output);var g=c[c.length-1];c.unshift("\\t'use strict'");this.analyzers.sort(this.analysisCompare).forEach(function(f){f=l.processUgen(f);if("object"===typeof f){var d=f.pop();f.forEach(function(e){c.splice(c.length-1,0,e)})}else d=f;c.push(d)});this.analyzers.forEach(function(f){-1===b.callbackUgens.indexOf(f.callback)&&b.callbackUgens.push(f.callback)});this.callbackNames=this.callbackUgens.map(function(f){return f.ugenName});c.push("\\n\\treturn "+
g.split("=")[0].split(" ")[1]);!0===this.debug&&console.log("callback:\\n",c.join("\\n"));this.callbackNames.push("mem");this.callbackUgens.push(this.memory.heap);this.callback=Function.apply(null,[].concat($jscomp.arrayFromIterable(this.callbackNames),[c.join("\\n")]));this.callback.out=[];if(this.oncallback)this.oncallback(this.callback);return this.callback},processGraph:function(b){this.callbackUgens.length=0;this.callbackNames.length=0;this.callbackUgens.push(b.callback);b=this.processUgen(b);this.dirtyUgens.length=
0;this.graphIsDirty=!1;return b},proxyReplace:function(b){if("object"===typeof b&&null!==b){if(void 0!==b.id){var c=l.processor.ugens.get(b.id);return void 0!==b.prop?c[b.prop]:c}if(!0===b.isFunc)return eval("("+b.value+")")}return b},processUgen:function(b,c){void 0===c&&(c=[]);if(void 0===b)return c;var g=l.dirtyUgens.indexOf(b),f=l.memoed[b.ugenName];if(void 0!==f)return f;if(!0===b||!1===b)throw"Why is ugen a boolean? [true] or [false]";if(void 0===b.block||-1!==dirtyIndex){void 0===b.id&&(b.id=
b.__properties__.overrideid);f="\\tconst v_"+b.id+" = ";b.isop||(f+=b.ugenName+"( ");var d=!0===b.isop||"bus"===b.type?Object.keys(b.inputs):[].concat($jscomp.arrayFromIterable(b.inputNames));f=!0===b.isop?l.__processBinop(b,f,c,d):l.__processNonBinop(b,f,c,d);f=l.__addLineEnding(f,b,d);c.push(f);l.memoed[b.ugenName]="v_"+b.id;-1!==g&&l.dirtyUgens.splice(g,1)}else if(b.block)return b.block;return c},__processBinop:function(b,c,g,f){var d=l.__isStereo(b.inputs[0]),e=l.__isStereo(b.inputs[1]),k=l.__getInputString(c,
b.inputs[0],g,"0",f),m=l.__getInputString(c,b.inputs[1],g,"1",f),n=b.op;return c=!0===d&&!1===e?c+("[ "+k+"[0] "+n+" "+m+", "+k+"[1] "+n+" "+m+" ]"):!1===d&&!0===e?c+("[ "+k+" "+n+" "+m+"[0], "+k+" "+n+" "+m+"[1] ]"):!0===d&&!0===e?c+("[ "+k+"[0] "+n+" "+m+"[0], "+k+"[1] "+n+" "+m+"[1] ]"):l.__processNonBinop(b,c,g,f)},__processNonBinop:function(b,c,g,f){for(var d=0;d<f.length;d++){var e=f[d];var k=b.isop||"bus"===b.type?b.inputs[e]:b[e];void 0!==k&&(k=l.__getBypassedInput(k),c+=l.__getInputString(c,
k,g,e,b),c=l.__addSeparator(c,k,b,d<f.length-1))}return c},__isStereo:function(b){return void 0===b||null===b?!1:!0===b.isStereo?!0:!0===b.isop?l.__isStereo(b.inputs[0])||l.__isStereo(b.inputs[1]):!1},__getBypassedInput:function(b){if(!0===b.bypass)for(var c=!1;"undefined"!==b.input&&!1===c;)"undefined"!==typeof b.input.bypass?(b=b.input,!1===b.bypass&&(c=!0)):(b=b.input,c=!0);return b},__getInputString:function(b,c,g,f,d){b="";"number"===typeof c?b=isNaN(f)?b+("mem["+d.__addresses__[f]+"]"):b+c:
"boolean"===typeof c?b+=""+c:void 0!==c&&("processor"===l.mode&&void 0===c.ugenName&&void 0!==c.id&&(void 0===d?c=l.processor.ugens.get(c.id):"seq"!==d.type&&(c=l.processor.ugens.get(c.id))),l.processUgen(c,g),c.isop||-1===l.callbackUgens.indexOf(c.callback)&&l.callbackUgens.push(c.callback),b+="v_"+c.id,c.__varname=b);return b},__addSeparator:function(b,c,g,f){!0===f&&(b=!0===g.isop?"*"===g.op||"/"===g.op?1!==c?b+(" "+g.op+" "):b.slice(0,-1*(""+c).length):b+(" "+g.op+" "):b+", ");return b},__addLineEnding:function(b,
c,g){"bus"===c.type&&0<g.length&&(b+=", ");c.isop||"seq"===c.type||(b+="mem");return b+=c.isop?"":" )"}};l.prototypes.Ugen=l.prototypes.ugen=h("./ugen.js")(l);l.utilities=h("./utilities.js")(l);p.exports=l},{"./analysis/analyzer.js":80,"./analysis/analyzers.js":81,"./envelopes/envelopes.js":86,"./factory.js":91,"./filters/filters.js":98,"./fx/effect.js":106,"./fx/effects.js":107,"./instruments/instrument.js":121,"./instruments/instruments.js":122,"./instruments/polyMixin.js":127,"./instruments/polytemplate.js":128,
"./misc/binops.js":133,"./misc/bus.js":134,"./misc/bus2.js":135,"./misc/monops.js":136,"./misc/panner.js":137,"./misc/time.js":138,"./oscillators/oscillators.js":141,"./scheduling/scheduler.js":145,"./scheduling/seq2.js":146,"./scheduling/sequencer.js":147,"./ugen.js":149,"./utilities.js":150,"./workletProxy.js":151,"genish.js":39,"memory-helper":156}],115:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Clap=function(g){var f=Object.create(l),d=
a.in("decay"),e=a.mul(d,a.mul(a.gen.samplerate,2)),k=a.in("gain"),m=a.in("spacing"),n=a.in("loudness"),q=a.in("__triggerLoudness");d=a.in("cutoff");var t=a.in("Q");g=Object.assign({},Clap.defaults,g);var y=a.decay(e,{initValue:0});e=a.gt(y,5E-4);var v=a.add(-1,a.mul(a.noise(),2)),r=a.bang();m=a.phasor(m,r,{min:0});m=a.sub(1,m);var u=a.ad(0,a.mul(.035,a.gen.samplerate),{shape:"linear"}),x=a.bang(),z=a.accum(1,x,{max:Infinity,min:0,initialValue:0});z=a.switch(a.gte(z,a.mul(a.gen.samplerate,.035)),v,0);
z=a.svf(z,1E3,.5,2,!1);k=a.mul(a.mul(a.mul(a.add(a.mul(z,y),a.mul(a.mul(v,m),u)),k),n),q);d=a.svf(k,d,t,1,!1);d=a.switch(e,d,0);f.env={trigger:function(A){r.trigger();y.trigger(A);x.trigger();u.trigger()}};return b.factory(f,d,["instruments","clap"],g)};Clap.defaults={gain:1,spacing:100,decay:.2,loudness:1,__triggerLoudness:1,cutoff:900,Q:.85};return Clap}},{"./instrument.js":121,"genish.js":39}],116:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js"),b=h("../fx/wavefolder.dsp.js");p.exports=function(c){var g=
b(c)[1],f=function(e){var k=Object.create(l),m=a.in("frequency"),n=a.in("loudness"),q=a.in("__triggerLoudness"),t=a.in("glide"),y=a.slide(m,t,t),v=a.in("attack"),r=a.in("decay"),u=a.in("sustain"),x=a.in("sustainLevel"),z=a.in("release"),A=a.in("pregain"),B=a.in("postgain"),C=a.in("bias"),D=Object.assign({},f.defaults,e);Object.assign(k,D);k.__createGraph=function(){var E=c.oscillators.factory(k.waveform,y,k.antialias),F=c.envelopes.factory(D.useADSR,D.shape,v,r,u,x,z,D.triggerRelease),G=a.in("saturation"),
H=a.mul(a.mul(a.mul(E,F),n),q);H=g(g(g(g(a.add(C,a.mul(a.mul(H,a.mul(A,F)),.333))))));H=a.mul(a.tanh(a.mul(H,.6)),B);var I=a.mul(a.in("cutoff"),a.div(m,a.div(a.gen.samplerate,16)));I=a.min(a.mul(a.mul(I,a.pow(2,a.mul(a.mul(a.in("filterMult"),n),q))),F),.995);H=c.filters.factory(H,I,G,D);I=a.mul(H,a.in("gain"));2!==D.filterType&&(I=a.mul(I,G));!0===k.panVoices?(G=a.pan(I,I,a.in("pan")),k.graph=[G.left,G.right]):k.graph=I;k.env=F;k.osc=E;k.filter=H};k.__requiresRecompilation="waveform antialias filterType filterMode useADSR shape".split(" ");
k.__createGraph();return c.factory(k,k.graph,["instruments","complex"],D)};f.defaults={waveform:"triangle",attack:44,decay:22050,sustain:44100,sustainLevel:.6,release:22050,useADSR:!1,shape:"exponential",triggerRelease:!1,gain:.5,pulsewidth:.25,frequency:220,pan:.5,antialias:!0,panVoices:!1,loudness:1,__triggerLoudness:1,glide:1,saturation:1,filterMult:2,Q:.25,cutoff:.5,filterType:1,filterMode:0,isStereo:!1,pregain:4,postgain:1,bias:0};var d=c.PolyTemplate(f,"frequency attack decay pulsewidth pan gain glide saturation filterMult Q cutoff resonance antialias filterType waveform filterMode __triggerLoudness loudness pregain postgain bias".split(" "));
d.defaults=f.defaults;return[f,d]}},{"../fx/wavefolder.dsp.js":113,"./instrument.js":121,"genish.js":39}],117:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Conga=function(f){var d=Object.create(l),e=a.in("frequency"),k=a.in("decay"),m=a.in("gain"),n=a.in("loudness"),q=a.in("__triggerLoudness");f=Object.assign({},Conga.defaults,f);var t=a.bang(),y=a.mul(t,60);k=a.sub(.101,a.div(k,10));e=a.svf(y,e,k,2,!1);m=a.mul(e,a.mul(a.mul(q,n),m));d.isStereo=!1;
d.env=t;return b.factory(d,m,["instruments","conga"],f)};Conga.defaults={gain:.125,frequency:190,decay:.85,loudness:1,__triggerLoudness:1};var g=b.PolyTemplate(Conga,["gain","frequency","decay","loudness","__triggerLoudness"]);g.defaults=Conga.defaults;return[Conga,g]}},{"./instrument.js":121,"genish.js":39}],118:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Cowbell=function(g){var f=Object.create(l),d=a.in("decay"),e=a.in("gain"),k=a.in("loudness"),m=a.in("__triggerLoudness");
g=Object.assign({},Cowbell.defaults,g);var n=a.param("bpfc",1E3),q=b.oscillators.factory("square",560),t=b.oscillators.factory("square",845);d=a.decay(a.mul(d,2*a.gen.samplerate),{initValue:0});n=a.svf(a.add(q,t),n,3,2,!1);n=a.mul(n,d);e=a.mul(n,a.mul(e,k,m));f.env=d;f.isStereo=!1;return f=b.factory(f,e,["instruments","cowbell"],g)};Cowbell.defaults={gain:1,decay:.5,loudness:1,__triggerLoudness:1};return Cowbell}},{"./instrument.js":121,"genish.js":39}],119:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");
p.exports=function(b){var FM=function(f){var d=Object.create(l),e=a.in("frequency"),k=a.in("glide"),m=a.slide(e,k,k),n=a.in("cmRatio"),q=a.in("index"),t=a.in("feedback"),y=a.in("attack"),v=a.in("decay"),r=a.in("sustain"),u=a.in("sustainLevel"),x=a.in("release"),z=a.in("loudness"),A=a.in("__triggerLoudness"),B=a.in("saturation"),C=Object.assign({},FM.defaults,f);Object.assign(d,C);d.__createGraph=function(){var D=b.envelopes.factory(C.useADSR,C.shape,y,v,r,u,x,C.triggerRelease);d.advance=
function(){D.release()};var E=a.history(0),F=b.oscillators.factory(d.modulatorWaveform,a.add(a.mul(m,n),a.mul(E.out,t,q)),d.antialias),G=a.mul(z,A);F=a.mul(a.mul(a.mul(F,m),q),G);F=a.mul(F,D);F=a.mul(.5,a.add(F,E.out));E.in(F);E=b.oscillators.factory(d.carrierWaveform,a.add(m,F),d.antialias);E=2===C.filterType?a.mul(E,D):a.mul(E,a.mul(D,B));F=a.mul(a.in("cutoff"),a.div(e,a.div(a.gen.samplerate,16)));F=a.min(a.mul(a.mul(F,a.pow(2,a.mul(a.in("filterMult"),G))),D),.995);E=b.filters.factory(E,F,B,d);
G=a.mul(a.mul(E,a.in("gain")),G);!0===C.panVoices?(G=a.pan(G,G,a.in("pan")),d.graph=[G.left,G.right],d.isStereo=!0):(d.graph=G,d.isStereo=!1);return d.env=D};d.__requiresRecompilation=["carrierWaveform","modulatorWaveform","antialias","filterType","filterMode"];d.__createGraph();f=b.factory(d,d.graph,["instruments","FM"],C);f.env.advance=f.advance;return f};FM.defaults={carrierWaveform:"sine",modulatorWaveform:"sine",attack:44,feedback:0,decay:22050,sustain:44100,sustainLevel:.6,release:22050,useADSR:!1,
shape:"linear",triggerRelease:!1,gain:.25,cmRatio:2,index:5,pulsewidth:.25,frequency:220,pan:.5,antialias:!1,panVoices:!1,glide:1,saturation:1,filterMult:1.5,Q:.25,cutoff:.35,filterType:0,filterMode:0,loudness:1,__triggerLoudness:1};var g=b.PolyTemplate(FM,"glide frequency attack decay pulsewidth pan gain cmRatio index saturation filterMult Q cutoff antialias filterType carrierWaveform modulatorWaveform filterMode feedback useADSR sustain release sustainLevel __triggerLoudness loudness".split(" "));
g.defaults=FM.defaults;return[FM,g]}},{"./instrument.js":121,"genish.js":39}],120:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Hat=function(g){var f=Object.create(l),d=a.in("tune"),e=a.memo(a.add(.4,d)),k=a.in("decay");d=a.in("gain");var m=a.in("loudness"),n=a.in("__triggerLoudness");g=Object.assign({},Hat.defaults,g);var q=a.mul(325,e),t=a.mul(a.param("bpfc",7E3),e);e=a.mul(a.param("hpfc",11E3),e);var y=b.oscillators.factory("square",q,!1),v=b.oscillators.factory("square",
a.mul(q,1.4471)),r=b.oscillators.factory("square",a.mul(q,1.617)),u=b.oscillators.factory("square",a.mul(q,1.9265)),x=b.oscillators.factory("square",a.mul(q,2.5028));q=b.oscillators.factory("square",a.mul(q,2.6637));q=a.add(y,v,r,u,x,q);k=a.decay(a.mul(k,2*a.gen.samplerate),{initValue:0});t=a.svf(q,t,.5,2,!1);t=a.mul(t,k);e=a.filter24(t,0,e,0);d=a.mul(e,a.mul(d,a.mul(m,n)));f.env=k;f.isStereo=!1;return b.factory(f,d,["instruments","hat"],g)};Hat.defaults={gain:.5,tune:.6,decay:.1,loudness:1,__triggerLoudness:1};
return Hat}},{"./instrument.js":121,"genish.js":39}],121:[function(h,p,w){h=h("../ugen.js")();h=Object.create(h);Object.assign(h,{type:"instrument",note:function(a,l){l=void 0===l?null:l;if(isNaN(this.frequency)){var b=Gibberish.processor.ugens.get(this.frequency.id);!0!==b.isop?b.inputs[0]=a:(b.inputs[1]=a,Gibberish.dirty(this));this.frequency=b}else this.frequency=a;null!==l&&(this.__triggerLoudness=l);this.env.trigger()},trigger:function(a){this.__triggerLoudness=void 0===a?1:a;this.env.trigger()}});p.exports=
h},{"../ugen.js":149}],122:[function(h,p,w){p.exports=function(a){var l={Kick:h("./kick.js")(a),Clave:h("./conga.js")(a)[0],Hat:h("./hat.js")(a),Snare:h("./snare.js")(a),Cowbell:h("./cowbell.js")(a),Tom:h("./tom.js")(a),Clap:h("./clap.dsp.js")(a),Multisampler:h("./multisampler.dsp.js")(a)};l.Clave.defaults.frequency=2500;l.Clave.defaults.decay=.5;var b=$jscomp.makeIterator(h("./synth.dsp.js")(a));l.Synth=b.next().value;l.PolySynth=b.next().value;b=$jscomp.makeIterator(h("./complex.dsp.js")(a));l.Complex=
b.next().value;l.PolyComplex=b.next().value;b=$jscomp.makeIterator(h("./monosynth.dsp.js")(a));l.Monosynth=b.next().value;l.PolyMono=b.next().value;b=$jscomp.makeIterator(h("./fm.dsp.js")(a));l.FM=b.next().value;l.PolyFM=b.next().value;b=$jscomp.makeIterator(h("./sampler.js")(a));l.Sampler=b.next().value;l.PolySampler=b.next().value;b=$jscomp.makeIterator(h("./karplusstrong.js")(a));l.Karplus=b.next().value;l.PolyKarplus=b.next().value;a=$jscomp.makeIterator(h("./conga.js")(a));l.Conga=a.next().value;
l.PolyConga=a.next().value;l.export=function(c){for(var g in l)"export"!==g&&(c[g]=l[g])};return l}},{"./clap.dsp.js":115,"./complex.dsp.js":116,"./conga.js":117,"./cowbell.js":118,"./fm.dsp.js":119,"./hat.js":120,"./karplusstrong.js":123,"./kick.js":124,"./monosynth.dsp.js":125,"./multisampler.dsp.js":126,"./sampler.js":129,"./snare.js":130,"./synth.dsp.js":131,"./tom.js":132}],123:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Karplus=function(f){f=
Object.assign({},Karplus.defaults,f);var d=Object.create(l),e=b.ctx.sampleRate,k=a.bang(),m=a.accum(1,k,{shouldWrapMax:!1,initialValue:1E6}),n=a.gtp(a.sub(1,a.div(m,200)),0),q=a.mul(a.noise(),n);n=a.history();var t=a.in("frequency"),y=a.in("glide");t=a.slide(t,y,y);e=a.delay(a.add(q,n.out),a.div(e,t));e=a.mul(e,a.t60(a.mul(a.in("decay"),t)));e=a.mix(e,n.out,a.in("damping"));q=a.noise();q=a.switch(a.gt(q,a.in("blend")),-1,1);q=a.mul(a.mul(q,e),a.mul(a.mul(a.in("loudness"),a.in("__triggerLoudness")),a.in("gain")));
n.in(e);n=Object.assign({},Karplus.defaults,f);Object.assign(d,{properties:f,env:k,phase:m,getPhase:function(){return b.memory.heap[m.memory.value.idx]}});n.panVoices?(k=a.pan(q,q,a.in("pan")),d=b.factory(d,[k.left,k.right],["instruments","karplus"],f),d.isStereo=!0):(d=b.factory(d,q,["instruments","karplus"],f),d.isStereo=!1);return d};Karplus.defaults={decay:.97,damping:.2,gain:.15,frequency:220,pan:.5,glide:1,panVoices:!1,loudness:1,__triggerLoudness:1,blend:1};var g=b.PolyTemplate(Karplus,"frequency decay damping pan gain glide loudness __triggerLoudness".split(" "),
function(f,d){var e=function(){f.getPhase()>d.decay*sampleRate?(d.disconnectUgen(f),f.isConnected=!1,b.memory.heap[f.phase.memory.value.idx]=0):b.blockCallbacks.push(e)};return e});g.defaults=Karplus.defaults;return[Karplus,g]}},{"./instrument.js":121,"genish.js":39}],124:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Kick=function(g){var f=Object.create(l),d=a.in("frequency"),e=a.in("decay"),k=a.in("tone"),m=a.in("gain"),n=a.in("loudness"),q=a.in("__triggerLoudness");
n=a.mul(n,q);g=Object.assign({},Kick.defaults,g);Object.assign(f,g);q=a.bang();var t=a.mul(q,60);e=a.sub(1.005,e);k=a.add(50,a.mul(k,a.mul(4E3,n)));d=a.svf(t,d,e,2,!1);d=a.svf(d,k,.5,0,!1);m=a.mul(d,a.mul(m,n));f.env=q;return b.factory(f,m,["instruments","kick"],g)};Kick.defaults={gain:1,frequency:85,tone:.25,decay:.9,loudness:1,__triggerLoudness:1};return Kick}},{"./instrument.js":121,"genish.js":39}],125:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");h("../oscillators/fmfeedbackosc.js");p.exports=
function(b){var Mono=function(f){var d=Object.create(l),e=[],k=a.in("frequency"),m=a.in("glide"),n=a.memo(a.slide(k,m,m)),q=a.in("attack"),t=a.in("decay"),y=a.in("sustain"),v=a.in("sustainLevel"),r=a.in("release");m=a.in("loudness");var u=a.in("__triggerLoudness"),x=a.mul(m,u),z=a.in("saturation"),A=Object.assign({},Mono.defaults,f);Object.assign(d,A);d.__createGraph=function(){for(var B=b.envelopes.factory(A.useADSR,A.shape,q,t,y,v,r,A.triggerRelease),C=0;3>C;C++){switch(C){case 1:var D=
a.add(n,a.mul(n,a.in("detune2")));break;case 2:D=a.add(n,a.mul(n,a.in("detune3")));break;default:D=n}D=b.oscillators.factory(d.waveform,D,d.antialias);e[C]=D}C=a.add.apply(a,$jscomp.arrayFromIterable(e));C=2===A.filterType?a.mul(C,B):a.sub(a.add(a.mul(C,B),z),z);D=a.mul(a.in("cutoff"),a.div(k,a.gen.samplerate/16));D=a.mul(a.mul(D,a.pow(2,a.mul(a.in("filterMult"),x))),B);C=b.filters.factory(C,D,a.in("saturation"),d);A.panVoices?(C=a.pan(C,C,a.in("pan")),d.graph=[a.mul(C.left,a.in("gain"),x),a.mul(C.right,
a.in("gain"),x)],d.isStereo=!0):(d.graph=a.mul(C,a.in("gain"),x),d.isStereo=!1);d.env=B};d.__requiresRecompilation=["waveform","antialias","filterType","filterMode"];d.__createGraph();return b.factory(d,d.graph,["instruments","Monosynth"],A)};Mono.defaults={waveform:"saw",attack:44,decay:22050,sustain:44100,sustainLevel:.6,release:22050,useADSR:!1,shape:"linear",triggerRelease:!1,gain:.25,pulsewidth:.25,frequency:220,pan:.5,detune2:.005,detune3:-.005,cutoff:.5,Q:.25,panVoices:!1,glide:1,antialias:!1,
filterType:1,filterMode:0,saturation:.5,filterMult:2,isLowPass:!0,loudness:1,__triggerLoudness:1};var g=b.PolyTemplate(Mono,"frequency attack decay cutoff Q detune2 detune3 pulsewidth pan gain glide saturation filterMult antialias filterType waveform filterMode loudness __triggerLoudness".split(" "));g.defaults=Mono.defaults;return[Mono,g]}},{"../oscillators/fmfeedbackosc.js":140,"./instrument.js":121,"genish.js":39}],126:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var c=
Object.create(l);Object.assign(c,{pickFile:function(f){this.currentSample=f},pick:function(f){f=Math.floor(f);this.currentSample=Object.keys(this.samplers)[f]},note:function(f){this.rate=f;0<f?this.__trigger():this.__phase__.value=a.mul(this.end,a.sub(this.data.buffer.length,1))},trigger:function(f){void 0!==f&&(this.__triggerLoudness=f);if("processor"===b.mode){f=this.samplers[this.currentSample];var d=this.__getVoice__();a.gen.memory.heap.set([f.dataLength],d.bufferLength.memory.values.idx);a.gen.memory.heap.set([f.dataIdx],
d.bufferLoc.memory.values.idx);d.trigger()}},__getVoice__:function(){return this.voices[this.voiceCount++%this.voices.length]}});var g=function(f){var d=Object.create(c);f=Object.assign({onload:null,voiceCount:0},g.defaults,f);d.isStereo=void 0!==f.isStereo?f.isStereo:!1;var e=a.in("start"),k=a.in("end"),m=a.in("rate"),n=a.in("loops"),q=a.in("loudness"),t=a.in("__triggerLoudness");a.data([0],1,{meta:!0});Object.assign(d,f);"worklet"===b.mode&&(d.__meta__={address:"add",name:["instruments","Multisampler"],
properties:JSON.stringify(f),id:d.id},b.worklet.ugens.set(d.id,d),b.worklet.port.postMessage(d.__meta__));for(var y=[],v=0;v<d.maxVoices;v++){var r={bufferLength:a.data([1],1,{meta:!0}),bufferLoc:a.data([1],1,{meta:!0}),bang:a.bang()};r.phase=a.counter(m,a.mul(e,r.bufferLength[0]),a.mul(k,r.bufferLength[0]),r.bang,n,{shouldWrap:!1,initialValue:9999999});r.trigger=r.bang.trigger;r.graph=a.mul(a.mul(a.ifelse(a.and(a.gte(r.phase,a.mul(e,r.bufferLength[0])),a.lt(r.phase,a.mul(k,r.bufferLength[0]))),r.peek=
a.peekDyn(r.bufferLoc[0],r.bufferLength[0],r.phase,{mode:"samples"}),0),q),t);y.push(r)}e={};k={};m=$jscomp.makeIterator(f.files);for(n=m.next();!n.done;k={$jscomp$loop$prop$sampler$102:k.$jscomp$loop$prop$sampler$102,$jscomp$loop$prop$filename$103:k.$jscomp$loop$prop$filename$103,$jscomp$loop$prop$onload$104:k.$jscomp$loop$prop$onload$104},n=m.next())k.$jscomp$loop$prop$filename$103=n.value,k.$jscomp$loop$prop$sampler$102=e[k.$jscomp$loop$prop$filename$103]={dataLength:null,dataIdx:null,buffer:null,
filename:k.$jscomp$loop$prop$filename$103},k.$jscomp$loop$prop$onload$104=function(u){return function(x){"worklet"===b.mode?(b.memory.alloc(u.$jscomp$loop$prop$sampler$102.data.buffer.length,!0),b.worklet.port.postMessage({address:"copy_multi",id:d.id,buffer:u.$jscomp$loop$prop$sampler$102.data.buffer,filename:u.$jscomp$loop$prop$filename$103})):"processor"===b.mode&&(u.$jscomp$loop$prop$sampler$102.data.buffer=x,u.$jscomp$loop$prop$sampler$102.dataLength=u.$jscomp$loop$prop$sampler$102.data.memory.values.length=
u.$jscomp$loop$prop$sampler$102.data.dim=u.$jscomp$loop$prop$sampler$102.data.buffer.length,a.gen.requestMemory(u.$jscomp$loop$prop$sampler$102.data.memory,!1),a.gen.memory.heap.set(u.$jscomp$loop$prop$sampler$102.data.buffer,u.$jscomp$loop$prop$sampler$102.data.memory.values.idx),u.$jscomp$loop$prop$sampler$102.dataIdx=u.$jscomp$loop$prop$sampler$102.data.memory.values.idx,d.currentSample=u.$jscomp$loop$prop$sampler$102.filename)}}(k),"worklet"===b.mode?(k.$jscomp$loop$prop$sampler$102.data=a.data(k.$jscomp$loop$prop$filename$103,
1,{onload:k.$jscomp$loop$prop$onload$104}),k.$jscomp$loop$prop$sampler$102.data instanceof Promise?k.$jscomp$loop$prop$sampler$102.data.then(function(u){return function(x){u.$jscomp$loop$prop$sampler$102.data=x;u.$jscomp$loop$prop$onload$104(u.$jscomp$loop$prop$sampler$102)}}(k)):k.$jscomp$loop$prop$onload$104(k.$jscomp$loop$prop$sampler$102)):(k.$jscomp$loop$prop$sampler$102.data=a.data(new Float32Array,1,{onload:k.$jscomp$loop$prop$onload$104,filename:k.$jscomp$loop$prop$filename$103}),k.$jscomp$loop$prop$sampler$102.data.onload=
k.$jscomp$loop$prop$onload$104);d.__createGraph=function(){var u=y.map(function(x){return x.graph});d.graph=a.mul(a.add.apply(a,$jscomp.arrayFromIterable(u)),a.in("gain"));!0===d.panVoices&&(u=a.pan(d.graph,d.graph,a.in("pan")),d.graph=[u.left,u.right])};d.loadBuffer=function(u){"processor"===b.mode&&(d.data.buffer=u,d.data.memory.values.length=d.data.dim=u.length)};d.__createGraph();f=b.factory(d,d.graph,["instruments","multisampler"],f);b.preventProxy=!0;b.proxyEnabled=!1;f.voices=y;f.samplers=
e;b.proxyEnabled=!0;b.preventProxy=!1;return f};g.defaults={gain:1,pan:.5,rate:1,panVoices:!1,loops:0,start:0,end:1,bufferLength:-999999999,loudness:1,maxVoices:5,__triggerLoudness:1};return g}},{"./instrument.js":121,"genish.js":39}],127:[function(h,p,w){var a=h("../index.js");p.exports={note:function(l){if("worklet"!==a.mode){var b=this.__getVoice__();b.__triggerLoudness=this.__triggerLoudness;b.note(l,this.__triggerLoudness);this.__runVoice__(b,this);this.triggerNote=l}},trigger:function(l){var b=
this;if(null!==this.triggerChord)this.triggerChord.forEach(function(g){var f=b.__getVoice__();Object.assign(f,b.properties);f.note(g,l);b.__runVoice__(f,b)});else if(null!==this.triggerNote){var c=this.__getVoice__();Object.assign(c,this.properties);c.note(this.triggerNote,l);this.__runVoice__(c,this)}else c=this.__getVoice__(),Object.assign(c,this.properties),c.trigger(l),this.__runVoice__(c,this)},__runVoice__:function(l,b){l.isConnected||(l.connect(b),l.isConnected=!0)},__getVoice__:function(){return this.voices[this.voiceCount++%
this.voices.length]},chord:function(l){var b=this;void 0!==a&&"worklet"!==a.mode&&(l.forEach(function(c){return b.note(c)}),this.triggerChord=l)},free:function(){for(var l=$jscomp.makeIterator(this.voices),b=l.next();!b.done;b=l.next())b.value.free()},triggerChord:null,triggerNote:null}},{"../index.js":114}],128:[function(h,p,w){h("genish.js");var a=h("../workletProxy.js");p.exports=function(l){var b=a(l),c=function(g,f,d){return function(e){var k=Object.assign({},{isStereo:!0,maxVoices:4},e);e=!0===
k.isStereo?l.Bus2({__useProxy__:!1}):l.Bus({__useProxy__:!1});Object.assign(e,{maxVoices:k.maxVoices,voiceCount:0,envCheck:d,dirty:!0,ugenName:"poly"+g.name+"_"+e.id+"_"+(k.isStereo?2:1),properties:k},l.mixins.polyinstrument);k.panVoices=!0;e.callback.ugenName=e.ugenName;var m=k.id;void 0!==k.id&&delete k.id;for(var n=[],q=0;q<e.maxVoices;q++)k.id=e.id+"_"+q,n[q]=g(k),"processor"===l.mode&&(n[q].callback.ugenName=n[q].ugenName),n[q].isConnected=!1;if(!1===k.isStereo){var t=f.slice(0);q=t.indexOf("pan");
-1<q&&t.splice(q,1)}k.id=m;c.setupProperties(e,g,k.isStereo?f:t);t=b(["instruments","Poly"+g.name],k,e);if("worklet"===l.mode)for(t.voices=[],k=0,n=$jscomp.makeIterator(n),m=n.next();!m.done;m=n.next())m=m.value,l.worklet.port.postMessage({address:"addObjectToProperty",object:e.id,name:"voices",key:k,value:m.id}),t.voices[k]=m,k++;return t}};c.setupProperties=function(g,f,d){var e={};d=$jscomp.makeIterator(d);for(var k=d.next();!k.done;e={$jscomp$loop$prop$property$107:e.$jscomp$loop$prop$property$107},
k=d.next())e.$jscomp$loop$prop$property$107=k.value,"pan"!==e.$jscomp$loop$prop$property$107&&"id"!==e.$jscomp$loop$prop$property$107&&Object.defineProperty(g,e.$jscomp$loop$prop$property$107,{get:function(m){return function(){return g.properties[m.$jscomp$loop$prop$property$107]||f.defaults[m.$jscomp$loop$prop$property$107]}}(e),set:function(m){return function(n){g.properties[m.$jscomp$loop$prop$property$107]=n;for(var q=$jscomp.makeIterator(g.voices),t=q.next();!t.done;t=q.next())t.value[m.$jscomp$loop$prop$property$107]=
n}}(e)})};return c}},{"../workletProxy.js":151,"genish.js":39}],129:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var c=Object.create(l);Object.assign(c,{note:function(d){this.rate=d;0<d?this.__trigger():this.__phase__.value=this.end*(this.data.buffer.length-1)},trigger:function(d){void 0!==d&&(this.gain=d);"processor"===b.mode&&(0<b.memory.heap[this.__rateStorage__.memory.values.idx]?this.__trigger():this.__phase__.value=this.end*(this.data.buffer.length-1))}});
var g=function(d){var e=Object.create(c);d=Object.assign({onload:null},g.defaults,d);e.isStereo=void 0!==d.isStereo?d.isStereo:!1;var k=a.in("start"),m=a.in("end"),n=a.in("bufferLength"),q=a.in("rate"),t=a.in("loops"),y=a.in("loudness"),v=a.in("__triggerLoudness"),r=a.data([0],1,{meta:!0});Object.assign(e,d);"worklet"===b.mode&&(e.__meta__={address:"add",name:["instruments","Sampler"],properties:JSON.stringify(d),id:e.id},b.worklet.ugens.set(e.id,e),b.worklet.port.postMessage(e.__meta__));e.__createGraph=
function(){e.__bang__=a.bang();e.__trigger=e.__bang__.trigger;e.__phase__=a.counter(q,a.mul(k,n),a.mul(m,n),e.__bang__,t,{shouldWrap:!1,initialValue:9999999});e.__rateStorage__=r;r[0]=q;e.graph=a.add(a.mul(a.ifelse(a.and(a.gte(e.__phase__,a.mul(k,n)),a.lt(e.__phase__,a.mul(m,n))),a.peek(e.data,e.__phase__,{mode:"samples"}),0),a.mul(a.mul(y,v),a.in("gain"))),r[0],a.mul(r[0],-1));if(!0===e.panVoices){var x=a.pan(e.graph,e.graph,a.in("pan"));e.graph=[x.left,x.right]}};var u=function(x,z){if(void 0!==
x){"worklet"===b.mode?(z=b.memory.alloc(x.length,!0),b.worklet.port.postMessage({address:"copy",id:e.id,idx:z,buffer:x})):"processor"===b.mode&&(e.data.buffer=x,e.data.memory.values.length=e.data.dim=x.length,e.__redoGraph());if("function"===typeof e.onload)e.onload(x||e.data.buffer);-999999999===e.bufferLength&&void 0!==e.data.buffer&&(e.bufferLength=e.data.buffer.length-1)}};e.loadFile=function(x){"processor"!==b.mode?(e.data=a.data(x,1,{onload:u}),e.data instanceof Promise?e.data.then(function(z){e.data=
z;u(z.buffer,x)}):u(e.data.buffer,x)):e.data=a.data(new Float32Array,1,{onload:u,filename:x})};e.loadBuffer=function(x){"processor"===b.mode&&(e.data.buffer=x,e.data.memory.values.length=e.data.dim=x.length,e.__redoGraph())};void 0!==d.filename?e.loadFile(d.filename):e.data=a.data(new Float32Array);void 0!==e.data&&(e.data.onload=u,e.__createGraph());return b.factory(e,e.graph,["instruments","sampler"],d)};g.defaults={gain:1,pan:.5,rate:1,panVoices:!1,loops:0,start:0,end:1,bufferLength:-999999999,
loudness:1,__triggerLoudness:1};var f=b.PolyTemplate(g,"rate pan gain start end loops bufferLength __triggerLoudness loudness".split(" "),function(d,e){var k=function(){var m=b.memory.heap[d.__phase__.memory.value.idx];0<d.rate&&m>d.end||0>d.rate&&0>m?(e.disconnectUgen.call(e,d),d.isConnected=!1):b.blockCallbacks.push(k)};return k});return[g,f]}},{"./instrument.js":121,"genish.js":39}],130:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Snare=function(g){var f=
Object.create(l),d=a.in("decay"),e=a.mul(d,2*a.gen.samplerate),k=a.in("snappy"),m=a.in("tune");d=a.in("gain");var n=a.in("loudness"),q=a.in("__triggerLoudness");n=a.mul(n,q);e=a.decay(e,{initValue:0});q=a.memo(a.gt(e,5E-4));var t=a.mul(a.noise(),e);t=a.svf(t,a.add(1E3,a.mul(a.add(1,m),1E3)),.5,1,!1);k=a.mul(a.gtp(a.mul(t,k),0),n);t=a.svf(e,a.mul(180,a.add(m,1)),.05,2,!1);m=a.svf(e,a.mul(330,a.add(m,1)),.05,2,!1);m=a.memo(a.add(k,t,a.mul(m,.8)));d=a.mul(m,a.mul(d,n));d=a.switch(q,d,0);g=Object.assign({},
Snare.defaults,g);f.env=e;return b.factory(f,d,["instruments","snare"],g)};Snare.defaults={gain:.5,tune:0,snappy:1,decay:.1,loudness:1,__triggerLoudness:1};return Snare}},{"./instrument.js":121,"genish.js":39}],131:[function(h,p,w){var a=h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Synth=function(f){var d=Object.create(l),e=a.in("frequency"),k=a.in("loudness"),m=a.in("__triggerLoudness"),n=a.in("glide"),q=a.slide(e,n,n),t=a.in("attack"),y=a.in("decay"),v=a.in("sustain"),r=a.in("sustainLevel"),
u=a.in("release"),x=Object.assign({},Synth.defaults,f);Object.assign(d,x);d.__createGraph=function(){var z=b.oscillators.factory(d.waveform,q,d.antialias),A=b.envelopes.factory(x.useADSR,x.shape,t,y,v,r,u,x.triggerRelease);d.advance=function(){A.release()};var B=a.mul(a.mul(a.mul(z,A),k),m),C=a.in("saturation"),D=a.mul(a.in("cutoff"),a.div(e,a.div(a.gen.samplerate,16)));D=a.min(a.mul(a.mul(D,a.pow(2,a.mul(a.mul(a.in("filterMult"),k),m))),A),.995);B=b.filters.factory(B,D,C,x);D=a.mul(B,a.in("gain"));2!==
d.filterType&&(D=a.sub(a.add(D,C),C));!0===d.panVoices?(C=a.pan(D,D,a.in("pan")),d.graph=[C.left,C.right],d.isStereo=!0):(d.graph=D,d.isStereo=!1);d.env=A;d.osc=z;d.filter=B;return A};d.__requiresRecompilation="waveform antialias filterType filterMode useADSR shape".split(" ");d.__createGraph();f=b.factory(d,d.graph,["instruments","synth"],x,null,!0,["saturation"]);f.env.advance=f.advance;return f};Synth.defaults={waveform:"saw",attack:44,decay:22050,sustain:44100,sustainLevel:.6,release:22050,useADSR:!1,
shape:"linear",triggerRelease:!1,gain:.5,pulsewidth:.25,frequency:220,pan:.5,antialias:!1,panVoices:!1,loudness:1,__triggerLoudness:1,glide:1,saturation:1,filterMult:2,Q:.25,cutoff:.5,filterType:1,filterMode:0};var g=b.PolyTemplate(Synth,"frequency attack decay pulsewidth pan gain glide saturation filterMult Q cutoff resonance antialias filterType waveform filterMode __triggerLoudness loudness".split(" "));g.defaults=Synth.defaults;return[Synth,g]}},{"./instrument.js":121,"genish.js":39}],132:[function(h,p,w){var a=
h("genish.js"),l=h("./instrument.js");p.exports=function(b){var Tom=function(g){var f=Object.create(l),d=a.in("decay"),e=a.in("frequency"),k=a.in("gain"),m=a.in("loudness"),n=a.in("__triggerLoudness");g=Object.assign({},Tom.defaults,g);var q=a.bang(),t=a.mul(q,1),y=a.decay(a.mul(d,2*a.gen.samplerate),{initValue:0});d=a.mul(a.svf(t,e,.0175,2,!1),10);e=a.gtp(a.noise(),0);e=a.mul(e,y);e=a.mul(a.svf(e,120,.5,0,!1),2.5);k=a.mul(a.add(d,e),a.mul(k,a.mul(m,n)));f.env={trigger:function(){y.trigger();
q.trigger()}};f.isStereo=!1;return f=b.factory(f,k,["instruments","tom"],g)};Tom.defaults={gain:1,decay:.7,frequency:120,loudness:1,__triggerLoudness:1};return Tom}},{"./instrument.js":121,"genish.js":39}],133:[function(h,p,w){var a=h("../ugen.js")(),l=h("../workletProxy.js");h("genish.js");p.exports=function(b){var c=l(b),g=function(e,k){for(var m={$jscomp$loop$prop$i$110:0};2>m.$jscomp$loop$prop$i$110;m={$jscomp$loop$prop$i$110:m.$jscomp$loop$prop$i$110},m.$jscomp$loop$prop$i$110++)Object.defineProperty(e,
m.$jscomp$loop$prop$i$110,{get:function(n){return function(){return e.inputs[n.$jscomp$loop$prop$i$110]}}(m),set:function(n){return function(q){e.inputs[n.$jscomp$loop$prop$i$110]=q;"worklet"===b.mode&&("number"===typeof q?b.worklet.port.postMessage({address:"addToProperty",object:k,name:"inputs",key:n.$jscomp$loop$prop$i$110,value:q}):b.worklet.port.postMessage({address:"addObjectToProperty",object:k,name:"inputs",key:n.$jscomp$loop$prop$i$110,value:q.id}),b.worklet.port.postMessage({address:"dirty",
id:k}))}}(m)})},f={export:function(e){for(var k in f)"export"!==k&&(e[k]=f[k])},Add:function(e){for(var k=[],m=0;m<arguments.length;++m)k[m-0]=arguments[m];m=b.factory.getUID();var n=Object.create(a),q=b.__isStereo(k[0])||b.__isStereo(k[1]);Object.assign(n,{isop:!0,op:"+",inputs:k,ugenName:"add"+m,id:m,isStereo:q});k=c(["binops","Add"],{isop:!0,inputs:k},n);g(k,m);return k},Sub:function(e){for(var k=[],m=0;m<arguments.length;++m)k[m-0]=arguments[m];m=b.factory.getUID();var n=Object.create(a),q=b.__isStereo(k[0])||
b.__isStereo(k[1]);Object.assign(n,{isop:!0,op:"-",inputs:k,ugenName:"sub"+m,id:m,isStereo:q});return c(["binops","Sub"],{isop:!0,inputs:k},n)},Mul:function(e){for(var k=[],m=0;m<arguments.length;++m)k[m-0]=arguments[m];m=b.factory.getUID();var n=Object.create(a),q=b.__isStereo(k[0])||b.__isStereo(k[1]);Object.assign(n,{isop:!0,op:"*",inputs:k,ugenName:"mul"+m,id:m,isStereo:q});k=c(["binops","Mul"],{isop:!0,inputs:k},n);g(k,m);return k},Div:function(e){for(var k=[],m=0;m<arguments.length;++m)k[m-
0]=arguments[m];m=b.factory.getUID();var n=Object.create(a),q=b.__isStereo(k[0])||b.__isStereo(k[1]);Object.assign(n,{isop:!0,op:"/",inputs:k,ugenName:"div"+m,id:m,isStereo:q});k=c(["binops","Div"],{isop:!0,inputs:k},n);g(k,m);return k},Mod:function(e){for(var k=[],m=0;m<arguments.length;++m)k[m-0]=arguments[m];m=b.factory.getUID();var n=Object.create(a),q=b.__isStereo(k[0])||b.__isStereo(k[1]);Object.assign(n,{isop:!0,op:"%",inputs:k,ugenName:"mod"+m,id:m,isStereo:q});k=c(["binops","Mod"],{isop:!0,
inputs:k},n);g(k,m);return k}},d;for(d in f)f[d].defaults={0:0,1:0};return f}},{"../ugen.js":149,"../workletProxy.js":151,"genish.js":39}],134:[function(h,p,w){h("genish.js");var a=h("../ugen.js")(),l=h("../workletProxy.js");p.exports=function(b){var c=l(b),g=Object.create(a);Object.assign(g,{gain:{set:function(d){this.mul.inputs[1]=d;b.dirty(this)},get:function(){return this.mul[1]}},__addInput:function(d){this.sum.inputs.push(d);b.dirty(this)},create:function(d){d=Object.assign({},g.defaults,{inputs:[0]},
d);b.preventProxy=!0;var e=b.binops.Add.apply(b.binops,$jscomp.arrayFromIterable(d.inputs)),k=b.binops.Mul(e,d.gain);b.preventProxy=!1;var m=b.Panner({input:k,pan:d.pan});m.sum=e;m.mul=k;m.disconnectUgen=g.disconnectUgen;m.__properties__=d;d=!0===d.__useProxy__?c(["Bus"],d,m):m;Object.defineProperty(d,"gain",g.gain);return d},disconnectUgen:function(d){d=this.sum.inputs.indexOf(d);-1!==d&&(this.sum.inputs.splice(d,1),b.dirty(this))},defaults:{gain:1,pan:.5,__useProxy__:!0}});var f=g.create.bind(g);
f.defaults=g.defaults;return f}},{"../ugen.js":149,"../workletProxy.js":151,"genish.js":39}],135:[function(h,p,w){var a=h("genish.js"),l=h("../ugen.js")(),b=h("../workletProxy.js");p.exports=function(c){var g=Object.create(l),f=b(c),d,e;Object.assign(g,{create:function(m){void 0===d&&(a.pan(),d=c.memory.alloc(1024),c.memory.heap.set(c.genish.gen.globals.panL.buffer,d),e=c.memory.alloc(1024),c.memory.heap.set(c.genish.gen.globals.panR.buffer,e));var n=new Float64Array(2),q=Object.create(g);m=Object.assign({},
g.defaults,m);Object.assign(q,{callback:function(){n[0]=n[1]=0;for(var r=arguments.length-1,u=arguments[r],x=arguments[r-1],z=arguments[r-2],A=0;A<r-2;A+=3){var B=arguments[A],C=arguments[A+1],D=arguments[A+2];n[0]+=!0===D?B[0]*C:B*C;n[1]+=!0===D?B[1]*C:B*C}0>x?x=0:1<x&&(x=1);A=1023*x;r=A|0;x=r+1&1023;A-=r;B=u[e+r]+A*(u[e+x]-u[e+r]);n[0]=n[0]*z*(u[d+r]+A*(u[d+x]-u[d+r]));n[1]=n[1]*z*B;return n},id:c.factory.getUID(),dirty:!1,type:"bus",inputs:[1,.5],isStereo:!0,__properties__:m},g.defaults,m);q.ugenName=
q.callback.ugenName="bus2_"+q.id;var t=!0===q.__useProxy__?f(["Bus2"],m,q):q,y=.5;Object.defineProperty(t,"pan",{get:function(){return y},set:function(r){y=r;t.inputs[t.inputs.length-1]=y;c.dirty(t)}});var v=1;Object.defineProperty(t,"gain",{get:function(){return v},set:function(r){v=r;t.inputs[t.inputs.length-2]=v;c.dirty(t)}});return t},disconnectUgen:function(m){m=this.inputs.indexOf(m);-1!==m&&(this.inputs.splice(m,3),c.dirty(this))},defaults:{gain:1,pan:.5,__useProxy__:!0}});var k=g.create.bind(g);
k.defaults=g.defaults;return k}},{"../ugen.js":149,"../workletProxy.js":151,"genish.js":39}],136:[function(h,p,w){var a=h("genish.js"),l=h("../ugen.js")();p.exports=function(b){var c={export:function(g){for(var f in c)"export"!==f&&(g[f]=c[f])},Abs:function(g){var f=Object.create(l),d=a.abs(a.in("input"));return b.factory(f,d,["monops","abs"],Object.assign({},c.defaults,{inputs:[g],isop:!0}))},Pow:function(g,f){var d=Object.create(l),e=a.pow(a.in("input"),a.in("exponent"));b.factory(d,e,["monops",
"pow"],Object.assign({},c.defaults,{inputs:[g],exponent:f,isop:!0}));return d},Clamp:function(g,f,d){var e=Object.create(l),k=a.clamp(a.in("input"),a.in("min"),a.in("max"));return b.factory(e,k,["monops","clamp"],Object.assign({},c.defaults,{inputs:[g],isop:!0,min:f,max:d}))},Merge:function(g){var f=Object.create(l);b.factory(f,a.in("input"),["monops","merge"],{inputs:[g],isop:!0},function(d){return d[0]+d[1]});f.type="analysis";f.inputNames=["input"];f.inputs=[g];f.input=g;return f},defaults:{input:0}};
return c}},{"../ugen.js":149,"genish.js":39}],137:[function(h,p,w){var a=h("genish.js"),l=h("../ugen.js")();p.exports=function(b){var Panner=function(g){g=Object.assign({},Panner.defaults,g);var f=Object.create(l),d=void 0!==g.input.isStereo?g.input.isStereo:Array.isArray(g.input),e=a.in("input"),k=a.in("pan");d=d?a.pan(e[0],e[1],k):a.pan(e,e,k);b.factory(f,[d.left,d.right],["panner"],g);return f};Panner.defaults={input:0,pan:.5};return Panner}},{"../ugen.js":149,"genish.js":39}],138:[function(h,p,
w){p.exports=function(a){var l={bpm:120,export:function(b){Object.assign(b,l)},ms:function(b){return b*a.ctx.sampleRate/1E3},seconds:function(b){return b*a.ctx.sampleRate},beats:function(b){return function(){return a.ctx.sampleRate/(a.Time.bpm/60)*b}}};return l}},{}],139:[function(h,p,w){var a=h("genish.js"),l=a.history,b=a.noise;p.exports=function(){var c=l(0),g=a.sub(a.mul(b(),2),1);g=a.div(a.add(c.out,a.mul(.02,g)),1.02);c.in(g);return 3.5*g}},{"genish.js":39}],140:[function(h,p,w){var a=h("genish.js");
p.exports=function(l,b,c,g){c=void 0===c?.5:c;void 0===g&&(g={type:0});var f=a.history();l=a.memo(a.div(l,a.gen.samplerate));var d=a.sub(-.5,l);d=a.mul(a.mul(13,b),a.pow(d,5));var e=a.sub(.376,a.mul(l,.752));b=a.sub(1,a.mul(2,l));var k=a.accum(l,0,{min:-1});l=a.memo(a.mul(a.add(f.out,a.sin(a.mul(2*Math.PI,a.memo(a.add(k,a.mul(f.out,d)))))),.5));f.in(l);1===g.type?(e=a.history(),g=a.history(),c=a.mul(a.add(e.out,a.sin(a.mul(2*Math.PI,a.memo(a.add(k,a.mul(e.out,d),c))))),.5),e.in(c),f=a.memo(a.sub(f.out,
e.out)),f=a.memo(a.add(a.mul(2.5,f),a.mul(-1.5,g.out))),g.in(a.sub(l,c))):(l=a.add(a.mul(2.5,l),a.mul(-1.5,f.out)),f=l=a.add(l,e));return a.mul(f,b)}},{"genish.js":39}],141:[function(h,p,w){var a=h("genish.js"),l=h("../ugen.js")(),b=h("./fmfeedbackosc.js"),c=h("./polyblep.dsp.js");p.exports=function(g){var f={export:function(e){for(var k in f)"export"!==k&&(e[k]=f[k])},genish:{Brown:h("./brownnoise.dsp.js"),Pink:h("./pinknoise.dsp.js")},Wavetable:h("./wavetable.js")(g),Square:function(e){var k=Object.create(l);
e=Object.assign({antialias:!1},f.defaults,e);var m=f.factory("square",a.in("frequency"),e.antialias);m=a.mul(m,a.in("gain"));return g.factory(k,m,["oscillators","square"],e)},Triangle:function(e){var k=Object.create(l);e=Object.assign({antialias:!1},f.defaults,e);var m=f.factory("triangle",a.in("frequency"),e.antialias);m=a.mul(m,a.in("gain"));return g.factory(k,m,["oscillators","triangle"],e)},PWM:function(e){var k=Object.create(l);e=Object.assign({antialias:!1,pulsewidth:.25},f.defaults,e);var m=
f.factory("pwm",a.in("frequency"),e.antialias);m=a.mul(m,a.in("gain"));return g.factory(k,m,["oscillators","PWM"],e)},Sine:function(e){var k=Object.create(l);e=Object.assign({},f.defaults,e);var m=a.mul(a.cycle(a.in("frequency")),a.in("gain"));return g.factory(k,m,["oscillators","sine"],e)},Noise:function(e){var k=Object.create(l);e=Object.assign({},{gain:1,color:"white"},e);switch(e.color){case "brown":var m=a.mul(f.genish.Brown(),a.in("gain"));break;case "pink":m=a.mul(f.genish.Pink(),a.in("gain"));
break;default:m=a.mul(a.noise(),a.in("gain"))}return g.factory(k,m,["oscillators","noise"],e)},Saw:function(e){var k=Object.create(l);e=Object.assign({antialias:!1},f.defaults,e);var m=f.factory("saw",a.in("frequency"),e.antialias);m=a.mul(m,a.in("gain"));return g.factory(k,m,["oscillators","saw"],e)},ReverseSaw:function(e){var k=Object.create(l);e=Object.assign({antialias:!1},f.defaults,e);var m=a.sub(1,f.factory("saw",a.in("frequency"),e.antialias));m=a.mul(m,a.in("gain"));return g.factory(k,m,
["oscillators","ReverseSaw"],e)},factory:function(e,k,m){m=void 0===m?!1:m;switch(e){case "pwm":e=a.in("pulsewidth");if(1==m)var n=b(k,1,e,{type:1});else k=a.phasor(k,0,{min:0}),n=a.lt(k,e);break;case "saw":n=0==m?a.phasor(k):c(k,{type:e});break;case "sine":n=a.cycle(k);break;case "square":n=1==m?c(k,{type:e}):a.wavetable(k,{buffer:f.Square.buffer,name:"square"});break;case "triangle":n=1==m?c(k,{type:e}):a.wavetable(k,{buffer:f.Triangle.buffer,name:"triangle"});break;case "noise":n=a.noise()}return n}};
f.Square.buffer=new Float32Array(1024);for(var d=1023;0<=d;d--)f.Square.buffer[d]=.5<d/1024?1:-1;f.Triangle.buffer=new Float32Array(1024);for(d=1024;d--;)f.Triangle.buffer[d]=1-4*Math.abs((d/1024+.25)%1-.5);f.defaults={frequency:440,gain:1};return f}},{"../ugen.js":149,"./brownnoise.dsp.js":139,"./fmfeedbackosc.js":140,"./pinknoise.dsp.js":142,"./polyblep.dsp.js":143,"./wavetable.js":144,"genish.js":39}],142:[function(h,p,w){var a=h("genish.js"),l=a.data,b=a.noise;p.exports=function(){var c=l(8,1,
{meta:!0}),g=a.sub(a.mul(b(),2),1);c[0]=a.add(a.mul(.99886,c[0]),a.mul(g,.0555179));c[1]=a.add(a.mul(.99332,c[1]),a.mul(g,.0750579));c[2]=a.add(a.mul(.969,c[2]),a.mul(g,.153852));c[3]=a.add(a.mul(.8865,c[3]),a.mul(g,.3104856));c[4]=a.add(a.mul(.55,c[4]),a.mul(g,.5329522));c[5]=a.sub(a.mul(-.7616,c[5]),a.mul(g,.016898));var f=a.mul(a.add(a.add(a.add(a.add(a.add(a.add(a.add(c[0],c[1]),c[2]),c[3]),c[4]),c[5]),c[6]),a.mul(g,.5362)),.11);c[6]=a.mul(g,.115926);return f}},{"genish.js":39}],143:[function(h,
p,w){var a=h("genish.js");p.exports=function(l,b){void 0===b&&(b={type:"saw"});var c=a.history(0);b=b.type;l=a.div(void 0===l?220:l,a.gen.samplerate);var g=a.accum(l,0,{min:0});var f="triangle"===b||"square"===b?a.sub(a.mul(2,a.lt(g,.5)),1):a.sub(a.mul(2,g),1);var d=a.lt(g,l),e=a.gt(g,a.sub(1,l)),k=a.switch(d,a.div(g,l),a.switch(e,a.div(a.sub(g,1),l),g));d=a.switch(d,a.sub(a.sub(a.add(k,k),a.mul(k,k)),1),a.switch(e,a.add(a.add(a.add(a.mul(k,k),k),k),1),0));"saw"!==b?(f=a.add(f,d),e=a.memo(a.mod(a.add(g,
.5),1)),g=a.lt(e,l),d=a.gt(e,a.sub(1,l)),e=a.switch(g,a.div(e,l),a.switch(d,a.div(a.sub(e,1),l),e)),g=a.switch(g,a.sub(a.sub(a.add(e,e),a.mul(e,e)),1),a.switch(d,a.add(a.add(a.add(a.mul(e,e),e),e),1),0)),f=a.sub(f,g),"triangle"===b&&(f=a.add(a.mul(l,f),a.mul(a.sub(1,l),c.out)),c.in(f))):f=a.sub(f,d);return f}},{"genish.js":39}],144:[function(h,p,w){var a=h("genish.js"),l=h("../ugen.js")();p.exports=function(b){a.wavetable=function(c,g){var f={immutable:!0};void 0!==g.name&&(f.global=g.name);g=a.data(g.buffer,
1,f);return a.peek(g,a.phasor(c,0,{min:0}))};return function(c){var g=Object.create(l);c=Object.assign({},b.oscillators.defaults,c);var f=a.wavetable(a.in("frequency"),c);f=a.mul(f,a.in("gain"));b.factory(g,f,"wavetable",c);return g}}},{"../ugen.js":149,"genish.js":39}],145:[function(h,p,w){var a=null;h={phase:0,queue:new (h("../external/priorityqueue.js"))(function(b,c){return b.time===c.time?b.priority<c.priority?-1:b.priority>c.priority?1:0:b.time-c.time}),init:function(b){a=b},clear:function(){this.queue.data.length=
0;this.phase=this.queue.length=0},add:function(b,c,g){b+=this.phase;this.queue.push({time:b,func:c,priority:void 0===g?0:g})},tick:function(b){if(this.shouldSync===(void 0===b?!1:b)){if(this.queue.length)for(b=this.queue.peek(),isNaN(b.time)&&this.queue.pop();this.phase>=b.time&&(b.func(b.priority),this.queue.pop(),b=this.queue.peek(),void 0!==b););this.phase++}return this.phase},advance:function(b){this.phase+=b;this.tick(!0)}};var l=!1;Object.defineProperty(h,"shouldSync",{get:function(){return l},
set:function(b){l=b;"worklet"===a.mode&&a.worklet.port.postMessage({address:"eval",code:"Gibberish.scheduler.shouldSync = "+b})}});p.exports=h},{"../external/priorityqueue.js":89}],146:[function(h,p,w){h("genish.js");var a=h("../workletProxy.js"),l=h("../ugen.js")();p.exports=function(b){var c=Object.create(l),g=a(b);Object.assign(c,{start:function(d){var e=this;d=void 0===d?0:d;0!==d?b.scheduler.add(d,function(){b.analyzers.push(e);b.dirty(b.analyzers)}):(b.analyzers.push(this),b.dirty(b.analyzers));return this},
stop:function(d){var e=this;d=void 0===d?0:d;var k=b.analyzers.indexOf(this);0===d?(-1<k&&(b.analyzers.splice(k,1),b.dirty(b.analyzers)),this.nextTime=this.phase=0):b.scheduler.add(d,function(){-1<k&&(b.analyzers.splice(k,1),b.dirty(b.analyzers));e.phase=0;e.nextTime=0});return this},fire:function(){var d="function"===typeof this.values?this.values:this.values[this.__valuesPhase++%this.values.length];if("function"===typeof d&&void 0===this.target)d();else if("function"===typeof this.target[this.key]){if("function"===
typeof d&&(d=d()),d!==this.DNR)this.target[this.key](d)}else"function"===typeof d&&(d=d()),d!==this.DNR&&(this.target[this.key]=d)}});var f={create:function(d){var e=Object.create(c);d=Object.assign({},f.defaults,d);e.phase=0;e.inputNames=["rate","density"];e.inputs=[1,1];e.nextTime=0;e.__valuesPhase=0;e.__timingsPhase=0;e.id=b.factory.getUID();e.dirty=!0;e.type="seq";e.__addresses__={};e.DNR=-987654321;d.id=b.factory.getUID();Object.assign(e,d);e.__properties__=d;null===e.timings&&(e.nextTime=Infinity);
e.callback=function(t,y){for(;e.phase>=e.nextTime;){var v="function"===typeof e.values?e.values:e.values[e.__valuesPhase++%e.values.length],r=!0,u=null;null!==e.timings&&void 0!==e.timings&&(u="function"===typeof e.timings?e.timings:e.timings[e.__timingsPhase++%e.timings.length],"function"===typeof u&&(u=u()));var x=1>=y?!1:!0;null!==u&&"object"===typeof u?(r=1===u.shouldExecute?!0:!1,u=u.time):null!==u&&Math.random()>=y&&(r=!1);if(r)if(void 0!==e.mainthreadonly)"function"===typeof v&&(v=v()),b.processor.messages.push(e.mainthreadonly,
e.key,v);else if("function"===typeof v&&void 0===e.target)v();else if("function"===typeof e.target[e.key]){if("function"===typeof v&&(v=v()),v!==e.DNR)e.target[e.key](v)}else"function"===typeof v&&(v=v()),v!==e.DNR&&(e.target[e.key]=v);if(null===u)return;e.phase-=e.nextTime;x&&(u=Math.random()>2-y?u/2:u);e.nextTime=u}e.phase+=t;return 0};e.ugenName=e.callback.ugenName="seq_"+e.id;var k=b.memory.alloc(1);b.memory.heap[k]=e.rate;e.__addresses__.rate=k;var m=e.rate;Object.defineProperty(e,"rate",{get:function(){return m},
set:function(t){m!==t&&("number"===typeof t&&(b.memory.heap[k]=t),b.dirty(b.analyzers),m=t)}});var n=b.memory.alloc(1);b.memory.heap[n]=e.density;e.__addresses__.density=n;var q=e.density;Object.defineProperty(e,"density",{get:function(){return q},set:function(t){q!==t&&("number"===typeof t&&(b.memory.heap[n]=t),b.dirty(b.analyzers),q=t)}});"worklet"===b.mode&&b.utilities.createPubSub(e);return g(["Sequencer2"],d,e)},defaults:{rate:1,density:1,priority:0,phase:0}};f.create.DO_NOT_OUTPUT=-987654321;
return f.create}},{"../ugen.js":149,"../workletProxy.js":151,"genish.js":39}],147:[function(h,p,w){var a=h("../workletProxy.js");p.exports=function(l){var b=a(l);var Sequencer=function(g){var f,d={type:"seq",__isRunning:!1,__valuesPhase:0,__timingsPhase:0,__onlyRunsOnce:!1,__repeatCount:null,DNR:-987654321,tick:function(e){e="function"===typeof d.values?d.values:d.values[d.__valuesPhase++%d.values.length];var k="function"===typeof d.timings?d.timings:null!==d.timings?d.timings[d.__timingsPhase++%
d.timings.length]:null,m=!0;!0===d.__onlyRunsOnce?d.__valuesPhase===d.values.length&&d.stop():null!==d.__repeatCount&&0===d.__valuesPhase%d.values.length&&(d.__repeatCount--,0===d.__repeatCount&&(d.stop(),d.__repeatCount=null));"function"===typeof k&&(k=k());null!==k?("object"===typeof k&&(m=1===k.shouldExecute?!0:!1,k=k.time),k*=d.rate):m=!1;if(m){if(void 0!==d.mainthreadonly)"function"===typeof e&&(e=e()),l.processor.messages.push(d.mainthreadonly,d.key,e);else if("function"===typeof e&&void 0===
d.target)e();else if("function"===typeof d.target[d.key]){if("function"===typeof e&&(e=e()),e!==d.DNR)d.target[d.key](e)}else"function"===typeof e&&(e=e()),e!==d.DNR&&(d.target[d.key]=e);!0===d.reportOutput&&l.processor.port.postMessage({address:"__sequencer",id:d.id,name:"output",value:e,phase:d.__valuesPhase,length:d.values.length})}"processor"===l.mode&&(!0!==d.__isRunning||isNaN(k)||!1!==d.autotrig||l.scheduler.add(k,d.tick,d.priority))},fire:function(){var e="function"===typeof this.values?this.values:
this.values[this.__valuesPhase++%this.values.length];if("function"===typeof e&&void 0===this.target)e();else if("function"===typeof this.target[this.key]){if("function"===typeof e&&(e=e()),e!==this.DNR)this.target[this.key](e)}else"function"===typeof e&&(e=e()),e!==this.DNR&&(this.target[this.key]=e)},start:function(e){e=void 0===e?0:e;"processor"===l.mode&&!1===d.__isRunning&&l.scheduler.add(e,function(k){d.tick(k);l.processor.port.postMessage({address:"__sequencer",id:d.id,name:"start"})},d.priority);
d.__isRunning=!0;d.__delay=e;return f},stop:function(e){e=void 0===e?null:e;null===e?(d.__isRunning=!1,"processor"===l.mode&&l.processor.port.postMessage({address:"__sequencer",id:d.id,name:"stop"})):l.scheduler.add(e,d.stop);return f},once:function(){d.__onlyRunsOnce=!0;return f},repeat:function(e){d.__repeatCount=void 0===e?2:e;return f}};g.id=l.factory.getUID();"worklet"===l.mode&&l.utilities.createPubSub(d);g=Object.assign({},Sequencer.defaults,g);Object.assign(d,g);d.__properties__=g;return f=b(["Sequencer"],
g,d)};Sequencer.defaults={priority:1E5,rate:1,reportOutput:!1,autotrig:!1};Sequencer.make=function(g,f,d,e,k,m){return Sequencer({values:g,timings:f,target:d,key:e,priority:k,reportOutput:m})};Sequencer.DO_NOT_OUTPUT=-987654321;return Sequencer}},{"../workletProxy.js":151}],149:[function(h,p,w){var a=null;p.exports=function(l){void 0!==l&&null==a&&(a=l);return{__GB:a,free:function(){a.genish.gen.free(this.graph)},print:function(){console.log(this.callback.toString())},connect:function(b,c){c=void 0===c?1:c;void 0===this.connected&&
(this.connected=[]);if(void 0===b||null===b)b=a.output;if("function"==typeof b.__addInput)b.__addInput(this);else if(b.sum&&b.sum.inputs)b.sum.inputs.push(this);else if(b.inputs){var g=b.inputs.indexOf(this);-1===g?b.inputs.unshift(this,c,this.isStereo):b.inputs[g+1]=c}else b.input=this,b.inputGain=c;a.dirty(b);this.connected.push([b,this,c]);return this},disconnect:function(b){if(void 0===b){if(Array.isArray(this.connected)){for(var c=$jscomp.makeIterator(this.connected),g=c.next();!g.done;g=c.next())g=
g.value,void 0!==g[0].disconnectUgen?g[0].disconnectUgen(g[1]):g[0].input===this&&(g[0].input=0);this.connected.length=0}}else c=this.connected.find(function(f){return f[0]===b}),void 0!==b.disconnectUgen?void 0!==c&&b.disconnectUgen(c[1]):b.input=0,c=this.connected.indexOf(c),-1!==c&&this.connected.splice(c,1)},chain:function(b,c){this.connect(b,void 0===c?1:c);return b},__redoGraph:function(){var b=this.isStereo;this.__createGraph();this.callback=a.genish.gen.createCallback(this.graph,a.memory,
!1,!0);this.inputNames=new Set(a.genish.gen.parameters);this.callback.ugenName=this.ugenName;a.dirty(this);if(b!==this.isStereo&&void 0!==this.connected){b=$jscomp.makeIterator(this.connected);for(var c=b.next();!c.done;c=b.next())if(c=c.value,a.dirty(c[0]),void 0!==c[0].inputs){var g=c[0].inputs.indexOf(c[1]);-1!==g&&(c[0].inputs[g+2]=this.isStereo)}else void 0!==c[0].input&&void 0!==c[0].__redoGraph&&c[0].__redoGraph()}}}}},{}],150:[function(h,p,w){var a=h("genish.js"),l=h("./external/audioworklet-polyfill.js");
p.exports=function(b){var c=0,g={Make:function(f){var d=f.name||"Ugen"+Math.floor(1E4*Math.random());f="\\nconst ugen = Object.create( Gibberish.prototypes[ '"+(f.type||"Ugen")+"' ] )\\nconst graphfnc = "+f.constructor.toString()+"\\n\\nconst proxy = Gibberish.factory( ugen, graphfnc(), '"+d+"', "+JSON.stringify(f.properties||{})+" )\\nif( typeof props === 'object' ) Object.assign( proxy, props )\\n\\nreturn proxy";b[d]=new Function("props",f);b.worklet.port.postMessage({name:d,address:"addConstructor",constructorString:"function( Gibberish ) {\\nconst fnc = "+
b[d].toString()+"\\n\\nreturn fnc\\n}"});return b[d]},createContext:function(f,d,e,k){var m=this,n="undefined"===typeof AudioContext?webkitAudioContext:AudioContext;l(window,void 0===k?2048:k);var q=function(){if("undefined"!==typeof n){m.ctx=b.ctx=void 0===f?new n(Gibberish.audioContextOptions):f;a.gen.samplerate=m.ctx.sampleRate;a.utilities.ctx=m.ctx;document&&document.documentElement&&"ontouchstart"in document.documentElement?window.removeEventListener("touchstart",q):(window.removeEventListener("mousedown",
q),window.removeEventListener("keydown",q));var t=g.ctx.createBufferSource();t.connect(g.ctx.destination);t.start()}"function"===typeof d&&d(e)};document&&document.documentElement&&"ontouchstart"in document.documentElement?window.addEventListener("touchstart",q):(window.addEventListener("mousedown",q),window.addEventListener("keydown",q));return b.ctx},createWorklet:function(f){b.ctx.audioWorklet.addModule(b.workletPath).then(function(){b.worklet=new AudioWorkletNode(b.ctx,"gibberish",Gibberish.audioWorkletNodeOptions);
b.worklet.connect(b.ctx.destination);b.worklet.port.onmessage=function(d){var e=b.utilities.workletHandlers[d.data.address];"function"===typeof e&&e(d)};b.worklet.ugens=new Map;f()})},future:function(f,d,e){var k=Object.keys(e);f="\\nconst fnc = "+f.toString()+"\\nconst args = ["+k.map(function(m){return"object"===typeof e[m]?e[m].id:"'"+e[m]+"'"}).join(",")+"]\\nconst objs = args.map( v => typeof v === 'number' ? Gibberish.processor.ugens.get(v) : v )\\nGB.scheduler.add( "+d+", ()=> fnc( ...objs ), 1 )\\n";
b.worklet.port.postMessage({address:"eval",code:f})},workletHandlers:{phase:function(f){b.phase=f.data.value;if("function"===typeof b.onphaseupdate)b.onphaseupdate(b.phase)},__sequencer:function(f){f=f.data;var d=f.name,e=b.worklet.ugens.get(f.id);void 0!==e&&void 0!==e.publish&&e.publish(d,f)},callback:function(f){if("function"===typeof b.oncallback)b.oncallback(f.data.code)},get:function(f){f=f.data.name;if("Gibberish"===f[0]){var d=b;f.shift()}for(var e=$jscomp.makeIterator(f),k=e.next();!k.done;k=e.next())d=
d[k.value];b.worklet.port.postMessage({address:"set",name:"Gibberish."+f.join("."),value:d})},state:function(f){f=f.data.messages;if(0!==f.length){b.preventProxy=!0;b.proxyEnabled=!1;for(var d=0;d<f.length;){var e=f[d],k=f[d+1],m=f[d+2],n=f[d+3],q=m,t=b.worklet.ugens.get(e);!0===b.worklet.debug&&"output"!==k&&console.log(k,q,e);if("string"===typeof k){if(void 0!==t&&-1===k.indexOf(".")&&"id"!==k)if(void 0!==t[k])if("function"!==typeof t[k])t[k]="output"===k?[m,n]:q;else t[k](q);else t[k]=q;else if(void 0!==
t&&(e=k.split("."),void 0!==t[e[0]]))if("function"!==typeof t[e[0]][e[1]])t[e[0]][e[1]]=q;else t[e[0]][e[1]](q);d+="output"===k?4:3}}b.preventProxy=!1;b.proxyEnabled=!0}}},createPubSub:function(f){var d={};f.on=function(e,k){"undefined"===typeof d[e]&&(d[e]=[]);d[e].push(k);return f};f.off=function(e,k){"undefined"!==typeof d[e]&&(e=d[e],e.splice(e.indexOf(k),1));return f};f.publish=function(e,k){"undefined"!==typeof d[e]&&d[e].forEach(function(m){return m(k)});return f}},wrap:function(f,d){for(var e=
[],k=1;k<arguments.length;++k)e[k-1]=arguments[k];return{action:"wrap",value:f,args:e.map(function(m){return{id:m.id}})}},export:function(f){f.wrap=this.wrap;f.future=this.future;f.Make=this.Make},getUID:function(){return c++}};return g}},{"./external/audioworklet-polyfill.js":27,"genish.js":39}],151:[function(h,p,w){var a=h("serialize-javascript");p.exports=function(l){var b=function(f,d){d=void 0===d?!0:d;return"object"===typeof f&&null!==f&&void 0!==f.id?"seq"!==f.__type?{id:f.id,prop:f.prop}:
a(f):"function"===typeof f&&!0===d?{isFunc:!0,value:a(f)}:f},c=function(f,d,e){var k={},m;for(m in d)if("object"===typeof d[m]&&null!==d[m]&&void 0!==d[m].__meta__||"function"===typeof d[m]&&void 0!==d[m].__meta__)k[m]={id:d[m].__meta__.id};else if(Array.isArray(d[m])){for(var n=[],q=0;q<d[m].length;q++)n[q]=b(d[m][q],!1);k[m]=n}else k[m]="object"===typeof d[m]&&null!==d[m]?b(d[m],!1):d[m];d=a(k);Array.isArray(f)?(k=f[f.length-1],f[f.length-1]=k[0].toUpperCase()+k.substring(1)):f=[f[0].toUpperCase()+
f.substring(1)];e.__meta__={address:"add",name:f,properties:d,id:e.id};l.worklet.ugens.set(e.id,e);l.worklet.port.postMessage(e.__meta__)},g="connected input wrap callback inputNames on off publish".split(" ");return function(f,d,e){return"worklet"===l.mode&&!1===l.preventProxy?(c(f,d,e),new Proxy(e,{get:function(k,m,n){return"function"===typeof k[m]&&-1===m.indexOf("__")&&-1===g.indexOf(m)?new Proxy(k[m],{apply:function(q,t,y){if(!0===l.proxyEnabled){var v=y.map(function(r){return b(r,!0)});l.worklet.port.postMessage({address:"method",
object:e.id,name:m,args:v})}v=l.proxyEnabled;l.proxyEnabled=!1;q=q.apply(t,y);l.proxyEnabled=v;return q}}):k[m]},set:function(k,m,n,q){-1===g.indexOf(m)&&!0===l.proxyEnabled&&(q=b(n),void 0!==q&&l.worklet.port.postMessage({address:"set",object:e.id,name:m,value:q}));k[m]=n;return!0}})):"processor"===l.mode&&!1===l.preventProxy?new Proxy(e,{set:function(k,m,n,q){q=typeof n;-1===m.indexOf("__")&&"function"!==q&&"object"!==q&&void 0!==l.processor&&l.processor.messages.push(e.id,m,n);k[m]=n;return!0}}):
e}}},{"serialize-javascript":166}],153:[function(h,p,w){},{}],154:[function(h,p,w){function a(){this._events&&Object.prototype.hasOwnProperty.call(this,"_events")||(this._events=n(null),this._eventsCount=0);this._maxListeners=this._maxListeners||void 0}function l(r,u,x,z){var A;if("function"!==typeof x)throw new TypeError('"listener" argument must be a function');if(A=r._events){A.newListener&&(r.emit("newListener",u,x.listener?x.listener:x),A=r._events);var B=A[u]}else A=r._events=n(null),r._eventsCount=
0;B?("function"===typeof B?B=A[u]=z?[x,B]:[B,x]:z?B.unshift(x):B.push(x),B.warned||(x=void 0===r._maxListeners?a.defaultMaxListeners:r._maxListeners)&&0<x&&B.length>x&&(B.warned=!0,x=Error("Possible EventEmitter memory leak detected. "+B.length+' "'+String(u)+'" listeners added. Use emitter.setMaxListeners() to increase limit.'),x.name="MaxListenersExceededWarning",x.emitter=r,x.type=u,x.count=B.length,"object"===typeof console&&console.warn&&console.warn("%s: %s",x.name,x.message))):(A[u]=x,++r._eventsCount);
return r}function b(){if(!this.fired)switch(this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length){case 0:return this.listener.call(this.target);case 1:return this.listener.call(this.target,arguments[0]);case 2:return this.listener.call(this.target,arguments[0],arguments[1]);case 3:return this.listener.call(this.target,arguments[0],arguments[1],arguments[2]);default:for(var r=Array(arguments.length),u=0;u<r.length;++u)r[u]=arguments[u];this.listener.apply(this.target,r)}}
function c(r,u,x){r={fired:!1,wrapFn:void 0,target:r,type:u,listener:x};u=t.call(b,r);u.listener=x;return r.wrapFn=u}function g(r,u,x){r=r._events;if(!r)return[];u=r[u];if(!u)return[];if("function"===typeof u)return x?[u.listener||u]:[u];if(x)for(x=Array(u.length),r=0;r<x.length;++r)x[r]=u[r].listener||u[r];else x=d(u,u.length);return x}function f(r){var u=this._events;if(u){r=u[r];if("function"===typeof r)return 1;if(r)return r.length}return 0}function d(r,u){for(var x=Array(u),z=0;z<u;++z)x[z]=
r[z];return x}function e(r){var u=function(){};u.prototype=r;return new u}function k(r){var u=[],x;for(x in r)Object.prototype.hasOwnProperty.call(r,x)&&u.push(x);return x}function m(r){var u=this;return function(){return u.apply(r,arguments)}}var n=Object.create||e,q=Object.keys||k,t=Function.prototype.bind||m;p.exports=a;a.EventEmitter=a;a.prototype._events=void 0;a.prototype._maxListeners=void 0;var y=10;try{h={};Object.defineProperty&&Object.defineProperty(h,"x",{value:0});var v=0===h.x}catch(r){v=
!1}v?Object.defineProperty(a,"defaultMaxListeners",{enumerable:!0,get:function(){return y},set:function(r){if("number"!==typeof r||0>r||r!==r)throw new TypeError('"defaultMaxListeners" must be a positive number');y=r}}):a.defaultMaxListeners=y;a.prototype.setMaxListeners=function(r){if("number"!==typeof r||0>r||isNaN(r))throw new TypeError('"n" argument must be a positive number');this._maxListeners=r;return this};a.prototype.getMaxListeners=function(){return void 0===this._maxListeners?a.defaultMaxListeners:
this._maxListeners};a.prototype.emit=function(r){var u,x,z;var A="error"===r;if(z=this._events)A=A&&null==z.error;else if(!A)return!1;if(A){1<arguments.length&&(u=arguments[1]);if(u instanceof Error)throw u;z=Error('Unhandled "error" event. ('+u+")");z.context=u;throw z;}u=z[r];if(!u)return!1;z="function"===typeof u;var B=arguments.length;switch(B){case 1:if(z)u.call(this);else for(z=u.length,u=d(u,z),A=0;A<z;++A)u[A].call(this);break;case 2:A=arguments[1];if(z)u.call(this,A);else for(z=u.length,
u=d(u,z),B=0;B<z;++B)u[B].call(this,A);break;case 3:A=arguments[1];B=arguments[2];if(z)u.call(this,A,B);else for(z=u.length,u=d(u,z),x=0;x<z;++x)u[x].call(this,A,B);break;case 4:A=arguments[1];B=arguments[2];x=arguments[3];if(z)u.call(this,A,B,x);else{z=u.length;u=d(u,z);for(var C=0;C<z;++C)u[C].call(this,A,B,x)}break;default:A=Array(B-1);for(x=1;x<B;x++)A[x-1]=arguments[x];if(z)u.apply(this,A);else for(z=u.length,u=d(u,z),B=0;B<z;++B)u[B].apply(this,A)}return!0};a.prototype.addListener=function(r,
u){return l(this,r,u,!1)};a.prototype.on=a.prototype.addListener;a.prototype.prependListener=function(r,u){return l(this,r,u,!0)};a.prototype.once=function(r,u){if("function"!==typeof u)throw new TypeError('"listener" argument must be a function');this.on(r,c(this,r,u));return this};a.prototype.prependOnceListener=function(r,u){if("function"!==typeof u)throw new TypeError('"listener" argument must be a function');this.prependListener(r,c(this,r,u));return this};a.prototype.removeListener=function(r,
u){var x;if("function"!==typeof u)throw new TypeError('"listener" argument must be a function');var z=this._events;if(!z)return this;var A=z[r];if(!A)return this;if(A===u||A.listener===u)0===--this._eventsCount?this._events=n(null):(delete z[r],z.removeListener&&this.emit("removeListener",r,A.listener||u));else if("function"!==typeof A){var B=-1;for(x=A.length-1;0<=x;x--)if(A[x]===u||A[x].listener===u){var C=A[x].listener;B=x;break}if(0>B)return this;if(0===B)A.shift();else{x=B+1;for(var D=A.length;x<
D;B+=1,x+=1)A[B]=A[x];A.pop()}1===A.length&&(z[r]=A[0]);z.removeListener&&this.emit("removeListener",r,C||u)}return this};a.prototype.removeAllListeners=function(r){var u=this._events;if(!u)return this;if(!u.removeListener)return 0===arguments.length?(this._events=n(null),this._eventsCount=0):u[r]&&(0===--this._eventsCount?this._events=n(null):delete u[r]),this;if(0===arguments.length){var x=q(u);for(u=0;u<x.length;++u){var z=x[u];"removeListener"!==z&&this.removeAllListeners(z)}this.removeAllListeners("removeListener");
this._events=n(null);this._eventsCount=0;return this}x=u[r];if("function"===typeof x)this.removeListener(r,x);else if(x)for(u=x.length-1;0<=u;u--)this.removeListener(r,x[u]);return this};a.prototype.listeners=function(r){return g(this,r,!0)};a.prototype.rawListeners=function(r){return g(this,r,!1)};a.listenerCount=function(r,u){return"function"===typeof r.listenerCount?r.listenerCount(u):f.call(r,u)};a.prototype.listenerCount=f;a.prototype.eventNames=function(){return 0<this._eventsCount?Reflect.ownKeys(this._events):
[]}},{}],156:[function(h,p,w){p.exports={create:function(){var a=0>=arguments.length||void 0===arguments[0]?4096:arguments[0],l=1>=arguments.length||void 0===arguments[1]?Float32Array:arguments[1],b=Object.create(this);Object.assign(b,{heap:new l(a),list:{},freeList:{}});return b},alloc:function(a){var l=-1;if(a>this.heap.length)throw Error("Allocation request is larger than heap size of "+this.heap.length);for(var b in this.freeList){var c=this.freeList[b];if(c>=a){l=b;this.list[l]=a;if(c!==a){b=
l+a;for(var g in this.list)g>b&&(c=g-b,this.freeList[b]=c)}break}}-1!==l&&delete this.freeList[l];-1===l&&(l=Object.keys(this.list),l.length?(l=parseInt(l[l.length-1]),l+=this.list[l]):l=0,this.list[l]=a);if(l+a>=this.heap.length)throw Error("No available blocks remain sufficient for allocation request.");return l},free:function(a){if("number"!==typeof this.list[a])throw Error("Calling free() on non-existing block.");var l=this.list[a]=0,b;for(b in this.list)if(b>a){l=b-a;break}this.freeList[a]=l}}},
{}],157:[function(h,p,w){function a(){throw Error("setTimeout has not been defined");}function l(){throw Error("clearTimeout has not been defined");}function b(v){if(k===setTimeout)return setTimeout(v,0);if((k===a||!k)&&setTimeout)return k=setTimeout,setTimeout(v,0);try{return k(v,0)}catch(r){try{return k.call(null,v,0)}catch(u){return k.call(this,v,0)}}}function c(v){if(m===clearTimeout)return clearTimeout(v);if((m===l||!m)&&clearTimeout)return m=clearTimeout,clearTimeout(v);try{return m(v)}catch(r){try{return m.call(null,
v)}catch(u){return m.call(this,v)}}}function g(){q&&t&&(q=!1,t.length?n=t.concat(n):y=-1,n.length&&f())}function f(){if(!q){var v=b(g);q=!0;for(var r=n.length;r;){t=n;for(n=[];++y<r;)t&&t[y].run();y=-1;r=n.length}t=null;q=!1;c(v)}}function d(v,r){this.fun=v;this.array=r}function e(){}h=p.exports={};try{var k="function"===typeof setTimeout?setTimeout:a}catch(v){k=a}try{var m="function"===typeof clearTimeout?clearTimeout:l}catch(v){m=l}var n=[],q=!1,t,y=-1;h.nextTick=function(v){var r=Array(arguments.length-
1);if(1<arguments.length)for(var u=1;u<arguments.length;u++)r[u-1]=arguments[u];n.push(new d(v,r));1!==n.length||q||b(f)};d.prototype.run=function(){this.fun.apply(null,this.array)};h.title="browser";h.browser=!0;h.env={};h.argv=[];h.version="";h.versions={};h.on=e;h.addListener=e;h.once=e;h.off=e;h.removeListener=e;h.removeAllListeners=e;h.emit=e;h.prependListener=e;h.prependOnceListener=e;h.listeners=function(v){return[]};h.binding=function(v){throw Error("process.binding is not supported");};h.cwd=
function(){return"/"};h.chdir=function(v){throw Error("process.chdir is not supported");};h.umask=function(){return 0}},{}],158:[function(h,p,w){w=h("./lib/alea");var a=h("./lib/xor128"),l=h("./lib/xorwow"),b=h("./lib/xorshift7"),c=h("./lib/xor4096"),g=h("./lib/tychei");h=h("./seedrandom");h.alea=w;h.xor128=a;h.xorwow=l;h.xorshift7=b;h.xor4096=c;h.tychei=g;p.exports=h},{"./lib/alea":159,"./lib/tychei":160,"./lib/xor128":161,"./lib/xor4096":162,"./lib/xorshift7":163,"./lib/xorwow":164,"./seedrandom":165}],
159:[function(h,p,w){(function(a,l,b){function c(e){var k=this,m=d();k.next=function(){var n=2091639*k.s0+2.3283064365386963E-10*k.c;k.s0=k.s1;k.s1=k.s2;return k.s2=n-(k.c=n|0)};k.c=1;k.s0=m(" ");k.s1=m(" ");k.s2=m(" ");k.s0-=m(e);0>k.s0&&(k.s0+=1);k.s1-=m(e);0>k.s1&&(k.s1+=1);k.s2-=m(e);0>k.s2&&(k.s2+=1);m=null}function g(e,k){k.c=e.c;k.s0=e.s0;k.s1=e.s1;k.s2=e.s2;return k}function f(e,k){var m=new c(e);e=k&&k.state;var n=m.next;n.int32=function(){return 4294967296*m.next()|0};n.double=function(){return n()+
1.1102230246251565E-16*(2097152*n()|0)};n.quick=n;e&&("object"==typeof e&&g(e,m),n.state=function(){return g(m,{})});return n}function d(){var e=4022871197;return function(k){k=String(k);for(var m=0;m<k.length;m++){e+=k.charCodeAt(m);var n=.02519603282416938*e;e=n>>>0;n-=e;n*=e;e=n>>>0;n-=e;e+=4294967296*n}return 2.3283064365386963E-10*(e>>>0)}}l&&l.exports?l.exports=f:b&&b.amd?b(function(){return f}):this.alea=f})(this,"object"==typeof p&&p,!1)},{}],160:[function(h,p,w){(function(a,l,b){function c(d){var e=
this,k="";e.next=function(){var m=e.b,n=e.c,q=e.d,t=e.a;m=m<<25^m>>>7^n;n=n-q|0;q=q<<24^q>>>8^t;t=t-m|0;e.b=m=m<<20^m>>>12^n;e.c=n=n-q|0;e.d=q<<16^n>>>16^t;return e.a=t-m|0};e.a=0;e.b=0;e.c=-1640531527;e.d=1367130551;d===Math.floor(d)?(e.a=d/4294967296|0,e.b=d|0):k+=d;for(d=0;d<k.length+20;d++)e.b^=k.charCodeAt(d)|0,e.next()}function g(d,e){e.a=d.a;e.b=d.b;e.c=d.c;e.d=d.d;return e}function f(d,e){var k=new c(d);d=e&&e.state;e=function(){return(k.next()>>>0)/4294967296};e.double=function(){do{var m=
k.next()>>>11,n=(k.next()>>>0)/4294967296;m=(m+n)/2097152}while(0===m);return m};e.int32=k.next;e.quick=e;d&&("object"==typeof d&&g(d,k),e.state=function(){return g(k,{})});return e}l&&l.exports?l.exports=f:b&&b.amd?b(function(){return f}):this.tychei=f})(this,"object"==typeof p&&p,!1)},{}],161:[function(h,p,w){(function(a,l,b){function c(d){var e=this,k="";e.x=0;e.y=0;e.z=0;e.w=0;e.next=function(){var m=e.x^e.x<<11;e.x=e.y;e.y=e.z;e.z=e.w;return e.w=e.w^e.w>>>19^m^m>>>8};d===(d|0)?e.x=d:k+=d;for(d=
0;d<k.length+64;d++)e.x^=k.charCodeAt(d)|0,e.next()}function g(d,e){e.x=d.x;e.y=d.y;e.z=d.z;e.w=d.w;return e}function f(d,e){var k=new c(d);d=e&&e.state;e=function(){return(k.next()>>>0)/4294967296};e.double=function(){do{var m=k.next()>>>11,n=(k.next()>>>0)/4294967296;m=(m+n)/2097152}while(0===m);return m};e.int32=k.next;e.quick=e;d&&("object"==typeof d&&g(d,k),e.state=function(){return g(k,{})});return e}l&&l.exports?l.exports=f:b&&b.amd?b(function(){return f}):this.xor128=f})(this,"object"==typeof p&&
p,!1)},{}],162:[function(h,p,w){(function(a,l,b){function c(d){var e=this;e.next=function(){var k=e.w,m=e.X,n=e.i;e.w=k=k+1640531527|0;var q=m[n+34&127];var t=m[n=n+1&127];q^=q<<13;t^=t<<17;q=m[n]=q^q>>>15^t^t>>>12;e.i=n;return q+(k^k>>>16)|0};(function(k,m){var n,q,t=[],y=128;if(m===(m|0)){var v=m;m=null}else m+="\\x00",v=0,y=Math.max(y,m.length);var r=0;for(n=-32;n<y;++n)if(m&&(v^=m.charCodeAt((n+32)%m.length)),0===n&&(q=v),v^=v<<10,v^=v>>>15,v^=v<<4,v^=v>>>13,0<=n){q=q+1640531527|0;var u=t[n&127]^=
v+q;r=0==u?r+1:0}128<=r&&(t[(m&&m.length||0)&127]=-1);r=127;for(n=512;0<n;--n)v=t[r+34&127],u=t[r=r+1&127],v^=v<<13,u^=u<<17,v^=v>>>15,u^=u>>>12,t[r]=v^u;k.w=q;k.X=t;k.i=r})(e,d)}function g(d,e){e.i=d.i;e.w=d.w;e.X=d.X.slice();return e}function f(d,e){null==d&&(d=+new Date);var k=new c(d);d=e&&e.state;e=function(){return(k.next()>>>0)/4294967296};e.double=function(){do{var m=k.next()>>>11,n=(k.next()>>>0)/4294967296;m=(m+n)/2097152}while(0===m);return m};e.int32=k.next;e.quick=e;d&&(d.X&&g(d,k),e.state=
function(){return g(k,{})});return e}l&&l.exports?l.exports=f:b&&b.amd?b(function(){return f}):this.xor4096=f})(this,"object"==typeof p&&p,!1)},{}],163:[function(h,p,w){(function(a,l,b){function c(d){var e=this;e.next=function(){var k=e.x,m=e.i;var n=k[m];n^=n>>>7;var q=n^n<<24;n=k[m+1&7];q^=n^n>>>10;n=k[m+3&7];q^=n^n>>>3;n=k[m+4&7];q^=n^n<<7;n=k[m+7&7];n^=n<<13;q^=n^n<<9;k[m]=q;e.i=m+1&7;return q};(function(k,m){var n,q=[];if(m===(m|0))q[0]=m;else for(m=""+m,n=0;n<m.length;++n)q[n&7]=q[n&7]<<15^
m.charCodeAt(n)+q[n+1&7]<<13;for(;8>q.length;)q.push(0);for(n=0;8>n&&0===q[n];++n)8==n&&(q[7]=-1);k.x=q;k.i=0;for(n=256;0<n;--n)k.next()})(e,d)}function g(d,e){e.x=d.x.slice();e.i=d.i;return e}function f(d,e){null==d&&(d=+new Date);var k=new c(d);d=e&&e.state;e=function(){return(k.next()>>>0)/4294967296};e.double=function(){do{var m=k.next()>>>11,n=(k.next()>>>0)/4294967296;m=(m+n)/2097152}while(0===m);return m};e.int32=k.next;e.quick=e;d&&(d.x&&g(d,k),e.state=function(){return g(k,{})});return e}
l&&l.exports?l.exports=f:b&&b.amd?b(function(){return f}):this.xorshift7=f})(this,"object"==typeof p&&p,!1)},{}],164:[function(h,p,w){(function(a,l,b){function c(d){var e=this,k="";e.next=function(){var m=e.x^e.x>>>2;e.x=e.y;e.y=e.z;e.z=e.w;e.w=e.v;return(e.d=e.d+362437|0)+(e.v=e.v^e.v<<4^m^m<<1)|0};e.x=0;e.y=0;e.z=0;e.w=0;e.v=0;d===(d|0)?e.x=d:k+=d;for(d=0;d<k.length+64;d++)e.x^=k.charCodeAt(d)|0,d==k.length&&(e.d=e.x<<10^e.x>>>4),e.next()}function g(d,e){e.x=d.x;e.y=d.y;e.z=d.z;e.w=d.w;e.v=d.v;
e.d=d.d;return e}function f(d,e){var k=new c(d);d=e&&e.state;e=function(){return(k.next()>>>0)/4294967296};e.double=function(){do{var m=k.next()>>>11,n=(k.next()>>>0)/4294967296;m=(m+n)/2097152}while(0===m);return m};e.int32=k.next;e.quick=e;d&&("object"==typeof d&&g(d,k),e.state=function(){return g(k,{})});return e}l&&l.exports?l.exports=f:b&&b.amd?b(function(){return f}):this.xorwow=f})(this,"object"==typeof p&&p,!1)},{}],165:[function(h,p,w){(function(a,l,b){function c(v,r,u){var x=[];r=1==r?{entropy:!0}:
r||{};v=e(d(r.entropy?[v,m(l)]:null==v?k():v,3),x);var z=new g(x);x=function(){for(var A=z.g(6),B=n,C=0;A<q;)A=256*(A+C),B*=256,C=z.g(1);for(;A>=t;)A/=2,B/=2,C>>>=1;return(A+C)/B};x.int32=function(){return z.g(4)|0};x.quick=function(){return z.g(4)/4294967296};x.double=x;e(m(z.S),l);return(r.pass||u||function(A,B,C,D){D&&(D.S&&f(D,z),A.state=function(){return f(z,{})});return C?(b.random=A,B):A})(x,v,"global"in r?r.global:this==b,r.state)}function g(v){var r,u=v.length,x=this,z=0,A=x.i=x.j=0,B=x.S=
[];for(u||(v=[u++]);256>z;)B[z]=z++;for(z=0;256>z;z++)B[z]=B[A=255&A+v[z%u]+(r=B[z])],B[A]=r;(x.g=function(C){for(var D,E=0,F=x.i,G=x.j,H=x.S;C--;)D=H[F=255&F+1],E=256*E+H[255&(H[F]=H[G=255&G+D])+(H[G]=D)];x.i=F;x.j=G;return E})(256)}function f(v,r){r.i=v.i;r.j=v.j;r.S=v.S.slice();return r}function d(v,r){var u=[],x=typeof v,z;if(r&&"object"==x)for(z in v)try{u.push(d(v[z],r-1))}catch(A){}return u.length?u:"string"==x?v:v+"\\x00"}function e(v,r){v+="";for(var u,x=0;x<v.length;)r[255&x]=255&(u^=19*
r[255&x])+v.charCodeAt(x++);return m(r)}function k(){try{var v;y&&(v=y.randomBytes)?v=v(256):(v=new Uint8Array(256),(a.crypto||a.msCrypto).getRandomValues(v));return m(v)}catch(r){return v=a.navigator,[+new Date,a,v&&v.plugins,a.screen,m(l)]}}function m(v){return String.fromCharCode.apply(0,v)}var n=b.pow(256,6),q=b.pow(2,52),t=2*q;e(b.random(),l);if("object"==typeof p&&p.exports){p.exports=c;try{var y=h("crypto")}catch(v){}}else b.seedrandom=c})("undefined"!==typeof self?self:this,[],Math)},{crypto:153}],
166:[function(h,p,w){function a(m){return k[m]}var l=Math.floor(1099511627776*Math.random()).toString(16),b=new RegExp('"@__(F|R|D|M|S)-'+l+'-(\\\\d+)__@"',"g"),c=/\\{\\s*\\[native code\\]\\s*\\}/g,g=/function.*?\\(/,f=/.*?=>.*?/,d=/[<>\\/\\u2028\\u2029]/g,e=["*","async"],k={"<":"\\\\u003C",">":"\\\\u003E","/":"\\\\u002F","\\u2028":"\\\\u2028","\\u2029":"\\\\u2029"};p.exports=function t(n,q){function y(B,C){if(!C)return C;B=this[B];var D=typeof B;if("object"===D){if(B instanceof RegExp)return"@__R-"+l+"-"+(u.push(B)-1)+
"__@";if(B instanceof Date)return"@__D-"+l+"-"+(x.push(B)-1)+"__@";if(B instanceof Map)return"@__M-"+l+"-"+(z.push(B)-1)+"__@";if(B instanceof Set)return"@__S-"+l+"-"+(A.push(B)-1)+"__@"}return"function"===D?"@__F-"+l+"-"+(r.push(B)-1)+"__@":C}function v(B){var C=B.toString();if(c.test(C))throw new TypeError("Serializing native function: "+B.name);if(g.test(C)||f.test(C))return C;B=C.indexOf("(");var D=C.substr(0,B).trim().split(" ").filter(function(E){return 0<E.length});return 0<D.filter(function(E){return-1===
e.indexOf(E)}).length?(-1<D.indexOf("async")?"async ":"")+"function"+(-1<D.join("").indexOf("*")?"*":"")+C.substr(B):C}q||(q={});if("number"===typeof q||"string"===typeof q)q={space:q};var r=[],u=[],x=[],z=[],A=[];n=q.isJSON&&!q.space?JSON.stringify(n):JSON.stringify(n,q.isJSON?null:y,q.space);if("string"!==typeof n)return String(n);!0!==q.unsafe&&(n=n.replace(d,a));return 0===r.length&&0===u.length&&0===x.length&&0===z.length&&0===A.length?n:n.replace(b,function(B,C,D){return"D"===C?'new Date("'+
x[D].toISOString()+'")':"R"===C?u[D].toString():"M"===C?"new Map("+t(Array.from(z[D].entries()),q)+")":"S"===C?"new Set("+t(Array.from(A[D].values()),q)+")":v(r[D])})}},{}]},{},[114])(114)});
`;
})(this);

