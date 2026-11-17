# Desert scene audio — sources and licences

All desert sounds are field recordings from [Freesound](https://freesound.org) released under
**CC0 1.0 (public-domain dedication)**: free for commercial use, no attribution required (credited here anyway).
Each licence was checked on the sound's page. The files are cut, cleaned and loop-joined by
`tools/desertaudio.py` and bundled in `assets/audio/` (nothing is fetched at runtime). They play only in the
desert scene, through its own bus under the app's master volume.

| Freesound | Author | Title | Used as |
|---|---|---|---|
| [479610](https://freesound.org/people/craigsmith/sounds/479610/) | craigsmith | R30-34-Red Tailed Hawk.wav | `dEg1`–`dEg3` eagle long screams while soaring |
| [875513](https://freesound.org/people/loganzsound/sounds/875513/) | loganzsound | Red Tailed Hawk Cries | `dEg4`–`dEg5` short eagle cries (take-off/landing) |
| [685761](https://freesound.org/people/jlseagull/sounds/685761/) | jlseagull | Camel.mp3 | `dCm1`, `dCm2`, `dCm5` camel grumbles/moans |
| [437937](https://freesound.org/people/craigsmith/sounds/437937/) | craigsmith | G12-05-Camel Grunt.wav | `dCm3`, `dCm4` camel grunts when kneeling |
| [645305](https://freesound.org/people/DarkShroom/sounds/645305/) | DarkShroom | desert_wind.wav | `dWnd` gusting wind bed |
| [697217](https://freesound.org/people/dhallcomposer/sounds/697217/) | dhallcomposer | Looping Gentle Wind Ambience on an Open Desert Plain.wav | `dCalm` calm open-desert air |
| [825860](https://freesound.org/people/Vrymaa/sounds/825860/) | Vrymaa | Desert sand - Dune atmosphere | `dSnd` blowing sand hiss, dust devil |
| [363092](https://freesound.org/people/TheWoodlandNomad/sounds/363092/) | TheWoodlandNomad | Fire Crackle and Flames 002 | `dFire` campfire (night only); `dPop1`-`dPop3` single pops of the wood, each with a burst of sparks |
| [851733](https://freesound.org/people/IENBA/sounds/851733/) | IENBA | Thick Sand Movements | `dSnk` snake rustle (granular resynthesis of the recording) |
| [437958](https://freesound.org/people/craigsmith/sounds/437958/) | craigsmith | G12-26-Rattlesnake Rattle | `dRtlOn` startle burst, `dRtl` sustained rattle loop |
| [166176](https://freesound.org/people/felix.blume/sounds/166176/) | felix.blume | Cricket in the desert (close recording) — Mojave Desert | `dOk1`–`dOk4` desert cricket calls in the shore grass |
| [583074](https://freesound.org/people/Breviceps/sounds/583074/) | Breviceps | Cricket chirping | `dOc1`–`dOc3` field cricket chirp bouts in the shore grass |
| [513978](https://freesound.org/people/remmert/sounds/513978/) | remmert | Pool Frogs with birds (Pelophylax lessonae) | `dFr1`–`dFr6` water-frog croaks (low-passed below the birds) |
| [447319](https://freesound.org/people/antoineopeng/sounds/447319/) | antoineopeng | Dragonfly.wav | `dDf1`, `dDf2` dragonfly wing passes over the water |
| [570203](https://freesound.org/people/RatBird/sounds/570203/) | RatBird | Dragonfly Flying By.wav | `dDf3` dragonfly fly-by |
| [573935](https://freesound.org/people/TRP/sounds/573935/) | TRP | Grasshopper wing clicks snaps hot BADLANDS | `dGh1`, `dGh2` grasshopper wing snaps in the vegetation |
| [866246](https://freesound.org/people/Fhmediahmo/sounds/866246/) | Fhmediahmo | Lluvia y Truenos Monzon Hermosillo | `dRn`, `dRn2`, `dRn3` desert monsoon rain beds (22, 17 and 13 s from different stretches); `dTh1`–`dTh3` close thunder cracks with their roll |
| [484723](https://freesound.org/people/Breviceps/sounds/484723/) | Breviceps | Rain on tent | `dRt`, `dRt2` rain drumming on the tent cloth (22 and 17 s) |
| [476231](https://freesound.org/people/felix.blume/sounds/476231/) | felix.blume | Thunders and sheperd in the mountain Las Narices | `dTh4` far rolling thunder |
| [347562](https://freesound.org/people/mikala_oidua/sounds/347562/) | mikala_oidua | Distant Thunder Clap_Gentle.wav | `dTh5` distant thunder |
| [632771](https://freesound.org/people/gbayles/sounds/632771/) | gbayles | Sandstorm Looping | `dStm` sandstorm roar |
| [438877](https://freesound.org/people/craigsmith/sounds/438877/) | craigsmith | G56-22-Sandstorm.wav | `dStS` sandstorm sand hiss |

Playback (`src/desert.js`, `sound()`): every voice is panned, attenuated and low-passed from its position
relative to the camera. The eagle screams on a random 11–24 s timer while soaring and gives short cries on
take-off and landing. Camels grunt when kneeling and rising, and grumble occasionally while walking or resting.
The snake rustle follows the snake and scales with its speed. Wind and sand track the wind slider and gusts,
the dust devil adds a moving sand hiss, and the fire crackles only at night. Everything is quieter at night.

Oasis insects (`oasis()` in `src/desert.js`) are separate recordings from the yard crickets and cicadas and never
play outside the desert. Nine singers sit around the pond: two field crickets and two desert crickets in the shore
grass, two water frogs at the edge, one dragonfly over the water and two grasshoppers in the vegetation.
- **Night:** the crickets sing sparse bouts with rests (a singer never overlaps itself); a frog croaks now and then.
- **Day:** a rare cricket call, an occasional dragonfly pass or grasshopper wing-snap; no frogs.
- **Only near water:** the group runs through its own bus whose level follows the camera's distance from the
  shore grass, full within about 3 m and silent beyond about 15 m, so it fades out over the dunes and in the
  overview.
- **Wind:** while the wind and gusts are strong the insects stop (the bus dips and no new calls start); they
  resume in the lulls.

Weather (`wxUpdate()` and `sound()` in `src/desert.js`). The weather sounds load only when that weather comes.
- **Showers:** the rain bed follows the rain's strength, and the tent loop sits at the tent, so it is heard only
  close by. Wet sand stops the blowing-sand hiss until it dries. Insects fall silent in the rain, and after it
  the frogs call for a few minutes, by day too.
- **Rain beds are continuous:** the monsoon recording drops out for a few milliseconds here and there and swells
  under gusts, and looped every 22 s that was heard as the rain stuttering. `tools/desertaudio.py` (`steady()`)
  fills each dropout with noise shaped to the spectrum and level of the clean audio around it (a copy from earlier
  in the take was heard as a repeat in the dense clusters), and rides the swells down. Once decoded, the loop is made exactly
  periodic (its last 0.45 s is crossfaded into the copy before its start). The rain and tent loops then start silent
  and run without a break while the desert is shown. Rain, a change of intensity and taps only glide their gain;
  no source is started again.
- **No audible repeat:** the patter all round is three beds of 22, 17 and 13 s (no common factor, so they only line
  up again after 81 minutes), each started at a random point; the two shorter ones trade level slowly. The tent has
  two beds of 22 and 17 s.
- **By surface:** the rain on the pond is a fizz of small plinks (`dRwt`) heard from the water, and the palm crowns
  tick (`dRlf`) from overhead; both are made in code and loop seamlessly. Close to the camera single drops land at
  random: a soft pat on the sand (`dRd1`), a taut tick on the tent cloth (`dRd2`), a plink in the pond, a tick on a
  frond overhead (`dRd3`). All of them grow with the rain's strength and fall away with distance.
- **In step with the rain you see:** every rain voice follows the same rain amount that draws the streaks, so the
  sound swells and dies with them. When the rain has stopped the cloth, fronds and pond go on dripping for about
  ten seconds, thinning out.
- **Hail:** made in code like the rain-on-surface loops: dull thuds on the sand (11 s loop), a taut drum on the tent
  (9 s), a crackle in the palm crowns (8 s) and plinks on the pond (7 s), each heard from where it is, plus single
  near strikes. The loops have different lengths, are exactly periodic, start silent once made and then only change
  level, as the rain beds do.
- **Thunderstorm:** each strike is seen first and heard after the sound's travel time (up to about 5 s). Near
  strikes crack and far ones roll, and the sound comes from the side the bolt fell on.
- **Sand/dust storm:** the roar and the sand hiss rise with the storm level (浮尘 to 强沙尘暴). The insects stop,
  and the wind bed rises with the stronger wind.

Rattlesnake (`rsUpdate()` and `sound()` in `src/desert.js`): when a camel comes close or the eagle flies low, the
snake throws itself into a defensive coil with a short rattle burst, and the rattle keeps buzzing from the coil until
the threat has gone. The rustle follows the crawling body and scales with its speed.
