class Home {
    data;
    channel = new BroadcastChannel('my_channel');
    qNumber = 0;
    
    async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e))
        
        await fetch('./data.json')
        .then(async (response) => {
            let responseContent = await response.text();
            this.data = JSON.parse(responseContent);
        });
        
        this.loadNextQuestion();
    }

    messageEventListener(message) {
        console.log('event', message);

        if(message.data == 'next-question') {
            this.loadNextQuestion();
        }

        if(message.data.includes('show-answer')){
            const index = message.data.replace('show-answer-', '');
            this.showAnswer(parseInt(index));
        }
        
        if(message.data.includes('hide-answer')){
            const index = message.data.replace('hide-answer-', '');
            this.hideAnswer(parseInt(index));
        }
        
        if(message.data.includes('add-points')){
            const split = message.data.split('-');
            this.addPoints(parseInt(split[2]), parseInt(split[3]));
        }

        if(message.data.includes('update-name')) {
            const split = message.data.split('-');
            this.updateName(parseInt(split[2]), split[3]);
        }

        if(message.data.includes('strike-team')){
            const teamNo = message.data.replace('strike-team-', '');
            this.strikeTeam(parseInt(teamNo));
        }

        if(message.data.includes('clear-team-strikes')){
            const teamNo = message.data.replace('clear-team-strikes-', '');
            this.clearStrikes(parseInt(teamNo));
        }
    }

    loadNextQuestion() {
        Array.from(document.querySelectorAll('.hide-overlay')).forEach (elem => {
            elem.classList.remove('hide-overlay');
        })

        let question = this.data.find(d => d.order == this.qNumber.toString());

        if(!question) {
            this.qNumber = 1;
            question = this.data.find(d => d.order == this.qNumber.toString());
        }

        setTimeout(() => {
            Array.from(document.querySelectorAll('.answer')).forEach(answerElem => {
                answerElem.querySelector('.answer-text-content').innerHTML = '';
            })

            document.getElementById('question').innerText = question.question;
    
            question.answers.forEach((answer, i) => {
                const answerElem = document.getElementById(`answer-${i + 1}`);
                const contentDiv = answerElem?.querySelector('.answer-text-content');
                contentDiv.innerText = answer;
            });            
        }, 1000);

        this.qNumber++;

        this.clearStrikes();
        
    }

    showAnswer(index) {
        const container = document.getElementById(`answer-${index + 1}`);
        container.querySelector('.answer-text-overlay').classList.add('hide-overlay');
    }
    
    hideAnswer(index) {
        console.log('hiding answer', index);
        const container = document.getElementById(`answer-${index + 1}`);
        container.querySelector('.answer-text-overlay').classList.remove('hide-overlay');
    }

    addPoints(team, value) {
        const teamElem = document.getElementById(`team-${team}`);
        teamElem.querySelector('.team-points').innerText = value;
    }

    strikeTeam(teamNo) {
        const teamElem = document.getElementById(`team-${teamNo}`);
        teamElem.querySelector('.strike[disabled]').removeAttribute('disabled');
    }

    clearStrikes(teamNo) {
        const strikes = teamNo 
                        ? Array.from(document.getElementById(`team-${teamNo}`).querySelectorAll('.strike'))
                        : Array.from(document.querySelectorAll('.strike'));
        strikes.forEach(strike => {
            strike.setAttribute('disabled', 'disabled');
        })
    }

    updateName(teamNo, value) {
        document.getElementById(`team-${teamNo}`).querySelector('.team-name').innerText = value;
    }
}