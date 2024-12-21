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
                const buzzedElem = document.querySelector('.card-open [team-buzzed]');
                switch (message.data.team) {
                    case 'red':
                        buzzedElem.classList = 'fa-duotone fa-thin fa-candy-cane';
                        break;
                    case 'orange':
                        buzzedElem.classList = 'fa-duotone fa-thin fa-bells';
                        break;
                    case 'yellow':
                        buzzedElem.classList = 'fa-duotone fa-thin fa-stars';
                        break;
                    case 'green':
                        buzzedElem.classList = 'fa-duotone fa-thin fa-tree-christmas';
                        break;
                    case 'blue':
                        buzzedElem.classList = 'fa-duotone fa-light fa-snowflakes';
                        break;
                    case 'purple':
                        buzzedElem.classList = 'fa-duotone fa-light fa-gifts';
                        break;
                    case 'none':
                        buzzedElem.classList = 'fa-duotone fa-regular fa-x-mark';
                        break;                
                    default:
                        break;
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

                const finalCheck = document.querySelector('.card:not([data-disabled="true"])');
                if (finalCheck == null) {
                    this.sendEvent({
                        type: 'initiateFinalJeopardy'
                    })
                }

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
                
                break;
        
            // case `final-jeopardy-wager`:
            //     console.log('message.data', message.data);

            //     const finalJeopardyDiv = document.querySelector('.card[data-id="final-jeopardy-card"]');
            //     const bubbles = Array.from(finalJeopardyDiv?.querySelectorAll('.team-bubble'));

            //     bubbles.forEach(bubble => {
            //         const teamValue = message.data.values.find(value => value.team == bubble.dataset.teamColor);
            //         bubble.dataset.wager = teamValue?.value;
            //     });

            //     finalJeopardyDiv.querySelector('.final-jeopardy')?.remove();
            //     break;
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

        this.data.questions.forEach((cat, i) => {
            const catDiv = `
                <div class="category-container" data-category-count="${i + 1}">
                    <div class="category-label">${cat.categoryName}</div>
                </div>
            `;

            board.append(Object.assign(document.createElement('div'), { innerHTML: catDiv }).children[0]);

            const catContainer = board.querySelector(`.category-container[data-category-count="${i + 1}"]`);
            cat.items.forEach(item => {
                catContainer.append(this.buildCard(item));                
            });

            const categoryLabel = catContainer.querySelector('.category-label');
            this.autoSizeFont(categoryLabel);
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
                        <i team-buzzed></i>
                        <div class="answer-text">${item.answer}</div>
                        <div class="question-text">${item.question}</div>
                    </div>
                </div>
        `;

        const card = Object.assign(document.createElement('div'), { innerHTML: cardStr }).children[0];

        return card;
    }

    setDailyDouble(itemId) {
        const dailyDoubleCard = document.querySelector(`.card[data-id="${itemId}"`);

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
            // switch (card.dataset.scoringTeam) {
            //     case 'none':
            //             if(card.dataset.dailyDouble == 'true') {
            //                 card.dataset.scoringTeam = this.lastTeam;
            //                 card.dataset.value = `-${card.dataset.value}`;
            //             }

            //             card.setAttribute('data-disabled', 'true');
            //         break;
            //     case null:                    
            //         break;
            //     default:
            //         card.setAttribute('data-disabled', 'true');
            //     break;
            // }
                
            this.updateScores();
            // card.classList.remove('card-open');
            // card.previousElementSibling.remove();

            // const finalCheck = document.querySelector('.card:not([data-disabled="true"])');
            // if (finalCheck == null) {
            //     this.timeForFinalJeopardy();
            // }

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

        Array.from(document.querySelectorAll('.card-open')).forEach(openCard => {
            openCard.previousElementSibling.remove();
            openCard.classList.remove('card-open');
        });

        if (card.dataset.dailyDouble == 'true') {
            this.sendEvent({
                type: 'double-jeopardy',
                team: this.lastTeam,
            });

            const bubbleContainer = card.querySelector(`.team-bubbles`);
            bubbleContainer.style = 'grid-template-columns: 1fr 1fr'
            const otherBubbles = Array.from(card.querySelectorAll(`.team-bubble:not([data-team-color="${this.lastTeam}"],[data-team-color="none"])`));
            otherBubbles.forEach(bubble => {
                bubble.remove();
            });
        }

        this.sendEvent({
            type: 'Question',
            value: card.dataset.value,
            answer: card.dataset.answer,
            question: card.dataset.question,
            url: card.dataset.url
        });

        // const value = card.querySelector('.card-value').innerText;
        // const style = window.getComputedStyle(card);

        // const disabledCard = `
        //     <div class="card" data-disabled height="${style.height}" width="${style.width}">
        //         <div class="card-value">${value}</div>
        //     </div>
        // `

        // card.parentNode.insertBefore(Object.assign(document.createElement('div'), { innerHTML: disabledCard }).children[0], card);
        // card.classList.add('card-open');
	}

    timeForFinalJeopardy() {
        const card = this.buildCard({
            id: 'final-jeopardy-card',
            question: this.data.finalJeopardy.question,
            answer: this.data.finalJeopardy.answer
        });

        this.sendEvent({
            type: 'final-jeopardy',
            value: 'final',
            answer: this.data.finalJeopardy.answer,
            question: this.data.finalJeopardy.question
        });

        const finalJeopardyDiv = Object.assign(
                                    document.createElement('div'), 
                                    { 
                                        className: 'final-jeopardy', 
                                        innerHTML: 'Final Jeopardy!' 
                                    });

        card.insertBefore(finalJeopardyDiv, card.querySelector('.card-back'));

        document.getElementById('board').querySelector('.category-container').append(card);

        card.click();
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

    // lastTeam = 'red';
    // bubbleClicked(e) {
    //     e.stopPropagation();

    //     const card = e.currentTarget.closest('.card');
    //     if (card.matches('[data-id="final-jeopardy-card"]')) {
    //         e.currentTarget.classList.add('show-wager');
    //     } else {
    //         const teamColor = e.currentTarget.dataset.teamColor;
    //         card.setAttribute('data-scoring-team', teamColor);
    //         this.lastTeam = teamColor == 'none' ? this.lastTeam : teamColor;
    //         card.classList.add('show-question');
    //     }
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
          duration: 400, // TODO: 4000
          direction: 'normal',
          easing: 'cubic-bezier(0.440, -0.205, 0.000, 1.130)',
          fill: 'forwards',
          iterations: 1
        });

        setTimeout(() => {
            this.sendEvent({type: 'team-start', team: winner });
            document.querySelector('.ui-wheel-of-fortune').remove();
            this.setCurrentTurn(winner);
        }, 750) // TODO: 7500
    
        this.previousEndDegree = newEndDegree;
    }

    setCurrentTurn(teamColor) {
        Array.from(document.querySelectorAll('.team-score')).forEach(elem => elem.classList.remove('current-turn'));
        document.querySelector(`.teams .team-score[data-team-color="${teamColor}"]`).classList.add('current-turn');
    }
}