var EB = require('./eulerbeats-node.js');

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
