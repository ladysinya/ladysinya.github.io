class JeopardyControl {
    data;
    allQuestions;
    theme;
    isFinal;
    finalWagers = {};

    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');

	async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e));

        let dailyDoubleQuestion;

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
                dailyDoubleQuestion = doubleableQuestions[Math.floor(Math.random()*doubleableQuestions.length)];
                dailyDoubleQuestion.isDailyDouble = true;

            });
            
        this.renderCategories(dailyDoubleQuestion.id);
        
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

                this.sendEvent({
                    type: 'question-selected',
                    id: item.id
                });
            } else {
                this.loadQnACard(item);
            }
        });

        // document.getElementById('final-jeopardy-wager-button').addEventListener('click', () => {
        //     this.sendEvent({
        //         type: 'final-jeopardy-wager',
        //         values: [
        //             {
        //                 team: 'red',
        //                 value: document.querySelector('.final-jeopardy-inputs [data-team-color="red"] select').value
        //             },
        //             {
        //                 team: 'orange',
        //                 value: document.querySelector('.final-jeopardy-inputs [data-team-color="orange"] select').value
        //             },
        //             {
        //                 team: 'yellow',
        //                 value: document.querySelector('.final-jeopardy-inputs [data-team-color="yellow"] select').value
        //             },
        //             {
        //                 team: 'green',
        //                 value: document.querySelector('.final-jeopardy-inputs [data-team-color="green"] select').value
        //             },
        //             {
        //                 team: 'blue',
        //                 value: document.querySelector('.final-jeopardy-inputs [data-team-color="blue"] select').value
        //             },
        //             {
        //                 team: 'purple',
        //                 value: document.querySelector('.final-jeopardy-inputs [data-team-color="purple"] select').value
        //             }
        //         ]
        //     });
        // });

        const startGameBtn = document.getElementById('smart-game-button');
        startGameBtn.addEventListener('click', () => {
            this.startGame();
            startGameBtn.remove();
        });

        document.querySelector('.start-final-jeopardy').addEventListener('click', () => {
            if (!this.isFinal) {
                console.log('clicked start final, but it is not time yet.')
                return;
            }

            this.sendEvent({ type: 'start-final-jeopardy' });
        })
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
            const radiosToRemove = Array.from(teamRadios.querySelectorAll(`label:not([data-team-color="none"]):not([data-team-color="${lastTeam}"])`));

            radiosToRemove.forEach(bubble => {
                bubble.remove();
            });

        });
    }
    
    loadQnACard (item, isDailyDouble) {
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
                        <div>${this.isFinal ? 'Final Jeopardy' : item.categoryName}</div>
                        <div>${this.isFinal ? '' : `- $${item.value}`}</div>                        
                    </div>
                    <div class="answer-text">${item.answer}</div>
                    <div id="team-radios" class="team-radios"></div>
                    <div class="question-text">${item.question}</div>
                    <button id="save-question-button">Save</button>
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
        });

        Array.from(document.querySelectorAll('input')).forEach(input => {
            input.addEventListener('change', (e) => {
                if (this.isFinal) {
                    const wagers = [];
                    const wagerElems = Array.from(document.querySelectorAll('.final-jeopardy-inputs [data-team-color]'));
                    wagerElems.forEach(wagerElem => {
                        wagers.push({
                            team: wagerElem.dataset.teamColor,
                            value: wagerElem.querySelector('select').value
                        });
                    });

                    const selectedTeams = Array.from(document.querySelectorAll('input[name="team"]:checked'));
                    selectedTeams.forEach(team => {
                        if (team != 'none') {
                            wagers.find(w => w.team == team.value).isCorrect = true;
                        }
                    });

                    this.sendEvent({ type: 'question-buzzed', wagers: wagers });
                } else {
                    this.sendEvent({ type: 'question-buzzed', team: e.currentTarget.value });
                }
            });
        });

        const questionTextElem = document.getElementById('control-qna').querySelector('.question-text');
        questionTextElem.addEventListener('click', (e) => {
            const answeredTeam = document.querySelector('input[name="team"]:checked');
            if (!answeredTeam) { return; }

            e.currentTarget.classList.add('question-answered');
            this.sendEvent({ type: 'show-answer' });
        })

        const saveBtn = document.getElementById('save-question-button');
        saveBtn.addEventListener('click', this.saveQuestionClicked.bind(this));
        
        if (!isDailyDouble) {
            this.sendEvent({
                type: 'question-selected',
                id: item.id
            });
        }
    }

    saveQuestionClicked(e) {
        if(this.isFinal) {
            const correctTeams = Array.from(document.querySelectorAll('input[name="team"]:checked:not([value="none"])'));
            const incorrectTeams = Array.from(document.querySelectorAll('input[name="team"]:not(:checked):not([value="none"])'));
            const scores = [];

            correctTeams.forEach(team => {
                const scoreDiv = document.querySelector(`.team-score[data-team-color="${team.value}"]`);
                const score = document.querySelector(`.final-jeopardy-inputs [data-team-color="${team.value}"] select`).value;
                const newScore = parseInt(scoreDiv.querySelector('.team-score-content').innerText) + parseInt(score);
                scoreDiv.querySelector('.team-score-content').innerText = newScore;

                scores.push({ team: team.value, score: newScore });
            });

            incorrectTeams.forEach(team => {
                const scoreDiv = document.querySelector(`.team-score[data-team-color="${team.value}"]`);
                const score = document.querySelector(`.final-jeopardy-inputs [data-team-color="${team.value}"] select`).value;
                const newScore = parseInt(scoreDiv.querySelector('.team-score-content').innerText) - parseInt(score);
                scoreDiv.querySelector('.team-score-content').innerText = newScore

                scores.push({ team: team.value, score: newScore });
            });
    
            this.sendEvent({ type: 'score-calculated', scores: scores });
        } else {
            const category = document.getElementById('cat-list');
            const catValue = document.getElementById('cat-value-list');
            const lastTeamElem = document.querySelector('.last-team');
    
            const item = this.allQuestions.find(item => item.id == catValue.value && item.categoryName == category.value);
    
            const selectedTeam = document.querySelector('input[name="team"]:checked').value;
            if (selectedTeam == 'none') {
                if (item.isDailyDouble) {
                    const wager = parseInt(document.getElementById('daily-double-wager-select').value);
                    item.value = wager * -1;
                    item.completed = lastTeamElem.dataset.teamColor;
                } else {
                    item.completed = selectedTeam;
                }
            } else {
                lastTeamElem.dataset.teamColor = selectedTeam;
                item.completed = selectedTeam;
            }
            
            document.getElementById('cat-list').value = '';
            document.getElementById('cat-value-list').value = '';
            document.getElementById('cat-value-list').innerHTML = '<option value="" selected disabled hidden>Select</option>';    

            this.updateScores();
            document.getElementById('control-qna').innerHTML = '';
            this.sendEvent({ type: 'question-answered', team: selectedTeam });

            const finalCheck = this.allQuestions.filter(aq => !aq.completed);
            if (finalCheck.length == 0) {
                this.isFinal = true;
                const finalItem = {
                    id: 100,
                    question: this.data.finalJeopardy.question,
                    answer: this.data.finalJeopardy.answer,
                    value: 0
                }

                this.startFinalJeopardy();
                this.loadQnACard(finalItem);
                this.sendEvent({ type: 'initiateFinalJeopardy' });
            }
        }
    }

    startFinalJeopardy() {
        const scoreElems = Array.from(document.querySelectorAll('.team-score'));

        scoreElems.forEach(scoreElem => {
            console.log ('scoreElem', scoreElem)
            const score = parseInt(scoreElem.querySelector('.team-score-content').innerText);
            console.log('score:', score)
            const team = scoreElem.dataset.teamColor;
            console.log('team:', team)

            const teamFinalSelect = document.querySelector(`.final-jeopardy-inputs [data-team-color="${team}"] select`);
            teamFinalSelect.innerHTML = '<option value="" selected disabled hidden>Select</option>';

            for (let i = 0; i <= score/100; i++) {
                teamFinalSelect.append(Object.assign(document.createElement('option'), { value: i * 100, text: `$ ${i * 100}` }));
            }
        });
        

    }

    renderCategories(ddid) {
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
        });

        setTimeout(() => {
            this.sendEvent({
                type: 'setDailyDouble',
                id: ddid
            });            
        }, 500); // Can't figure out why I need to defer this
    }

    async messageEventListener(message) {
        console.log('message received', message)
        switch (message.data.type) {
            case 'team-start':
                console.log(message.data.team);
                document.querySelector('.last-team').dataset.teamColor = message.data.team;
                break;

            case 'initiateFinalJeopardy':
                this.isFinal = true;
                // do other things
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

        const scores = [];
        scoreDivs.forEach(scoreDiv => {
            const teamValues = this.allQuestions.filter(q => q.completed == scoreDiv.dataset.teamColor).map(q => q.value);
            const score = teamValues.reduce((a, b) => a + b, 0);
            scoreDiv.querySelector('.team-score-content').innerText = score;
            scores.push({ team: scoreDiv.dataset.teamColor, score: score });
        });

        this.sendEvent({ type: 'score-calculated', scores: scores });
    }
}