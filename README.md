# WIP - TODO finish the polysynth and export LPs 02-27

This is the code to generate [Eulerbeats](https://eulerbeats.com/) visuals and audio.
I just ripped their code and packaged it in a simple format, for ripping MIDI.
MIDI is included here, as well as Ableton files for the reverb + synths
(the sound design is not 100% spot on but rough draft).

Big thanks to the Eulerbeats team for creating a great project. Ape strong

## How to run the generator
For me, just opening `index.html` does not work, I have to run

```
python -m http.server
```

or similar.

## How the on-chain code works

The Eulerbeats smart contract address is
`0x8754F54074400CE745a7CEddC928FB1b7E985eD6`.

To call the read functions on the contract is pretty easy on
[Etherscan](https://etherscan.io/address/0x8754F54074400CE745a7CEddC928FB1b7E985eD6#readContract).

`scriptCount()` shows that the script is chunked into 4 parts. So calling
`getScriptAtIndex(i)` for `i=0,1,2,3` gives us 4 tx hashes, which we can plug
into Etherscan. The code is contained in the input data of these 4 tx
(make sure to view in UTF-8).

The seeds I just found on OpenSea but there is probably a faster way such as filtering
for all of the `mintOriginal` events.

## How I converted to MIDI
Maybe it would have been easiest to just use Audio-To-MIDI in Ableton,
but I wanted to be precise. When you play a track with the generator script,
it console logs [Gibberish](https://github.com/gibber-cc/gibberish)
code which plays the audio. I didn't see an off-the-shelf solution to
convert Gibberish to MIDI, so I hacked together some Python to convert the note arrays
into MIDI.

The console log also shows the synth settings and how the reverb and chorus is hooked up.

## Recreating the Synths + Reverb
As mentioned above, we can look at the console log from `index.html`.
For example, LP 01:
```
reverb1 = Freeverb({"roomSize":0.75,"damping":0.1,"input":Bus2()}).connect()
reverb2 = Freeverb({"roomSize":0.95,"damping":0.5,"input":Bus2()}).connect()
chorus = Chorus({"slowGain":8,"fastFrequency":4,"fastGain":1}).connect( reverb2.input )

inst = Kick({})
inst.connect(Gibberish.output, 0.8)

inst = Kick({})
inst.connect(reverb2.input, undefined).connect(Gibberish.output, 0.5)

inst = Clave({})
inst.connect(Gibberish.output, 0.17)

inst = Snare({"decay":0.13617538664730092,"snappy":0.5649675390808625,"tune":-0.00988717513646406})
inst.connect(reverb2.input, 0.5).connect(Gibberish.output, 0.75)

inst = Synth({"decay":8743.870895582293,"attack":8938.386138460944,"cutoff":0.28022564972707187,"filterType":3,"filterMult":3.2123590636510926,"Q":0.23843790233659093,"waveform":"sine","pulsewidth":0.3677113031026238,"detune2":0.22840660791371192,"detune3":-0.6292425470346643,"gain":0.3456881755916584})
inst.connect(reverb2.input, undefined).connect(Gibberish.output, 0.2)

inst = PolySynth({"waveform":"sine","pulsewidth":Add( .35, Sine({ frequency:.9, gain:.3 }) ),"gain":0.06660598353860224,"attack":40830.11126011091,"decay":762048,"shape":"linear","antialias":true,"filterType":2,"panVoices":true,"cutoff":1.7813928883748305})
inst.connect(chorus, undefined).connect(Gibberish.output, undefined)
```
I'll do this for Ableton and release the .als files.
