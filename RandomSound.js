class RandomSound {
    constructor(files) {
        this.sounds = [];
        for (let i = 0; i < files.length; i++)
            this.addSound(files[i].name, files[i].volume);
    }

    addSound(file, volume) {
        let sound = new Audio(file);
        sound.volume = volume;
        this.sounds.push(sound);
        console.log(this.sounds)
    }

    play() {
        this.sounds[Math.floor(Math.random()*this.sounds.length)].play();
    }
}