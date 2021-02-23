var EB = require('./eulerbeats-node.js');

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

  console.log(`-------------------------------`);
  console.log(`LP${i < 9 ? '0' : ''}${i + 1}`);
  console.log(`-------------------------------`);
  console.log(`BPM: ${theme.bpm}`);
  console.log(`Time Signature: ${theme.pulses}/4`);
  console.log(`---`);
  Object.keys(theme.tracks).forEach(function(trackName) {
    const trackData = theme.tracks[trackName];
    console.log(`Track Name: ${trackName}`);
    console.log(`Instrument: ${trackData.instrument}`);
    console.log(`Instrument Config: ${JSON.stringify(trackData.instrumentConfig, null, 2)}`);
    console.log(`Chain: ${JSON.stringify(trackData.chain)}`);
    console.log(`---`);
  });
}
