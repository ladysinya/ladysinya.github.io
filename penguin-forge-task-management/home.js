class Home {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_family_feud_broadcast_channel');
    qNumber = 0;
    
    async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e))
    }

    messageEventListener(message) {
        console.log('event', message);
    }

    client = google.accounts.oauth2.initTokenClient({
        client_id: '289591580550-pqcno3nk8e0sbajcfmuucq3ng47o3gve.apps.googleusercontent.com',
        callback: (tokenResponse) => {
          console.log('callback triggered', tokenResponse)
          if (tokenResponse && tokenResponse.access_token) {
            gapi.client.setApiKey('AIzaSyC9vfSA9xMiMB6WFRJ-dLIyMZsqz5gfkb8');
            gapi.client.load('calendar', 'v3', listUpcomingEvents);
          }
        },
      });
}