class HTScript {
    data;
    // channel = new BroadcastChannel('ladysinya.github.io_holiday_tasks_broadcast_channel');
    
    async init() {
        // this.channel.addEventListener('message', e => this.messageEventListener(e))
        
        await fetch('./data.json')
        .then(async (response) => {
            let responseContent = await response.text();
            this.data = JSON.parse(responseContent);

            console.log(this.data);
        });
        
        alert(JSON.stringify(this.data));
    }

    // messageEventListener(message) {
    //     console.log('event', message);

    //     if(message.data == 'next-question') {
    //         this.loadNextQuestion();
    //     }

    //     if(message.data.includes('show-answer')){
    //         const index = message.data.replace('show-answer-', '');
    //         this.showAnswer(parseInt(index));
    //     }
    // }
}