class HomeControl {
    data;
    questionTemplate;
    channel = new BroadcastChannel('my_channel');
    qNumber = 0;
    
    async init() {
        this.questionTemplate = document.getElementById('question-template');

        await fetch('/data.json')
        .then(async (response) => {
            let responseContent = await response.text();
            this.data = JSON.parse(responseContent);

            this.data.forEach((dObj, i) => {
                if(i > 0) {
                    this.renderQuestion(dObj);
                }
            });
        });

        document.getElementById('next-question-button').addEventListener('click', this.loadNextQuestion.bind(this));
        document.getElementById('team-1-add-1').addEventListener('click', this.addPoints.bind(this,1,1))
        document.getElementById('team-2-add-1').addEventListener('click', this.addPoints.bind(this,2,1))
        document.getElementById('team-1-add-5').addEventListener('click', this.addPoints.bind(this,1,5))
        document.getElementById('team-2-add-5').addEventListener('click', this.addPoints.bind(this,2,5))

        Array.from(document.querySelectorAll('.team-name')).forEach(input => {
            input.addEventListener('input', this.nameUpdated.bind(this));
        })
        
        Array.from(document.querySelectorAll('.strike-btn')).forEach(btn => {
            btn.addEventListener('click', this.strikeTeam.bind(this));
        })

        Array.from(document.querySelectorAll('.clear-strikes-btn')).forEach(btn => {
            btn.addEventListener('click', this.clearTeamStrikes.bind(this));
        })
    }

    sendEvent(message) {
        this.channel.postMessage(message);
    }

    renderQuestion(qObj) {
        const clone = this.questionTemplate.content.cloneNode(true);
        const container = document.getElementById('questions-container');
        
        clone.querySelector('summary').innerText = `${qObj.order}. ${qObj.question}`;

        qObj.answers.forEach((a, i) => {
            clone.querySelector(`.a-${i}`).innerText = a;
            clone.querySelector(`[data-sa-index="${i}"]`).addEventListener('click', this.showAnswer.bind(this));
            clone.querySelector(`[data-ha-index="${i}"]`).addEventListener('click', this.hideAnswer.bind(this));
        })
                
        clone.querySelector('details').id = `question-${qObj.order}`;

        container.append(clone);
    }

    loadNextQuestion(){
        const container = document.getElementById('questions-container');
        Array.from(container.querySelectorAll('details')).forEach(elem => {
            elem.removeAttribute('open');
            elem.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        });

        let question = document.getElementById(`question-${this.qNumber}`);

        if(!question) {
            this.qNumber = 1;
            question = document.getElementById(`question-${this.qNumber}`);
        }

        question.setAttribute('open', 'open');
        this.sendEvent('next-question');
        this.qNumber++;
    }

    showAnswer(e) {
        const aIndex = e.target.dataset.saIndex;
        this.sendEvent(`show-answer-${aIndex}`)
    }
    
    hideAnswer(e) {
        const aIndex = e.target.dataset.haIndex;
        this.sendEvent(`hide-answer-${aIndex}`)
    }
    
    addPoints(team, value) {
        const pointsElem = document.getElementById(`team-${team}`).querySelector('.team-points');
        let points = parseInt(pointsElem.innerText);
        points += value;
        pointsElem.innerText = points;
        
        this.sendEvent(`add-points-${team}-${points}`);
    }

    nameUpdated(e) {
        const teamNo = e.target.closest('.team-group').id.replace('team-', '');
        this.sendEvent(`update-name-${teamNo}-${e.target.value}`);
    }

    strikeTeam(e) {
        this.sendEvent(`strike-team-${e.target.dataset.team}`);
    }

    clearTeamStrikes(e) {
        this.sendEvent(`clear-team-strikes-${e.target.dataset.team}`);
    }
}