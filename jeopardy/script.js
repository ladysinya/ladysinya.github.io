class Jeopardy {
    data;
    // channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');
    theme = 'halloween'

	async init() {
        // this.channel.addEventListener('message', e => this.messageEventListener(e));

        await fetch('./data.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.data = JSON.parse(responseContent)[this.theme];
            });

        this.renderCards();
	}

    // messageEventListener(message) {
    //     console.log('event', message);
    // }

    // sendEvent(message) {
    //     this.channel.postMessage(message);
    // }

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
        
        this.setDailyDouble();
    }

    buildCard(item) {
        const cardStr = `
            <div 
                data-id="${item.id}" 
                data-question="${item.question}" 
                data-answer="${item.answer}" 
                data-value="${item.value}" 
                data-daily-double="${item.value > 300 ? 'possible' : ''}"
                class="card">
                    <div class="card-value">${item.value}</div>
                    <div class="card-back">
                        <div class="timer">15</div>
                        <div class="answer-text">${item.answer}</div>
                        <div class="question-text">${item.question}</div>
                        <div class="team-bubbles">
                            <div data-team-color="red" class="team-bubble"></div>
                            <div data-team-color="orange" class="team-bubble"></div>
                            <div data-team-color="yellow" class="team-bubble"></div>
                            <div data-team-color="green" class="team-bubble"></div>
                            <div data-team-color="blue" class="team-bubble"></div>
                            <div data-team-color="purple" class="team-bubble"></div>
                            <div data-team-color="none" class="team-bubble"><i class="fa-duotone fa-solid fa-xmark"></i></div>
                        </div>
                    </div>
                </div>
        `;

        const card = Object.assign(document.createElement('div'), { innerHTML: cardStr }).children[0];
        card.querySelector('.timer').addEventListener('click', this.timerClicked.bind(this));
        card.querySelector('.timer').addEventListener('dblclick', this.timerDblClicked.bind(this));
        card.addEventListener('click', this.cardClicked.bind(this))

        const bubbles = Array.from(card.querySelectorAll('.team-bubble'));
        bubbles.forEach(bubble => {
            bubble.addEventListener('click', this.bubbleClicked.bind(this));
        })
        
        return card;
    }

    setDailyDouble() {
        const possibleDailyDoubleCards = Array.from(board.querySelectorAll('.card[data-daily-double="possible"]'));
        const dailyDoubleCard = possibleDailyDoubleCards[Math.floor(Math.random() * possibleDailyDoubleCards.length)];

        dailyDoubleCard.dataset.dailyDouble = 'true';
        const dailyDoubleDiv = Object.assign(
                                document.createElement('div'),
                                { 
                                    className: 'daily-double', 
                                    innerHTML: `
                                        <div class="daily-double-label">Daily Double!</div>
                                        <label>What is your wager?</label>
                                        <div class="input-group">
                                            <input type="number" id="daily-double-wager-input">
                                        </div>
                                        <button id="daily-double-wager-button">Let's do this!</button>
                                    `
                                });
        
        dailyDoubleCard.insertBefore(dailyDoubleDiv, dailyDoubleCard.querySelector('.card-back'));
        document.getElementById('daily-double-wager-button').addEventListener('click', this.dailyDoubleWagerClicked.bind(this));
        document.getElementById('daily-double-wager-input').addEventListener('click', (e) => { e.stopPropagation(); });
    }

    dailyDoubleWagerClicked(e) {
        e.stopPropagation();

        const wager = document.getElementById('daily-double-wager-input').value;        
        const card = e.currentTarget.closest('.card');

        card.dataset.value = wager;
        card.querySelector('.daily-double').remove();

        this.resetTimer(card.querySelector('.timer'));
    }

    autoSizeFont(elem) {
        const container = elem.parentNode;
        while (elem.clientWidth >= container.clientWidth) {
            let fontSize = window.getComputedStyle(elem).fontSize;
            elem.style.fontSize = (parseFloat(fontSize) - 1) + 'px';
        }
    }

	cardClicked(e) {
        const card = e.currentTarget;
        if (card.matches('.card-open')){
            switch (card.dataset.scoringTeam) {
                case 'none':
                        if(card.dataset.dailyDouble == 'true') {
                            card.dataset.scoringTeam = this.lastTeam;
                            card.dataset.value = `-${card.dataset.value}`;
                        }

                        card.setAttribute('data-disabled', 'true');
                    break;
                case null:                    
                    break;
                default:
                    card.setAttribute('data-disabled', 'true');
                break;
            }
                
            this.updateScores();
            card.classList.remove('card-open');
            card.previousElementSibling.remove();

            const finalCheck = document.querySelector('.card:not([data-disabled="true"])');
            if (finalCheck == null) {
                this.timeForFinalJeopardy();
            }

            return;
        }

        Array.from(document.querySelectorAll('.card-open')).forEach(openCard => {
            openCard.previousElementSibling.remove();
            openCard.classList.remove('card-open');
        });

        if (card.dataset.dailyDouble == 'true') {
            const otherBubbles = Array.from(card.querySelectorAll(`.team-bubble:not([data-team-color="${this.lastTeam}"],[data-team-color="none"])`));
            otherBubbles.forEach(bubble => {
                bubble.remove();
            });
        }

        const value = card.querySelector('.card-value').innerText;
        const style = window.getComputedStyle(card);

        const disabledCard = `
            <div class="card" data-disabled height="${style.height}" width="${style.width}">
                <div class="card-value">${value}</div>
            </div>
        `

        card.parentNode.insertBefore(Object.assign(document.createElement('div'), { innerHTML: disabledCard }).children[0], card);
        card.classList.add('card-open');

        setTimeout(() => {
            card.querySelector('.timer').click();
        }, 15000);
	}

    timeForFinalJeopardy() {
        const card = `
            <div 
                data-id="${item.id}" 
                data-question="${item.question}" 
                data-answer="${item.answer}" 
                data-value="${item.value}" 
                data-daily-double="${item.value > 300 ? 'possible' : ''}"
                class="card">
                    <div class="card-value">${item.value}</div>
                    <div class="card-back">
                        <div class="timer">15</div>
                        <div class="answer-text">${item.answer}</div>
                        <div class="question-text">${item.question}</div>
                        <div class="team-bubbles">
                            <div data-team-color="red" class="team-bubble"></div>
                            <div data-team-color="orange" class="team-bubble"></div>
                            <div data-team-color="yellow" class="team-bubble"></div>
                            <div data-team-color="green" class="team-bubble"></div>
                            <div data-team-color="blue" class="team-bubble"></div>
                            <div data-team-color="purple" class="team-bubble"></div>
                            <div data-team-color="none" class="team-bubble"><i class="fa-duotone fa-solid fa-xmark"></i></div>
                        </div>
                    </div>
                </div>
        `;
    }

    lastTeam = 'red';
    bubbleClicked(e) {
        e.stopPropagation();

        const card = e.currentTarget.closest('.card');
        const teamColor = e.currentTarget.dataset.teamColor;

        card.classList.add('show-question');
        card.setAttribute('data-scoring-team', teamColor);
        this.lastTeam = teamColor == 'none' ? this.lastTeam : teamColor;
    }

    updateScores() {
        const teamScoreElems = Array.from(document.querySelectorAll('.team-score'));
        teamScoreElems.forEach(elem => {
            const correctQuestions = Array.from(document.querySelectorAll(`.card[data-scoring-team="${elem.dataset.teamColor}"]`));
            let totalScore = 0;
            correctQuestions.forEach(q => {
                totalScore += parseInt(q.dataset.value);
            })

            elem.innerText = totalScore;
        })
    }

    // Timer Stuff
    timer;
    
    timerClicked(e) {
        e.stopPropagation();
        const timeDisplay = e.currentTarget;
        if(timeDisplay.dataset.isRunning) {
            this.stopTimer(timeDisplay);
        } else {
            this.startTimer(timeDisplay);
        }
    }

    timerDblClicked(e) {
        e.stopPropagation();
        this.resetTimer(e.currentTarget);
    }
    
    startTimer(timeDisplay) {
        timeDisplay.dataset.isRunning = true;
        this.timer = setInterval(() => {
            let seconds = parseInt(timeDisplay.textContent)
            seconds--;
            timeDisplay.textContent = seconds;

            if (seconds == 0) {
                timeDisplay.removeAttribute('data-is-running');
                clearInterval(this.timer);
            }
        }, 1000);
    }

    stopTimer(timeDisplay) {
        timeDisplay.removeAttribute('data-is-running');
        clearInterval(this.timer);
    }

    resetTimer(timeDisplay) {
        this.stopTimer(timeDisplay);
        timeDisplay.textContent = 15;
    }
}