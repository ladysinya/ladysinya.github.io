class Jeopardy {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');
    theme = 'halloween'

	async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e));
        // const peer = new Peer('ladysinya-github-io-jeopardy-peer-main');

        // peer.on('open', function(id) {
        //     console.log('My peer ID is: ' + id);
        // });
        // peer.on('error', function(err) {
        //     console.log(err);
        // });
        // peer.on('connection', function(conn) { debugger; console.log('Connected to ' + conn.peer); });

        // const conn = await peer.connect('ladysinya-github-io-jeopardy-peer-aux'); 
        // conn.on('open', function() {
        //     console.log('connection opened');
        //     // Receive messages
        //     conn.on('data', function(data) {
        //       console.log('Received', data);
        //     });
        
        //     // Send messages
        //     conn.send('Hello!');
        //   });

        //   conn.send({
        //     test: 'this is a test',
        //     more: 'more test'
        // })

        await fetch('./data.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.data = JSON.parse(responseContent)[this.theme];
            });

        this.renderCards();
	}

    messageEventListener(message) {
        switch (message.data.type) {
            case `daily-double-wager`:
                const dailyDoubleDiv = document.querySelector('.card[data-daily-double="true"]');
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
        
            case `final-jeopardy-wager`:
                const finalJeopardyDiv = document.querySelector('.card[data-id="final-jeopardy-card"]');
                
                let wagerValueDivs = '';
                message.data.values.forEach(value => {
                     wagerValueDivs += `<div class="final-jeopardy-wager-value">${value.value}</div>`
                });

                finalJeopardyDiv.querySelector('.question-text').append(document.createElement('hr'));
                finalJeopardyDiv.querySelector('.question-text').append(Object.assign(
                                                                        document.createElement('div'),
                                                                        {
                                                                            className: 'final-jeopardy-wager-values',
                                                                            innerHTML: wagerValueDivs
                                                                        }
                                                                    ));

                finalJeopardyDiv.querySelector('.final-jeopardy').remove();
                break;
            default:
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
            question: card.dataset.question
        });

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

    finalJeopardyWagerClicked(e) {
        e.stopPropagation();
        const card = e.currentTarget.closest('.card')

        const selects = Array.from(card.querySelectorAll('select'));
        selects.forEach(select => {
            card.setAttribute(`data-value-${input.dataset.teamColor}`, select.value);
        });
        e.currentTarget.closest('.final-jeopardy').remove();

        this.resetTimer(card.querySelector('.timer'));
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

            this.sendEvent({
                type: 'score',
                team: elem.dataset.teamColor,
                score: totalScore
            });
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