class Jeopardy {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');

	async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e));

        await fetch('./data.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.data = JSON.parse(responseContent);
            });

        this.renderCards();
	}

    messageEventListener(message) {
        console.log('event', message);
    }

    sendEvent(message) {
        this.channel.postMessage(message);
    }

    renderCards() {
        const board = document.getElementById('board');
        board.innerHTML = '';

        this.data.forEach((cat, i) => {
            const catDiv = `
                <div class="category-container" data-category-count="${i + 1}">
                    <div class="category-label">${cat.categoryName}</div>
                </div>
            `;

            board.append(Object.assign(document.createElement('div'), { innerHTML: catDiv }).children[0]);

            const catContainer = board.querySelector(`.category-container[data-category-count="${i + 1}"]`);
            cat.items.forEach(item => {
                const card = `
                    <div 
                        data-id="${item.id}" 
                        data-question="${item.question}" 
                        data-answer="${item.answer}" 
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

                // <div class="question-icon"><i class="fa-duotone fa-solid fa-cauldron"></i></div>

                const cardElem = Object.assign(document.createElement('div'), { innerHTML: card }).children[0];
                catContainer.append(cardElem);
                cardElem.querySelector('.timer').addEventListener('click', this.timerClicked.bind(this));
                cardElem.querySelector('.timer').addEventListener('dblclick', this.timerDblClicked.bind(this));

                const bubbles = Array.from(cardElem.querySelectorAll('.team-bubble'));
                bubbles.forEach(bubble => {
                    bubble.addEventListener('click', this.bubbleClicked.bind(this));
                })
            })

            const categoryLabel = catContainer.querySelector('.category-label');
            this.autoSizeFont(categoryLabel);
        });

        const cards = Array.from(board.querySelectorAll('.card'));
        cards.forEach(card => {
            card.addEventListener('click', this.cardClicked.bind(this))
        })

        const ddCards = cards.filter(c => c.dataset.dailyDouble == 'possible');
        const dailyDouble = ddCards[Math.floor(Math.random() * ddCards.length)]
        dailyDouble.dataset.dailyDouble = 'true';
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
            if (card.hasAttribute('data-scoring-team')) {
                // const teamColor = card.getAttribute('data-scoring-team');
                // const value = parseInt(card.querySelector('.card-value').innerHTML);
                // const teamScoreElem = document.querySelector(`.team-score[data-team-color="${teamColor}"]`);
                // if(teamScoreElem) {
                //     let teamScore = parseInt(teamScoreElem.innerText);
                //     teamScoreElem.innerText = teamScore + value;
                // }

                this.updateScores();

                card.setAttribute('data-disabled', 'true');
            }

            card.classList.remove('card-open');
            card.previousElementSibling.remove();
            return;
        }

        Array.from(document.querySelectorAll('.card-open')).forEach(openCard => {
            openCard.previousElementSibling.remove();
            openCard.classList.remove('card-open');
        });

        const value = card.querySelector('.card-value').innerHTML;
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

    bubbleClicked(e) {
        e.stopPropagation();

        const card = e.currentTarget.closest('.card');
        const teamColor = e.currentTarget.dataset.teamColor;

        card.classList.add('show-question');
        card.setAttribute('data-scoring-team', teamColor);
    }

    updateScores() {
        const teamScoreElems = Array.from(document.querySelectorAll('.team-score'));
        teamScoreElems.forEach(elem => {
            const correctQuestions = Array.from(document.querySelectorAll(`.card[data-scoring-team="${elem.dataset.teamColor}"]`));
            let totalScore = 0;
            correctQuestions.forEach(q => {
                totalScore += parseInt(q.querySelector('.card-value').innerText);
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