import math

from mido import Message, MidiTrack, MetaMessage


TICKS_PER_BEAT = 480
global_bpm = 120


def set_bpm(bpm):
    global global_bpm
    global_bpm = bpm


def timing_to_tick(timing):
    global global_bpm
    seconds = timing / 44100.
    minutes = seconds / 60.
    beats = global_bpm * minutes
    ticks = beats * TICKS_PER_BEAT
    return round(ticks)


def freq2midi(f, fA4InHz = 440):
    if f <= 0:
        return 0
    else:
        return round(69 + 12 * math.log(f/fA4InHz, 2))


def add_instrument(mid, name, percussion_note, values, timings, start, repeat):
    global global_bpm

    track = MidiTrack()
    track.name = name
    mid.tracks.append(track)

    track.append(MetaMessage('set_tempo', tempo=round(500000. * 120. / global_bpm)))

    gap = timing_to_tick(start)
    for i in range(repeat * len(values)):
        value = values[i % len(values)]
        timing = timings[i % len(timings)]

        if value == 0:
            gap += timing_to_tick(timing)
            continue

        note = percussion_note if percussion_note is not None else value # TODO parse value
        velocity = round(value * 127) if percussion_note is not None else 127

        if percussion_note:
            velocity = round(value * 127)
            track.append(Message('note_on', channel=10, note=percussion_note, velocity=velocity, time=gap))
            track.append(Message('note_off', channel=10, note=percussion_note, velocity=velocity, time=timing_to_tick(timing)))
        else:
            note = freq2midi(value)
            track.append(Message('note_on', note=note, velocity=127, time=gap))
            track.append(Message('note_off', note=note, velocity=127, time=timing_to_tick(timing)))
        gap = 0


def add_kick(mid, values, timings, start, repeat, name='Kick'):
    add_instrument(mid, name, 36, values, timings, start, repeat)


def add_clave(mid, values, timings, start, repeat, name='Clave'):
    add_instrument(mid, name, 40, values, timings, start, repeat)


def add_snare(mid, values, timings, start, repeat, name='Snare'):
    add_instrument(mid, name, 38, values, timings, start, repeat)


def add_synth(mid, values, timings, start, repeat, name='Synth'):
    add_instrument(mid, name, None, values, timings, start, repeat)
