class JeopardyControl {
    data;
    allQuestions;
    theme;
    isFinal;
    finalWagers = {};

    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');

	async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e));

        await fetch(`./config.json`)
            .then(async (response) => {
                let responseContent = await response.text();
                this.theme = JSON.parse(responseContent).theme;
                document.body.setAttribute('theme', this.theme);
            });

        await fetch(`./data/data-${this.theme}.json`)
            .then(async (response) => {
                let responseContent = await response.text();
                this.data = JSON.parse(responseContent);
                this.allQuestions = this.data.questions.flatMap(cat => cat.items.map(item => ({...item, categoryName: cat.categoryName})));

                const doubleableQuestions = this.allQuestions.filter(item => item.value > 200);
                doubleableQuestions[Math.floor(Math.random()*doubleableQuestions.length)].isDailyDouble = true;
            });

        this.renderCategories();
        
        document.getElementById('select-question-button').addEventListener('click', () => {
            const category = document.getElementById('cat-list');
            const catValue = document.getElementById('cat-value-list');

            if (category.value == '' || catValue.value == '') {
                return;
            }

            const item = this.allQuestions.find(item => item.id == catValue.value && item.categoryName == category.value);

            if (item.isDailyDouble) {
                document.getElementById('control-qna').innerHTML = '<h1>Daily Double!</h1>'
                this.startDailyDouble(item);
            } else {
                this.loadQnACard(item);
            }
        });

        document.getElementById('final-jeopardy-wager-button').addEventListener('click', () => {
            this.sendEvent({
                type: 'final-jeopardy-wager',
                values: [
                    {
                        team: 'red',
                        value: document.querySelector('.final-jeopardy-inputs select[data-team-color="red"]').value
                    },
                    {
                        team: 'orange',
                        value: document.querySelector('.final-jeopardy-inputs select[data-team-color="orange"]').value
                    },
                    {
                        team: 'yellow',
                        value: document.querySelector('.final-jeopardy-inputs select[data-team-color="yellow"]').value
                    },
                    {
                        team: 'green',
                        value: document.querySelector('.final-jeopardy-inputs select[data-team-color="green"]').value
                    },
                    {
                        team: 'blue',
                        value: document.querySelector('.final-jeopardy-inputs select[data-team-color="blue"]').value
                    },
                    {
                        team: 'purple',
                        value: document.querySelector('.final-jeopardy-inputs select[data-team-color="purple"]').value
                    }
                ]
            });
        });

        const startGameBtn = document.getElementById('smart-game-button');
        startGameBtn.addEventListener('click', () => {
            this.startGame();
            startGameBtn.remove();
        });
    }

    startGame() {
        this.sendEvent({ type: 'start-game' });
    }

    startDailyDouble(item) {
        const lastTeam = document.querySelector('.last-team').dataset.teamColor;
        const scoreElem = document.querySelector(`.team-score[data-team-color="${lastTeam}"]`);
        const score = parseInt(scoreElem.innerText);

        Array.from(document.querySelectorAll('daily-double-wager-select option')).forEach(option => {
            option.remove();
        });

        for (let i = 0; i <= score/100; i++) {
            document.getElementById('daily-double-wager-select').append(Object.assign(document.createElement('option'), { value: i * 100, text: `$ ${i * 100}` }));
        }

        document.getElementById('daily-double-wager-button').addEventListener('click', () => {
            item.value = parseInt(document.getElementById('daily-double-wager-select').value || 0);
            this.loadQnACard(item);
            this.sendEvent({
                type: 'daily-double-wager',
                value: document.getElementById('daily-double-wager-select').value
            });

            const teamRadios = document.getElementById('team-radios');
            const bubblesToRemove = Array.from(teamRadios.querySelectorAll(`label:not([data-team-color="none"]):not([data-team-color="${lastTeam}"])`));

            bubblesToRemove.forEach(bubble => {
                bubble.remove();
            });

        });
    }
    
    loadQnACard (item) {
        const bubbleType = this.isFinal ? 'checkbox' :'radio';
        
        const cardStr = `
            <div 
                data-id="${item.id}" 
                data-question="${item.question}" 
                data-answer="${item.answer}" 
                data-value="${item.value}" 
                data-url="${item.url || ''}" 
                data-daily-double="${item.value > 300 ? 'possible' : ''}"
                class="qna">
                    <div class="cat-n-val">
                        <div>${item.categoryName}</div>
                        <div> - $${item.value}</div>                        
                    </div>
                    <div class="answer-text">${item.answer}</div>
                    <div class="question-text">${item.question}</div>
                    <div id="team-radios" class="team-radios"></div>
            </div>
        `;

        document.getElementById('control-qna').innerHTML = cardStr;

        const teamRadiosDiv = document.getElementById('team-radios');
        ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'none'].forEach(color => {
            teamRadiosDiv.innerHTML += `
                <label for="radio-${color}" data-team-color="${color}">
                    <input type="${bubbleType}" id="radio-${color}" name="team" value="${color}" wager="${this.isFinal ? this.finalWagers[color] : ''}" />
                </label>
            `
        })

        const saveBtn = Object.assign(document.createElement('button'), { id: 'save-question-button', innerText: 'Save' });
        teamRadiosDiv.append(saveBtn);

        saveBtn.addEventListener('click', this.saveQuestionClicked.bind(this));
        
        this.sendEvent({
            type: 'question-selected',
            value: ''
        });
    }

    saveQuestionClicked(e) {
        if(this.isFinal) {
            const selctedTeams = Array.from(document.querySelectorAll('input[name="team"]:checked'));
            selctedTeams.forEach(team => {
                const scoreDiv = document.querySelector(`.team-score[data-team-color="${team.value}"]`);
                scoreDiv.querySelector('.team-score-content').innerText = parseInt(scoreDiv.querySelector('.team-score-content').innerText) + parseInt(team.dataset.wager);
            })

        } else {
            const category = document.getElementById('cat-list');
            const catValue = document.getElementById('cat-value-list');
    
            const selectedTeam = document.querySelector('input[name="team"]:checked').value;
            if (selectedTeam != 'none') {
                document.querySelector('.last-team').dataset.teamColor = selectedTeam;
            }

            const item = this.allQuestions.find(item => item.id == catValue.value && item.categoryName == category.value);
            item.completed = selectedTeam;
    
            document.getElementById('cat-list').value = '';
            document.getElementById('cat-value-list').value = '';
            document.getElementById('cat-value-list').innerHTML = '<option value="" selected disabled hidden>Select</option>';    

            this.updateScores();
            document.getElementById('control-qna').innerHTML = '';
        }
    }

    renderCategories() {
        const catListSelect = document.getElementById('cat-list');

        this.data.questions.forEach(cat => {
            const optionDiv = Object.assign(document.createElement('option'), { value: cat.categoryName, text: cat.categoryName });
            catListSelect.append(optionDiv);
        });

        catListSelect.addEventListener('change', (e) => {
            const selectedCat = e.currentTarget.value;
            const questions = this.allQuestions.filter(cat => cat.categoryName == selectedCat);

            const valuesSelect = document.getElementById('cat-value-list');
            valuesSelect.innerHTML = `<option value="" selected disabled hidden>Select</option>`;

            questions.forEach(item => {
                const optionDiv = Object.assign(document.createElement('option'), { value: item.id, text: `$ ${item.value}` });

                if (item.completed) {
                    optionDiv.classList.add('q-completed');
                }

                valuesSelect.append(optionDiv);
            })
        })
    }

    async messageEventListener(message) {
        console.log('message received', message)
        switch (message.data.type) {
            case 'team-start':
                console.log(message.data.team);
                document.querySelector('.last-team').dataset.teamColor = message.data.team;
                break;
            case 'score':
                const teamDiv = document.querySelector(`.team-score[data-team-color="${message.data.team}"]`);
                teamDiv.querySelector('.team-score-content').innerText = `${message.data.score}`;

                break;

            case 'Question':
                console.log(`%c${message.data.type}`, 'color: yellowgreen; font-size: 20px; font-weight: bold');
                console.log(`%c$${message.data.value}`, 'color: orange; font-size: 20px; padding-left: 16px');
                console.log(`%c${message.data.answer}`, 'color: orange; font-size: 20px; padding-left: 16px');
                console.log(`%c${message.data.question}`, 'color: dimgray; font-size: 20px; padding-left: 16px');

                if (Boolean(message.data.url)) {
                    console.log(`%c${message.data.url}`, 'color: blue; font-size: 20px; padding-left: 16px');
                }
                break;

            case 'double-jeopardy':
                const scoreElem = document.querySelector(`.team-score[data-team-color="${message.data.team}"]`);
                const score = parseInt(scoreElem.innerText);

                for (let i = 0; i <= score/100; i++) {
                    document.getElementById('daily-double-wager-select').append(Object.assign(document.createElement('option'), { value: i * 100, text: `$ ${i * 100}` }));
                }
                break;
            case 'final-jeopardy':
                const selects = Array.from(document.querySelectorAll('.final-jeopardy-inputs select'));
                selects.forEach(select => {
                    const scoreElem = document.querySelector(`.team-score[data-team-color="${select.dataset.teamColor}"]`);
                    const score = parseInt(scoreElem.innerText);
                    
                    for (let i = 0; i <= score/100; i++) {
                        select.append(Object.assign(document.createElement('option'), { value: i * 100, text: `$ ${i * 100}` }));
                    }

                    select.addEventListener('click', (e) => { e.stopPropagation(); });
                });
                break;
            default:
                break;
        }
    }

    sendEvent(message) {
        this.channel.postMessage(message);
    }

	updateScores() {
        const scoreDivs = Array.from(document.querySelectorAll('.team-score'));

        scoreDivs.forEach(scoreDiv => {
            const teamValues = this.allQuestions.filter(q => q.completed == scoreDiv.dataset.teamColor).map(q => q.value);
            const score = teamValues.reduce((a, b) => a + b, 0);
            scoreDiv.querySelector('.team-score-content').innerText = score;
        })
    }
}