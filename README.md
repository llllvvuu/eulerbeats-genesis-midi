![Ableton Screenshot](screenshot.png)

# WIP - Need to finish rest of Ableton files

These are MIDI/project file for remixing [Eulerbeats](https://eulerbeats.com/).
Everything is ripped from their on-chain(!!) audio generation code.

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
convert Gibberish to MIDI, so I hacked together some JS to convert the note arrays
into MIDI.

The console log also shows the synth settings and how the reverb and chorus is hooked up.

## Recreating the Synths + Reverb

I have Ableton files ready made in the `Ableton/` folder. For other DAWs, synths can be set up
according to `synthinfo.txt` which I dumped from `synthinfo.js`. The numbers are scaled in weird multiples of 44100 though.
TODO: clarify this.

TODO: Create the `pwm` waveform (the horn-sounding one - think this can just be done in Operator). Improve the reverb if possible.
