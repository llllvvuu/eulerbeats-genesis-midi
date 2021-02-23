var EB = require('./eulerbeats-node.js');
var MidiWriter = require('midi-writer-js');

const SEEDS = [
  21575894274,
  18052613891,
  12918588162,
  21760049923,
  22180136451,
  8926004995,
  22364095747,
  17784178691,
  554240256,
  17465084160,
  13825083651,
  12935627264,
  8925938433,
  4933026051,
  8673888000,
  13439075074,
  13371638787,
  17750625027,
  21592343040,
  4916052483,
  4395697411,
  13556253699,
  470419715,
  17800760067,
  9193916675,
  9395767298,
  22314157057,
];

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

    var j = -1;
    var delay = trackData.start;
    for (var i = 0; i < trackData.repeats * (trackData.accents || trackData.values).length; i++) {
      j++;
      if (trackData.accents) {
        // percussion
        const accent = trackData.accents[j % trackData.accents.length];
        const timing = trackData.timings[j % trackData.timings.length];
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
        const value = MidiWriter.Utils.toArray(trackData.values[j % trackData.values.length]);
        const timing = trackData.timings[j % trackData.timings.length];
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
