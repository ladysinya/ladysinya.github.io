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

        this.renderQuestions();

        document.getElementById('player-add-btn').addEventListener('click', this.addPlayerBtnClicked.bind(this));
	}

    messageEventListener(message) {
        console.log('event', message);
    }

    sendEvent(message) {
        this.channel.postMessage(message);
    }

    renderQuestions() {
        const board = document.getElementById('board');
        board.innerHTML = '';

        this.data.forEach((cat, i) => {
            const catDiv = `
                <div class="category-container" data-category-count="${i + 1}">
                    <div>${cat.categoryName}</div>
                </div>
            `;

            board.append(Object.assign(document.createElement('div'), { innerHTML: catDiv }).children[0]);

            const catContainer = board.querySelector(`.category-container[data-category-count="${i + 1}"]`);
            cat.items.forEach(item => {
                const card = `
                    <div data-question="${item.question}" data-answer="${item.answer}">${item.value}</div>
                `;

                catContainer.append(Object.assign(document.createElement('div'), { innerHTML: card }).children[0]);
            })
        });
    }

    addPlayerBtnClicked(e) {

    }

	questionClicked(e) {
        const playersContainer = document.getElementById('players');
		
	}
}