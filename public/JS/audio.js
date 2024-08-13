const AUDIO_SETTINGS = {
  "music": true,
  "sounds": true
};
const activeSoundInstances = [];
var activeMusic = null;

function toggleSounds() {
  AUDIO_SETTINGS.sounds = !AUDIO_SETTINGS.sounds;
}

function toggleMusic() {
  AUDIO_SETTINGS.music = !AUDIO_SETTINGS.music;
  if (activeMusic !== undefined) {
    activeMusic.volume = AUDIO_SETTINGS.music ? 1 : 0;
  }
}

function playSound(sound) {
  if (!AUDIO_SETTINGS.sounds) {
    return;
  }
  const audioClone = sound.cloneNode();
  audioClone.play();
  activeSoundInstances.push(audioClone);
  audioClone.addEventListener("ended", () => {
    const index = activeSoundInstances.indexOf(audioClone);
    if (index !== -1) {
      activeSoundInstances.splice(index, 1);
    }
  });
}

function setMusic(music) {
  activeMusic = null;
  if (music !== null) {
    activeMusic = music.cloneNode();
    activeMusic.volume = AUDIO_SETTINGS.music ? 1 : 0;
    activeMusic.play();
  }
}
