class Jeopardy {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');
    theme;

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
            });

        this.renderCards();
	}

    startGame() {
        this.spinWheel();
    }

    ack(message) {
        console.log('message received: ' + message.data.type, message.data);
    }

    messageEventListener(message) {
        switch (message.data.type) {
            case 'setDailyDouble':
                this.ack(message);
                this.setDailyDouble(message.data.id);
                break
            case 'start-game':
                this.ack(message);
                this.startGame();     
                break;
            case 'question-selected':
                this.ack(message);
                const card = document.querySelector(`.card[data-id="${message.data.id}"]`);

                const value = card.querySelector('.card-value').innerText;
                const style = window.getComputedStyle(card);

                const disabledCard = `
                    <div class="card" data-disabled height="${style.height}" width="${style.width}">
                        <div class="card-value">${value}</div>
                    </div>
                `

                card.parentNode.insertBefore(Object.assign(document.createElement('div'), { innerHTML: disabledCard }).children[0], card);

                card.classList.add('card-open');
                break;
            case 'question-buzzed':
                this.ack(message);
                const teamIconClasses = {
                    red: 'fa-duotone fa-thin fa-candy-cane',
                    orange: 'fa-duotone fa-thin fa-bells',
                    yellow: 'fa-duotone fa-thin fa-stars',
                    green: 'fa-duotone fa-thin fa-tree-christmas',
                    blue: 'fa-duotone fa-light fa-snowflakes',
                    purple: 'fa-duotone fa-light fa-gifts',
                    none: 'fa-duotone fa-regular fa-x-mark'
                }

                if (this.isFinal) {
                    const buzzedElem = document.querySelector('.buzzed-container');
                    buzzedElem.innerHTML = '';

                    message.data.wagers.forEach(wager => {
                        const teamElem = `
                            <div class="team-buzzed-group ${wager.isCorrect ? 'final-correct' : ''}">
                                <div class="team-wager">${wager.value}</div>
                                <i team-buzzed class="${teamIconClasses[wager.team]}"></i>
                            </div>
                        `;

                        buzzedElem.innerHTML += teamElem;
                    })                    
                } else {
                    const buzzedElem = document.querySelector('.card-open [team-buzzed]');
                    buzzedElem.classList = teamIconClasses[message.data.team];
                }
                break;
            case 'show-answer':
                this.ack(message);
                const openCard = document.querySelector('.card-open');
                openCard.classList.add('show-question');
                break;
            case 'question-answered':
                this.ack(message);
                this.setCurrentTurn(message.data.team);
                const currentCard = document.querySelector('.card-open');
                currentCard.classList.remove('card-open');
                currentCard.setAttribute('data-disabled', 'true');
                currentCard.previousElementSibling.remove();
                break;
            case `daily-double-wager`:
                const dailyDoubleDiv = document.querySelector('.card-open');
                dailyDoubleDiv.dataset.value = message.data.value;
                dailyDoubleDiv.querySelector('.question-text').append(document.createElement('hr'));
                dailyDoubleDiv.querySelector('.question-text').append(Object.assign(
                                                                        document.createElement('div'),
                                                                        {
                                                                            innerText: `$ ${message.data.value}`
                                                                        }
                                                                    ));

                dailyDoubleDiv.querySelector('.daily-double').remove();
                dailyDoubleDiv.previousElementSibling.remove();
                
                break;
        
            case `start-final-jeopardy`:
                console.log('message.data', message.data);

                const finalJeopardyDiv = document.querySelector('.card[data-id="final-jeopardy-card"]');
                finalJeopardyDiv.querySelector('.final-jeopardy')?.remove();
                break;

            case 'initiateFinalJeopardy':
                this.timeForFinalJeopardy();
                break;
            case 'score-calculated':
                console.log('score calculated', message.data.scores);
                message.data.scores.forEach(score => {
                    const scoreElem = document.querySelector(`.team-score[data-team-color="${score.team}"]`);
                    scoreElem.querySelector('.team-score-content').innerText = score.score;
                })
                break;
            default:
                console.log('unknown event received: ' + message.data.type);
                break;
        }
    }

    sendEvent(message) {
        this.channel.postMessage(message);
    }

    renderCards() {
        const board = document.getElementById('board');
        board.innerHTML = '';

        this.data.questions.forEach(cat => {
            const catContainer = Object.assign(document.createElement('div'), 
                            { 
                                className: 'category-container', 
                                innerHTML: `<div class="category-label">${cat.categoryName}</div>`
                            });

            board.append(catContainer);

            cat.items.forEach(item => {
                catContainer.append(this.buildCard(item));                
            });

            const categoryLabel = catContainer.querySelector('.category-label');
            // this.autoSizeFont(categoryLabel);
        });
    }

    buildCard(item) {
        const cardStr = `
            <div 
                data-id="${item.id}" 
                data-question="${item.question}" 
                data-answer="${item.answer}" 
                data-value="${item.value}" 
                data-url="${item.url || ''}" 
                data-daily-double="${item.value > 300 ? 'possible' : ''}"
                class="card">
                    <div class="card-value">${item.value}</div>
                    <div class="card-back">                        
                        <div class="answer-text">${item.answer}</div>
                        <div class="question-text">${item.question}</div>
                    </div>
                </div>
        `;
        const card = Object.assign(document.createElement('div'), { innerHTML: cardStr }).children[0];
        const cardBack = card.querySelector('.card-back');

        if (this.isFinal) {
            cardBack.prepend(Object.assign(document.createElement('div'), { innerHTML: '<div class="buzzed-container"></div>' }).children[0])
        } else {
            cardBack.prepend(Object.assign(document.createElement('div'), { innerHTML: '<i team-buzzed></i>' }).children[0])
        }
    
        return card;
    }

    setDailyDouble(itemId) {
        const dailyDoubleCard = document.querySelector(`.card[data-id="${itemId}"]`);
        
        console.log('dailyDoubleCard', dailyDoubleCard)

        dailyDoubleCard.dataset.dailyDouble = 'true';
        const dailyDoubleDiv = Object.assign(
                                document.createElement('div'),
                                { 
                                    className: 'daily-double', 
                                    innerHTML: `Daily Double!`
                                });
        
        dailyDoubleCard.insertBefore(dailyDoubleDiv, dailyDoubleCard.querySelector('.card-back'));
    }

    dailyDoubleWagerClicked(e) {
        e.stopPropagation();

        const wager = document.getElementById('daily-double-wager-input').value;        
        const card = e.currentTarget.closest('.card');

        card.dataset.value = wager;
        card.querySelector('.daily-double').remove();
    }

    autoSizeFont(elem) {
        const container = elem.parentNode;
        let lastWidth;
        while (elem.clientWidth >= container.clientWidth) {
            if (lastWidth == elem.clientWidth) {
                break;
            }

            lastWidth = elem.clientWidth;
            let fontSize = window.getComputedStyle(elem).fontSize;
            elem.style.fontSize = (parseFloat(fontSize) - 1) + 'px';

            if(elem.style.fontSize == '8px') {
                break;
            }
        }
    }

	cardClicked(e) {
        const card = e.currentTarget;
        if (card.matches('.card-open')){

            if (card.matches('[data-id="final-jeopardy-card"]')) {
                const bubbles = Array.from(card?.querySelectorAll('.team-bubble'));
                bubbles.forEach(b => {
                    const scoreDiv = document.querySelector(`.team-score[data-team-color="${b.dataset.teamColor}"]`)?.querySelector('.team-score-content');
                    scoreDiv.innerText = parseInt(scoreDiv.innerText) + parseInt(b.dataset.wager);
                    this.sendEvent({
                        type: 'score',
                        team: b.dataset.teamColor,
                        score: parseInt(scoreDiv.innerText)
                    });
                })
            }

            return;
        }
	}

    timeForFinalJeopardy() {
        this.isFinal = true;
        document.querySelector('.current-turn').classList.remove('current-turn');

        const card = this.buildCard({
            id: 'final-jeopardy-card',
            question: this.data.finalJeopardy.question,
            answer: this.data.finalJeopardy.answer
        });

        const finalJeopardyDiv = Object.assign(
                                    document.createElement('div'), 
                                    { 
                                        className: 'final-jeopardy', 
                                        innerHTML: 'Final Jeopardy!' 
                                    });

        card.insertBefore(finalJeopardyDiv, card.querySelector('.card-back'));

        document.getElementById('board').querySelector('.category-container').append(card);

        card.classList.add('card-open');
        card.previousElementSibling.remove();
    }

    // finalJeopardyWagerClicked(e) {
    //     e.stopPropagation();
    //     const card = e.currentTarget.closest('.card')

    //     const selects = Array.from(card.querySelectorAll('select'));
    //     selects.forEach(select => {
    //         card.setAttribute(`data-value-${input.dataset.teamColor}`, select.value);
    //     });
    //     e.currentTarget.closest('.final-jeopardy').remove();
    // }

    updateScores() {
        const teamScoreElems = Array.from(document.querySelectorAll('.team-score'));
        teamScoreElems.forEach(elem => {
            const correctQuestions = Array.from(document.querySelectorAll(`.card[data-scoring-team="${elem.dataset.teamColor}"]`));
            let totalScore = 0;
            correctQuestions.forEach(q => {
                totalScore += parseInt(q.dataset.value);
            })

            elem.querySelector('.team-score-content').innerText = totalScore;

            this.sendEvent({
                type: 'score',
                team: elem.dataset.teamColor,
                score: totalScore
            });
        })
    }

    animation;
    previousEndDegree = 0;
    spinWheel() {
        const wheel = document.querySelector('.ui-wheel-of-fortune ul');

        if (this.animation) {
            this.animation.cancel(); // Reset the animation if it already exists
        }
    
        const randomAdditionalDegrees = Math.random() * 360 + 1800;
        const newEndDegree = this.previousEndDegree + randomAdditionalDegrees;
        const teams = ['orange', 'red', 'purple', 'blue', 'green', 'yellow']

        const winner = teams[Math.floor((newEndDegree % 360) / 60)];
        this.animation = wheel.animate([
          { transform: `rotate(${this.previousEndDegree}deg)` },
          { transform: `rotate(${newEndDegree}deg)` }
        ], {
          duration: 4000, // TODO: 4000
          direction: 'normal',
          easing: 'cubic-bezier(0.440, -0.205, 0.000, 1.130)',
          fill: 'forwards',
          iterations: 1
        });

        setTimeout(() => {
            const bellsAudio = new Audio("https://cdn.freesound.org/previews/411/411420_6014995-lq.mp3");
            bellsAudio.play();            
        }, 2000);


        setTimeout(() => {
            this.sendEvent({type: 'team-start', team: winner });
            document.querySelector('.ui-wheel-of-fortune').remove();
            this.setCurrentTurn(winner);
        }, 7500) // TODO: 7500
    
        this.previousEndDegree = newEndDegree;
    }

    setCurrentTurn(teamColor) {
        const scoreElem = document.querySelector(`.teams .team-score[data-team-color="${teamColor}"]`);

        if (scoreElem) {
            Array.from(document.querySelectorAll('.team-score')).forEach(elem => elem.classList.remove('current-turn'));
            scoreElem.classList.add('current-turn');
        }
    }
}