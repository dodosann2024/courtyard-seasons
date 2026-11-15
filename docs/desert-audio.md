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
| [363092](https://freesound.org/people/TheWoodlandNomad/sounds/363092/) | TheWoodlandNomad | Fire Crackle and Flames 002 | `dFire` campfire (night only) |
| [851733](https://freesound.org/people/IENBA/sounds/851733/) | IENBA | Thick Sand Movements | `dSnk` snake rustle (granular resynthesis of the recording) |

Playback (`src/desert.js`, `sound()`): every voice is panned, attenuated and low-passed from its position
relative to the camera. The eagle screams on a random 11–24 s timer while soaring and gives short cries on
take-off and landing. Camels grunt when kneeling and rising, and grumble occasionally while walking or resting.
The snake rustle follows the snake and scales with its speed. Wind and sand track the wind slider and gusts,
the dust devil adds a moving sand hiss, and the fire crackles only at night. Everything is quieter at night.
