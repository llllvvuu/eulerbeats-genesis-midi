var EB = require('./eulerbeats-node.js');
var MidiWriter = require('midi-writer-js');

const SEEDS = [
  '0x506060502', '0x434050703', '0x302020302',
  '0x511000303', '0x52a0a0603', '0x214080703',
  '0x535010503', '0x424050803', '0x021090900',
  '0x411000900', '0x3380a0903', '0x303060200',
  '0x214070301', '0x126080103', '0x205010700',
  '0x321080302', '0x31d030403', '0x422050b03',
  '0x507010200', '0x125050203', '0x106010503',
  '0x328040403', '0x01c0a0903', '0x425020b03',
  '0x224000903', '0x230080802', '0x532070401'
];

const MODES = [0, 2, 4, 5, 7, 9, 11];
const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

for (var i = 0; i < 27; i++) {
  const seed = SEEDS[i];

  const decodedSeed = EB.EulerBeats.decodeSeed(seed);
  const {gridLength, xOffset, yOffset, originalSeed} = decodedSeed;
  const randomSeed = parseInt(originalSeed, 16);
  const theme = EB.EulerBeats.audio.generateTheme(randomSeed, gridLength, xOffset, yOffset);
  const TICKS_PER_SECOND = 128 * theme.bpm / 60;

  function noteFromPitch(frequency) {
    var noteNum = 12 * (Math.log(frequency / 440)/Math.log(2));
    return Math.round(noteNum) + 69;
  }


  var tracks = [];
  var channel = 0;
  Object.keys(theme.tracks).forEach(function(trackName) {
    channel++;
    var trackData = theme.tracks[trackName];
    var track = new MidiWriter.Track();
    track.addTrackName(trackName);
    track.setTempo(theme.bpm);
    track.setTimeSignature(theme.pulses, 4);
    track.setKeySignature(KEYS[(theme.key - MODES[theme.mode - 1] + 24) % 12]);

    var percussionNote;
    if (trackData.instrument === 'Kick') {
      percussionNote = 'C2';
    } else if (trackData.instrument === 'Snare') {
      percussionNote = 'D2';
    } else if (trackData.instrument === 'Clave') {
      percussionNote = 'D#5';
    } else if (trackData.instrument === 'Hat') {
      percussionNote = 'F#2';
    } else if (trackData.instrument === 'Clap') {
      percussionNote = 'D#2';
    } else if (trackData.instrument === 'Synth') {
      track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 81}));
    } else if (trackData.instrument === 'PolySynth') {
      track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 91}));
    }

    var delay = trackData.start;

    var startTime = 0;
    for (var i = 0; i < trackData.repeats * (trackData.accents || trackData.values).length; i++) {
      if (startTime > trackData.duration) {
        break;
      }
      const timing = trackData.timings[i % trackData.timings.length];
      startTime += timing;
      if (trackData.accents) {
        // percussion
        const accent = trackData.accents[i % trackData.accents.length];
        if (accent < 0.000001) {
          delay += timing;
          continue;
        }
        const velocity = Math.round(99 * accent + 1);
        const duration = `T${Math.round(timing * TICKS_PER_SECOND)}`;
        const pitch = percussionNote;
        const wait = `T${Math.round(delay * TICKS_PER_SECOND)}`;
        const note = new MidiWriter.NoteEvent({ velocity, duration, pitch, wait, channel: 10 });
        track.addEvent(note);
        delay = 0;
      } else {
        // melody
        const value = MidiWriter.Utils.toArray(trackData.values[i % trackData.values.length]);
        if (value.reduce(function(acc, val) { return acc + val; }, 0) < 0.000001) {
          delay += timing;
          continue;
        }
        const velocity = 100;
        const duration = `T${Math.round(timing * TICKS_PER_SECOND)}`;
        const pitch = value.map(noteFromPitch);
        const wait = `T${Math.round(delay * TICKS_PER_SECOND)}`;
        const note = new MidiWriter.NoteEvent({ velocity, duration, pitch, wait, channel });
        track.addEvent(note);
        delay = 0;
      }
    }
    tracks.push(track);
  });

  var writer = new MidiWriter.Writer(tracks);
  writer.saveMIDI(`LP${i < 9 ? '0' : ''}${i + 1}`);
}
