class DoodleIntro {
    channel = new BroadcastChannel('ladysinya.github.io_doodle_intro_broadcast_channel');

    output = document.querySelector('.timer');
	running = false;
	paused = false;
	timer;
	
	// timer start time
	then;
	// pause duration
	delay;
	// pause start time
	delayThen;

	init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e))
        this.introAudio = new Audio("./assets/intro.mp3");
        this.penguinsSavedAudio = new Audio("./assets/penguins-saved.m4a");

        this.introAudio.addEventListener("ended", () => {
            document.querySelector('.profiles')?.classList.remove('show');
            this.output?.classList.add('show');
            setTimeout(() => {
                this.startTimer();                
            }, 2000);
       });
	}

    messageEventListener(message) {
        switch (message.data) {
            case 'intro-clicked':
                this.startIntro();                
                break;        
            case 'penguins-saved-clicked':
                this.startPenguinsSaved();                
                break;
            case 'stop-timer-clicked':
                this.stopTimer();                
                break;
            case 'resume-timer-clicked':
                this.resumeTimer();                
                break;
            case 'reset-timer-clicked':
                this.resetTimer();                
                break;
            default:
                console.log('event message', message)
                break;
        }
    }

    startIntro() {
        this.introAudio.play();
        document.querySelector('.profiles')?.classList.add('show');
    }

    startPenguinsSaved() {
        this.penguinsSavedAudio.play();
    }

    startTimer() {
        this.delay = 0;
		this.running = true;
		this.then = Date.now();
		this.timer = setInterval(this.run.bind(this),51);
    }

    stopTimer() {
        this.paused = true;
		this.delayThen = Date.now();
		clearInterval(this.timer);

		// call one last time to print exact time
		this.run();
    }

    resumeTimer() {
        this.paused = false;
		this.delay += Date.now()-this.delayThen;
		this.timer = setInterval(this.run.bind(this),51);
    }

    resetTimer() {
        this.running = false;
		this.paused = false;
		this.output.innerHTML = '0:00:00';
    }

    parseTime(elapsed) {
		// array of time multiples [hours, min, sec]
		let d = [3600000,60000,1000];
		let time = [];
		let i = 0;

		while (i < d.length) {
			let t = Math.floor(elapsed/d[i]);

			// remove parsed time for next iteration
			elapsed -= t*d[i];

			// add '0' prefix to m,s,d when needed
			t = (i > 0 && t < 10) ? '0' + t : t;
			time.push(t);
			i++;
		}
		
		return time;
	};

    run() {
		// get output array and print
		let time = this.parseTime(Date.now()-this.then-this.delay);
		this.output.innerHTML = time[0] + ':' + time[1] + ':' + time[2];
	};
}