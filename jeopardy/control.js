class JeopardyControl {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');

	async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e));

        // const peer = new Peer('ladysinya-github-io-jeopardy-peer-aux');
        // peer.on('open', function(id) {
        //     console.log('My peer ID is: ' + id);
        // });
        // peer.on('connection', function(conn) { console.log('Connected to ' + conn.peer); });
        // const conn = peer.connect('ladysinya-github-io-jeopardy-peer-main');
        // conn.on('open', function() {
        //     // Send messages
        //     conn.send('Hello!');
        //   });

        // conn.on('data', function(data) {
        //     console.log('Received', data);
        // });

        // conn.on('error', function(data) {
        //     console.log('error', data);
        // })

        await fetch('./data.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.data = JSON.parse(responseContent);
            });
        
        document.getElementById('daily-double-wager-button').addEventListener('click', () => {
            this.sendEvent({
                type: 'daily-double-wager',
                value: document.getElementById('daily-double-wager-select').value
            });
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
	}

    messageEventListener(message) {        
        switch (message.data.type) {
            case 'score':
                document.querySelector(`.team-score[data-team-color="${message.data.team}"]`).innerText = `${message.data.score}`;
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
                console.log('final-jeopardy');
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

	questionClicked(e) {
		
	}
}