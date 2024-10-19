class JeopardyControl {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_jeopardy_broadcast_channel');

	async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e));

        await fetch('./data.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.data = JSON.parse(responseContent);
            });
	}

    messageEventListener(message) {
        console.log('event', message);
    }

    sendEvent(message) {
        this.channel.postMessage(message);
    }

	questionClicked(e) {
		
	}
}